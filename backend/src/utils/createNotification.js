import { Notification } from "../models/notification.model.js"

const createNotification = async ({ userId, orderId = null, title, message, type }) => {
  try {
    await Notification.create({ userId, orderId, title, message, type })
  } catch (error) {
    // notification failure should never break the main flow
    // just log it and continue
    console.error("Notification creation failed:", error.message)
  }
}

export default createNotification