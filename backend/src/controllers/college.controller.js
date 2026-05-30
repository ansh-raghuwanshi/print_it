import { asyncHandler } from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import { College } from "../models/colleges.model.js"
import { Shop } from "../models/shop.model.js"

const searchColleges = asyncHandler(async (req, res) => {
  const { q } = req.query

  if (!q || q.trim() === "") {
    throw new ApiError(400, "Search query is required")
  }

  const colleges = await College.find({
    $text: { $search: q },
    status: "ACTIVE",
  }).limit(10)

  return res
  .status(200)
  .json(
    new ApiResponse(200, { colleges }, "Colleges fetched successfully")
  )
})

const getShopsByCollege = asyncHandler(async (req, res) => {
  const { id } = req.params

  const shops = await Shop.find({
    collegeId: id,
    status: "ACTIVE",
    isOpen: true,
  }).select("name address phone isOpen")

  return res
  .status(200)
  .json(
    new ApiResponse(200, { shops }, "Shops fetched successfully")
  )
})

export { searchColleges, getShopsByCollege }