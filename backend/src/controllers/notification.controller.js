import { asyncHandler } from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import { Notification } from "../models/notification.model.js"

const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 })

  return res.status(200).json(
    new ApiResponse(200, { notifications }, "Notifications fetched successfully")
  )
})

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    userId: req.user._id,
  })

  if (!notification) throw new ApiError(404, "Notification not found")

  notification.isRead = true
  await notification.save()

  return res.status(200).json(
    new ApiResponse(200, null, "Notification marked as read")
  )
})

const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { isRead: true }
  )

  return res.status(200).json(
    new ApiResponse(200, null, "All notifications marked as read")
  )
})

const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    userId: req.user._id,
    isRead: false,
  })

  return res.status(200).json(
    new ApiResponse(200, { count }, "Unread count fetched")
  )
})

export { getNotifications, markAsRead, markAllAsRead, getUnreadCount }