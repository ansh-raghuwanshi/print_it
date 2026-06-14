import { asyncHandler } from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import { College } from "../models/colleges.model.js"
import { Shop } from "../models/shop.model.js"
import { User } from "../models/user.model.js"
import createNotification from "../utils/createNotification.js"
import sendEmail from "../utils/sendEmail.js"
import { shopkeeperApprovalTemplate, shopkeeperRejectionTemplate } from "../utils/emailTemplates.js"

// ── Get pending colleges ──────────────────────────────────────────
const getPendingColleges = asyncHandler(async (req, res) => {
  const colleges = await College.find({ status: "PENDING" })
    .sort({ createdAt: -1 })
    .populate("createdBy", "name email")

  return res.status(200).json(
    new ApiResponse(200, { colleges }, "Pending colleges fetched")
  )
})

// ── Approve college ───────────────────────────────────────────────
const approveCollege = asyncHandler(async (req, res) => {
  const college = await College.findById(req.params.id)
  if (!college) throw new ApiError(404, "College not found")
  if (college.status === "ACTIVE") {
    throw new ApiError(400, "College is already active")
  }

  college.status = "ACTIVE"
  college.approvedAt = new Date()
  await college.save()

  return res.status(200).json(
    new ApiResponse(200, { college }, "College approved successfully")
  )
})

// ── Get all shops (filter by status) ─────────────────────────────
const getShops = asyncHandler(async (req, res) => {
  const { status } = req.query
  const filter = status ? { status } : {}

  const shops = await Shop.find(filter)
    .sort({ createdAt: -1 })
    .populate("collegeId", "name city")
    .populate("ownerId", "name email phone")

  return res.status(200).json(
    new ApiResponse(200, { shops }, "Shops fetched successfully")
  )
})

// ── Approve shop ──────────────────────────────────────────────────
const approveShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id)
    .populate("ownerId", "name email")

  if (!shop) throw new ApiError(404, "Shop not found")
  if (shop.status === "ACTIVE") {
    throw new ApiError(400, "Shop is already active")
  }

  shop.status = "ACTIVE"
  shop.approvedAt = new Date()
  shop.approvedBy = req.user._id
  await shop.save()

  // send approval email to shopkeeper
  const template = shopkeeperApprovalTemplate({
    name: shop.ownerId.name,
    shopName: shop.name,
  })
  await sendEmail({
    to: shop.ownerId.email,
    subject: template.subject,
    html: template.html,
  })

  // send in-app notification to shopkeeper
  await createNotification({
    userId: shop.ownerId._id,
    title: "Shop Approved!",
    message: `Your shop ${shop.name} has been approved. You can now start receiving orders.`,
    type: "ORDER_PLACED", // reusing closest type for now
  })

  return res.status(200).json(
    new ApiResponse(200, { shop }, "Shop approved successfully")
  )
})

// ── Reject shop ───────────────────────────────────────────────────
const rejectShop = asyncHandler(async (req, res) => {
  const { reason } = req.body

  if (!reason || reason.trim() === "") {
    throw new ApiError(400, "Rejection reason is required")
  }

  const shop = await Shop.findById(req.params.id)
    .populate("ownerId", "name email")

  if (!shop) throw new ApiError(404, "Shop not found")
  if (shop.status === "REJECTED") {
    throw new ApiError(400, "Shop is already rejected")
  }

  shop.status = "REJECTED"
  shop.rejectionReason = reason
  await shop.save()

  // send rejection email to shopkeeper
  const template = shopkeeperRejectionTemplate({
    name: shop.ownerId.name,
    shopName: shop.name,
    reason,
  })
  await sendEmail({
    to: shop.ownerId.email,
    subject: template.subject,
    html: template.html,
  })

  return res.status(200).json(
    new ApiResponse(200, null, "Shop rejected successfully")
  )
})

// ── Update shop subscription ──────────────────────────────────────
const updateSubscription = asyncHandler(async (req, res) => {
  const { status, endDate } = req.body

  if (!status) throw new ApiError(400, "Subscription status is required")

  const shop = await Shop.findByIdAndUpdate(
    req.params.id,
    {
      "subscription.status": status,
      ...(endDate && { "subscription.endDate": new Date(endDate) }),
    },
    { returnDocument: "after" }
  )

  if (!shop) throw new ApiError(404, "Shop not found")

  // if subscription inactive → deactivate shop
  if (status === "INACTIVE") {
    shop.status = "INACTIVE"
    await shop.save()
  }

  return res.status(200).json(
    new ApiResponse(200, { shop }, "Subscription updated successfully")
  )
})

export {
  getPendingColleges,
  approveCollege,
  getShops,
  approveShop,
  rejectShop,
  updateSubscription,
}