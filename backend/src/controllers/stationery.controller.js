import { asyncHandler } from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import { StationeryItem } from "../models/Stationeryitem.model.js"

// shopkeeper — get all their items
const getMyItems = asyncHandler(async (req, res) => {
  const items = await StationeryItem.find({ shopId: req.user.shopId })

  return res.status(200).json(
    new ApiResponse(200, { items }, "Items fetched successfully")
  )
})

// shopkeeper — add new item
const addItem = asyncHandler(async (req, res) => {
  const { name, category, price, realStock, bufferPercent, lowStockAlert } = req.body

  if ([name, category].some((field) => !field || field.trim() === "")) {
    throw new ApiError(400, "Name and category are required")
  }

  if (!price || price < 0) {
    throw new ApiError(400, "Valid price is required")
  }

  const item = await StationeryItem.create({
    shopId: req.user.shopId,
    name: name.trim(),
    category,
    price,
    realStock: realStock || 0,
    bufferPercent: bufferPercent || 20,
    lowStockAlert: lowStockAlert || 5,
  })

  return res.status(201).json(
    new ApiResponse(201, { item }, "Item added successfully")
  )
})

// shopkeeper — edit item details
const updateItem = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { name, category, price, bufferPercent, lowStockAlert } = req.body

  // make sure item belongs to this shop
  const item = await StationeryItem.findOne({
    _id: id,
    shopId: req.user.shopId,
  })

  if (!item) {
    throw new ApiError(404, "Item not found")
  }

  // only update provided fields
  const updateFields = {}
  if (name && name.trim() !== "") updateFields.name = name.trim()
  if (category) updateFields.category = category
  if (price !== undefined && price >= 0) updateFields.price = price
  if (bufferPercent !== undefined) updateFields.bufferPercent = bufferPercent
  if (lowStockAlert !== undefined) updateFields.lowStockAlert = lowStockAlert

  if (Object.keys(updateFields).length === 0) {
    throw new ApiError(400, "No valid fields provided to update")
  }

  const updatedItem = await StationeryItem.findByIdAndUpdate(
    id,
    updateFields,
    { returnDocument: "after", runValidators: true }
  )

  return res.status(200).json(
    new ApiResponse(200, { item: updatedItem }, "Item updated successfully")
  )
})

// shopkeeper — restock item
const restockItem = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { realStock } = req.body

  if (realStock === undefined || realStock < 0) {
    throw new ApiError(400, "Valid stock quantity is required")
  }

  const item = await StationeryItem.findOne({
    _id: id,
    shopId: req.user.shopId,
  })

  if (!item) {
    throw new ApiError(404, "Item not found")
  }

  item.realStock = realStock
  item.lastRestockedAt = new Date()

  // if restocking, make available again
  if (realStock > 0) {
    item.isAvailable = true
  }

  await item.save()

  return res.status(200).json(
    new ApiResponse(200, { item }, "Item restocked successfully")
  )
})

// shopkeeper — toggle availability
const toggleAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params

  const item = await StationeryItem.findOne({
    _id: id,
    shopId: req.user.shopId,
  })

  if (!item) {
    throw new ApiError(404, "Item not found")
  }

  // prevent turning on if no stock
  if (!item.isAvailable && item.realStock === 0) {
    throw new ApiError(400, "Cannot make item available with zero stock. Please restock first.")
  }

  item.isAvailable = !item.isAvailable
  await item.save()

  return res.status(200).json(
    new ApiResponse(
      200,
      { isAvailable: item.isAvailable },
      `Item is now ${item.isAvailable ? "available" : "unavailable"}`
    )
  )
})

// shopkeeper — delete item
const deleteItem = asyncHandler(async (req, res) => {
  const { id } = req.params

  const item = await StationeryItem.findOneAndDelete({
    _id: id,
    shopId: req.user.shopId,
  })

  if (!item) {
    throw new ApiError(404, "Item not found")
  }

  return res.status(200).json(
    new ApiResponse(200, null, "Item deleted successfully")
  )
})

// student — get available items at a shop
const getShopItems = asyncHandler(async (req, res) => {
  const { shopId } = req.params

  const items = await StationeryItem.find({
    shopId,
    isAvailable: true,
  }).select("name category price visibleStock image")

  return res.status(200).json(
    new ApiResponse(200, { items }, "Items fetched successfully")
  )
})

export {
  getMyItems,
  addItem,
  updateItem,
  restockItem,
  toggleAvailability,
  deleteItem,
  getShopItems,
}