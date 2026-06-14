import { asyncHandler } from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import { Order } from "../models/order.model.js"
import { StationeryItem } from "../models/Stationeryitem.model.js"
import { Shop } from "../models/shop.model.js"
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"
import { getPdfPageCount, generateSeparatorPage, mergePdfs } from "../utils/pdfService.js"
import razorpay from "../utils/razorpay.js"
import crypto from "crypto"
import fs from "fs"
import path from "path"
import os from "os"
import {createNotification} from "../utils/createNotification.js"
import { Notification } from "../models/notification.model.js"

// HELPER: Calculate print cost for one print job

const calculatePrintCost = (pages, printOptions, pricing) => {
  const { color, doubleSided, copies } = printOptions

  let pricePerUnit
  let units

  if (doubleSided) {
    units = Math.ceil(pages / 2)
    pricePerUnit = color
      ? pricing.colorDoubleSided
      : pricing.bwDoubleSided
  } else {
    units = pages
    pricePerUnit = color
      ? pricing.colorSingleSided
      : pricing.bwSingleSided
  }

  return units * pricePerUnit * copies
}


// STEP 1 — CALCULATE ORDER
// POST /api/orders/calculate
//
// Student uploads PDFs + selects options
// Backend reads page count, generates merged PDFs, calculates cost
// Returns cost breakdown for student to review before paying
// ─────────────────────────────────────────────────────────────────
const calculateOrder = asyncHandler(async (req, res) => {
  const files = req.files

  if (!files || files.length === 0) {
    throw new ApiError(400, "At least one PDF file is required")
  }

  const { shopId, printJobs, stationeryItems } = req.body

  // validate shop
  const shop = await Shop.findById(shopId).select("status isOpen printPricing name")
  if (!shop) throw new ApiError(404, "Shop not found")
  if (shop.status !== "ACTIVE") throw new ApiError(400, "Shop is not active")
  if (!shop.isOpen) throw new ApiError(400, "Shop is currently closed")

  // parse printJobs
  const parsedPrintJobs = typeof printJobs === "string"
    ? JSON.parse(printJobs)
    : printJobs

  if (!parsedPrintJobs || parsedPrintJobs.length !== files.length) {
    throw new ApiError(400, "Print options required for each uploaded file")
  }

  // parse stationery
  const parsedStationery = stationeryItems
    ? typeof stationeryItems === "string"
      ? JSON.parse(stationeryItems)
      : stationeryItems
    : []

  // validate and price stationery
  let stationeryTotal = 0
  const stationeryOrderItems = []

  for (const item of parsedStationery) {
    const stationeryItem = await StationeryItem.findById(item.itemId)
    if (!stationeryItem) throw new ApiError(404, "Item not found")
    if (!stationeryItem.isAvailable) {
      throw new ApiError(400, `${stationeryItem.name} is not available`)
    }
    if (stationeryItem.visibleStock < item.quantity) {
      throw new ApiError(400, `Not enough stock for ${stationeryItem.name}`)
    }
    stationeryTotal += stationeryItem.price * item.quantity
    stationeryOrderItems.push({
      itemId: stationeryItem._id,
      itemName: stationeryItem.name,
      quantity: item.quantity,
      priceAtOrderTime: stationeryItem.price,
    })
  }

  // ── PASS 1: get page counts and calculate costs ───────────────
  // do NOT generate separator pages yet — total is unknown
  const processedFiles = []
  let printTotal = 0

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const printOptions = parsedPrintJobs[i]

    let pageCount
    try {
      pageCount = await getPdfPageCount(file.path)
    } catch (error) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path)
      throw new ApiError(400, `${file.originalname} is corrupt or invalid. Please re-upload.`)
    }

    const fileCost = calculatePrintCost(pageCount, printOptions, shop.printPricing)
    printTotal += fileCost

    processedFiles.push({
      originalFileName: file.originalname,
      filePath: file.path,
      pages: pageCount,
      cost: fileCost,
      printOptions: {
        color: printOptions.color,
        doubleSided: printOptions.doubleSided,
        copies: printOptions.copies,
      },
      notes: printOptions.notes || null,
    })
  }

  // ── PASS 2: now total is known — generate separator + merge + upload
  const totalAmount = printTotal + stationeryTotal
  const uploadedFiles = []

  for (let i = 0; i < processedFiles.length; i++) {
    const file = processedFiles[i]

    // generate separator with correct totalAmount
    const separatorPageBytes = await generateSeparatorPage({
      studentName: req.user.name,
      studentPhone: req.user.phone,
      date: new Date().toLocaleString("en-IN"),
      files: processedFiles.map(f => ({
        name: f.originalFileName,
        pages: f.pages,
        printOptions: f.printOptions,
      })),
      stationeryItems: stationeryOrderItems,
      totalAmount,  // ← correct total
    })

    // merge separator + student PDF
    let mergedPdfBytes
    try {
      mergedPdfBytes = await mergePdfs(separatorPageBytes, file.filePath)
    } catch (error) {
      if (fs.existsSync(file.filePath)) fs.unlinkSync(file.filePath)
      throw new ApiError(400, `${file.originalFileName} could not be processed. Please re-upload.`)
    }

    // save merged PDF to temp file
    const tempMergedPath = path.join(os.tmpdir(), `merged_${Date.now()}_${i}.pdf`)
    fs.writeFileSync(tempMergedPath, mergedPdfBytes)

    // upload to cloudinary
    const uploaded = await uploadToCloudinary(tempMergedPath)
    if (!uploaded) {
      if (fs.existsSync(file.filePath)) fs.unlinkSync(file.filePath)
      throw new ApiError(500, "File upload failed. Please try again.")
    }

    // delete original temp file
    if (fs.existsSync(file.filePath)) fs.unlinkSync(file.filePath)

    uploadedFiles.push({
      originalFileName: file.originalFileName,
      fileUrl: uploaded.secure_url,
      filePublicId: uploaded.public_id,
      pages: file.pages,
      cost: file.cost,
      printOptions: file.printOptions,
      notes: file.notes,
    })
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        shopName: shop.name,
        files: uploadedFiles,
        stationeryItems: stationeryOrderItems,
        printTotal,
        stationeryTotal,
        totalAmount,
        tempOrderData: {
          shopId,
          processedFiles: uploadedFiles,
          stationeryItems: stationeryOrderItems,
          totalAmount,
        },
      },
      "Order calculated successfully. Proceed to payment."
    )
  )
})

// ─────────────────────────────────────────────────────────────────
// STEP 2 — CONFIRM ORDER (after payment)
// POST /api/orders/confirm
//
// Student confirms cost breakdown and pays
// Frontend sends back tempOrderData from calculate step
// Backend verifies payment and creates order
// ─────────────────────────────────────────────────────────────────
const confirmOrder = asyncHandler(async (req, res) => {
  const {
    tempOrderData,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  } = req.body

  if (!tempOrderData) {
    throw new ApiError(400, "Order data is required")
  }

  // verify razorpay payment signature
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex")

  if (expectedSignature !== razorpaySignature) {
    throw new ApiError(400, "Invalid payment. Please contact support.")
  }

  const { shopId, processedFiles, stationeryItems, totalAmount } = tempOrderData
  const shop = await Shop.findById(tempOrderData.shopId).select("ownerId")

  // build print jobs array for database
  const printJobs = processedFiles.map((file) => ({
    originalFileName: file.originalFileName,
    fileUrl: file.fileUrl,
    filePublicId: file.filePublicId,
    mergedFileUrl: file.fileUrl,       // already merged at calculate step
    mergedFilePublicId: file.filePublicId,
    printOptions: file.printOptions,
    notes: file.notes,
  }))

  // create order in database
  const order = await Order.create({
    studentId: req.user._id,
    shopId,
    printJobs,
    stationeryItems,
    totalAmount,
    status: "PENDING",
    payment: {
      method: "ONLINE",
      status: "PAID",
      razorpayOrderId,
      razorpayPaymentId,
      paidAt: new Date(),
    },
    timeline: {
      placedAt: new Date(),
    },
    timeoutAt: new Date(Date.now() + 15 * 60 * 1000),
    // 15 minutes from now — if shopkeeper doesn't respond, order times out
  })

  //notification after order is placed
   await createNotification({
    userId: shop.ownerId,
    orderId: order._id,
    title: "New Order Received",
    message: `New order #${order.orderNumber} from ${req.user.name}`,
    type: "ORDER_PLACED",
  })



  // deduct stationery stock now that payment is confirmed
  for (const item of stationeryItems) {
    await StationeryItem.findByIdAndUpdate(item.itemId, {
      $inc: { realStock: -item.quantity },
    })
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      { order },
      "Order placed successfully. Waiting for shop to accept."
    )
  )
})

// ─────────────────────────────────────────────────────────────────
// INITIATE RAZORPAY PAYMENT
// POST /api/orders/initiate-payment
//
// Called before /confirm
// Creates a Razorpay order and returns order ID to frontend
// Frontend uses this to open Razorpay checkout popup
// ─────────────────────────────────────────────────────────────────
const initiatePayment = asyncHandler(async (req, res) => {
  const { totalAmount } = req.body

  if (!totalAmount || totalAmount <= 0) {
    throw new ApiError(400, "Valid amount is required")
  }

  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(totalAmount * 100), // paise
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  })

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      },
      "Payment initiated"
    )
  )
})

// ─────────────────────────────────────────────────────────────────
// GET MY ORDERS (Student)
// GET /api/orders/mine
// ─────────────────────────────────────────────────────────────────
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ studentId: req.user._id })
    .sort({ createdAt: -1 })
    .select("orderNumber status totalAmount timeline createdAt shopId")
    .populate("shopId", "name")

  return res.status(200).json(
    new ApiResponse(200, { orders }, "Orders fetched successfully")
  )
})

// ─────────────────────────────────────────────────────────────────
// GET SINGLE ORDER
// GET /api/orders/:id
// ─────────────────────────────────────────────────────────────────
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("studentId", "name email phone")
    .populate("shopId", "name address phone")

  if (!order) throw new ApiError(404, "Order not found")

  // students can only see their own orders
  if (
    req.user.role === "student" &&
    order.studentId._id.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "Access denied")
  }

  // shopkeepers can only see their shop's orders
  if (
    req.user.role === "shopkeeper" &&
    order.shopId._id.toString() !== req.user.shopId.toString()
  ) {
    throw new ApiError(403, "Access denied")
  }

  return res.status(200).json(
    new ApiResponse(200, { order }, "Order fetched successfully")
  )
})

// ─────────────────────────────────────────────────────────────────
// CANCEL ORDER (Student)
// DELETE /api/orders/:id
// Only allowed when status is PENDING
// ─────────────────────────────────────────────────────────────────
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)

  if (!order) throw new ApiError(404, "Order not found")

  if (order.studentId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Access denied")
  }

  if (order.status !== "PENDING") {
    throw new ApiError(400, "Only pending orders can be cancelled")
  }

  // refund payment
  await razorpay.payments.refund(order.payment.razorpayPaymentId, {
    amount: Math.round(order.totalAmount * 100),
  })

  // restore stationery stock
  for (const item of order.stationeryItems) {
    await StationeryItem.findByIdAndUpdate(item.itemId, {
      $inc: { realStock: item.quantity },
    })
  }

  order.status = "CANCELLED"
  order.payment.status = "REFUNDED"
  order.timeline.cancelledAt = new Date()
  await order.save()

  // notification after order is cancelled
  const shop = await Shop.findById(order.shopId).select("ownerId")
  await createNotification({
    userId: shop.ownerId,
    orderId: order._id,
    title: "Order Cancelled",
    message: `Order #${order.orderNumber} was cancelled by the student.`,
    type: "ORDER_CANCELLED",
  })

  return res.status(200).json(
    new ApiResponse(200, null, "Order cancelled and refund initiated.")
  )
})

// ─────────────────────────────────────────────────────────────────
// GET SHOP ORDERS (Shopkeeper)
// GET /api/orders/shop
// ─────────────────────────────────────────────────────────────────
const getShopOrders = asyncHandler(async (req, res) => {
  const { status } = req.query

  const filter = { shopId: req.user.shopId }
  if (status) filter.status = status

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .populate("studentId", "name phone")

  return res.status(200).json(
    new ApiResponse(200, { orders }, "Orders fetched successfully")
  )
})

// ─────────────────────────────────────────────────────────────────
// ACCEPT ORDER (Shopkeeper)
// PATCH /api/orders/:id/accept
//
// Merged PDF already generated at upload time
// Just return the mergedFileUrl for browser print dialog
// ─────────────────────────────────────────────────────────────────
const acceptOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    shopId: req.user.shopId,
  }).populate("studentId", "name phone")

  if (!order) throw new ApiError(404, "Order not found")

  if (order.status !== "PENDING") {
    throw new ApiError(400, "Only pending orders can be accepted")
  }

  order.status = "ACCEPTED"
  order.timeline.acceptedAt = new Date()
  await order.save()

  // notification after order is accepted
  await createNotification({
  userId: order.studentId,
  orderId: order._id,
  title: "Order Accepted",
  message: `Your order #${order.orderNumber} has been accepted and is being printed.`,
  type: "ORDER_ACCEPTED",
  })

  // return merged PDF URLs for all print jobs
  // frontend opens browser print dialog with these
  const printFiles = order.printJobs.map((job) => ({
    fileName: job.originalFileName,
    mergedFileUrl: job.mergedFileUrl,
    copies: job.printOptions.copies,
  }))

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        order,
        printFiles,
        // frontend uses printFiles to open browser print dialog
        stationeryItems: order.stationeryItems,
        // shown in the Done popup so shopkeeper knows what to pack
      },
      "Order accepted. Print files ready."
    )
  )
})

// ─────────────────────────────────────────────────────────────────
// REJECT ORDER (Shopkeeper)
// PATCH /api/orders/:id/reject
// ─────────────────────────────────────────────────────────────────
const rejectOrder = asyncHandler(async (req, res) => {
  const { rejectionReason, rejectionNote } = req.body

  if (!rejectionReason) {
    throw new ApiError(400, "Rejection reason is required")
  }

  const order = await Order.findOne({
    _id: req.params.id,
    shopId: req.user.shopId,
  })

  if (!order) throw new ApiError(404, "Order not found")

  if (order.status !== "PENDING") {
    throw new ApiError(400, "Only pending orders can be rejected")
  }

  // refund payment
  await razorpay.payments.refund(order.payment.razorpayPaymentId, {
    amount: Math.round(order.totalAmount * 100),
  })

  // restore stationery stock
  for (const item of order.stationeryItems) {
    await StationeryItem.findByIdAndUpdate(item.itemId, {
      $inc: { realStock: item.quantity },
    })
  }

  order.status = "REJECTED"
  order.rejectionReason = rejectionReason
  order.rejectionNote = rejectionNote || null
  order.payment.status = "REFUNDED"
  order.timeline.rejectedAt = new Date()
  await order.save()

  // notification after order is rejected
  await createNotification({
  userId: order.studentId,
  orderId: order._id,
  title: "Order Rejected",
  message: `Your order #${order.orderNumber} was rejected. Reason: ${rejectionReason}. A full refund has been initiated.`,
  type: "ORDER_REJECTED",
  })

  return res.status(200).json(
    new ApiResponse(200, null, "Order rejected and refund initiated.")
  )
})

// ─────────────────────────────────────────────────────────────────
// MARK READY (Shopkeeper)
// PATCH /api/orders/:id/ready
//
// Shopkeeper clicks Done in the popup after printing
// ─────────────────────────────────────────────────────────────────
const markReady = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    shopId: req.user.shopId,
  })

  if (!order) throw new ApiError(404, "Order not found")

  if (order.status !== "ACCEPTED") {
    throw new ApiError(400, "Only accepted orders can be marked as ready")
  }

  order.status = "READY"
  order.timeline.readyAt = new Date()
  await order.save()

  // notification after order is ready for pickup
  await createNotification({
  userId: order.studentId,
  orderId: order._id,
  title: "Order Ready for Pickup",
  message: `Your order #${order.orderNumber} is ready. Please come to the shop to pick it up.`,
  type: "ORDER_READY",
  })

  return res.status(200).json(
    new ApiResponse(200, null, "Order marked as ready for pickup.")
  )
})

// ─────────────────────────────────────────────────────────────────
// MARK COMPLETED (Shopkeeper)
// PATCH /api/orders/:id/complete
//
// Student picked up the order
// Triggers file deletion after 30 minutes
// ─────────────────────────────────────────────────────────────────
const markCompleted = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    shopId: req.user.shopId,
  })

  if (!order) throw new ApiError(404, "Order not found")

  if (order.status !== "READY") {
    throw new ApiError(400, "Only ready orders can be marked as completed")
  }

  order.status = "COMPLETED"
  order.timeline.completedAt = new Date()
  // deleteFilesAt is set automatically by pre-save hook in Order model
  await order.save()

  return res.status(200).json(
    new ApiResponse(200, null, "Order completed successfully.")
  )
})

export {
  calculateOrder,
  initiatePayment,
  confirmOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getShopOrders,
  acceptOrder,
  rejectOrder,
  markReady,
  markCompleted,
}