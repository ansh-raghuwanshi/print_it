import { asyncHandler } from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import { Shop } from "../models/shop.model.js"

const getMyShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.user.shopId)
    .populate("collegeId", "name city state")

  if (!shop) {
    throw new ApiError(404, "Shop not found")
  }

  return res.status(200).json(
    new ApiResponse(200, { shop }, "Shop fetched successfully")
  )
})

const updateShop = asyncHandler(async (req, res) => {
  const { name, address, phone } = req.body

  const updateFields = {}
  if (name && name.trim() !== "") updateFields.name = name.trim()
  if (address && address.trim() !== "") updateFields.address = address.trim()
  if (phone && phone.trim() !== "") updateFields.phone = phone.trim()

  if (Object.keys(updateFields).length === 0) {
    throw new ApiError(400, "No valid fields provided to update")
  }

  const shop = await Shop.findByIdAndUpdate(
    req.user.shopId,
    updateFields,
    { returnDocument: 'after', runValidators: true }
  )

  if (!shop) {
    throw new ApiError(404, "Shop not found")
  }

  return res.status(200).json(
    new ApiResponse(200, { shop }, "Shop updated successfully")
  )
})

const toggleShopStatus = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.user.shopId)

  if (!shop) {
    throw new ApiError(404, "Shop not found")
  }

  shop.isOpen = !shop.isOpen
  await shop.save()

  return res.status(200).json(
    new ApiResponse(
      200,
      { isOpen: shop.isOpen },
      `Shop is now ${shop.isOpen ? "open" : "closed"}`
    )
  )
})

const updatePricing = asyncHandler(async (req, res) => {
  const { bwSingleSided, bwDoubleSided, colorSingleSided, colorDoubleSided } = req.body

  const updateFields = {}
  if (bwSingleSided !== undefined) updateFields["printPricing.bwSingleSided"] = bwSingleSided
  if (bwDoubleSided !== undefined) updateFields["printPricing.bwDoubleSided"] = bwDoubleSided
  if (colorSingleSided !== undefined) updateFields["printPricing.colorSingleSided"] = colorSingleSided
  if (colorDoubleSided !== undefined) updateFields["printPricing.colorDoubleSided"] = colorDoubleSided

  if (Object.keys(updateFields).length === 0) {
    throw new ApiError(400, "No pricing fields provided")
  }

  const shop = await Shop.findByIdAndUpdate(
    req.user.shopId,
    updateFields,
    { returnDocument: "after", runValidators: true }
  )

  if (!shop) throw new ApiError(404, "Shop not found")

  return res.status(200).json(
    new ApiResponse(200, { shop }, "Pricing updated successfully")
  )
})

export { getMyShop, updateShop, toggleShopStatus,updatePricing }