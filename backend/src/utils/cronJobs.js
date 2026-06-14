import cron from "node-cron"
import { Order } from "../models/order.model.js"
import { StationeryItem } from "../models/Stationeryitem.model.js"
import { deleteFromCloudinary } from "./cloudinary.js"
import createNotification from "./createNotification.js"
import razorpay from "./razorpay.js"

const startCronJobs = () => {

  // ── Job 1: Handle timed out orders ─────────────────────────────
  cron.schedule("* * * * *", async () => {
    try {
      const timedOutOrders = await Order.find({
        status: "PENDING",
        timeoutAt: { $lt: new Date() },
      })

      for (const order of timedOutOrders) {
        // refund payment
        try {
          await razorpay.payments.refund(order.payment.razorpayPaymentId, {
            amount: Math.round(order.totalAmount * 100),
          })
        } catch (refundError) {
          console.error(`Refund failed for order ${order.orderNumber}:`, refundError.message)
        }

        // restore stationery stock
        for (const item of order.stationeryItems) {
          await StationeryItem.findByIdAndUpdate(item.itemId, {
            $inc: { realStock: item.quantity },
          })
        }

        // update order status
        order.status = "TIMEOUT"
        order.payment.status = "REFUNDED"
        await order.save()

        // notify student
        await createNotification({
          userId: order.studentId,
          orderId: order._id,
          title: "Order Timed Out",
          message: `Your order #${order.orderNumber} was not accepted in time. A full refund has been initiated.`,
          type: "ORDER_TIMEOUT",
        })

        console.log(`Order ${order.orderNumber} timed out and refunded`)
      }
    } catch (error) {
      console.error("Timeout cron job error:", error.message)
    }
  })

  // ── Job 2: Delete files after 30 minutes of completion ─────────
  cron.schedule("* * * * *", async () => {
    try {
      const ordersToClean = await Order.find({
        filesDeleted: false,
        deleteFilesAt: { $lt: new Date() },
        status: "COMPLETED",
      })

      for (const order of ordersToClean) {
        // delete all files from cloudinary
        for (const job of order.printJobs) {
          if (job.filePublicId) {
            await deleteFromCloudinary(job.filePublicId)
          }
          if (job.mergedFilePublicId) {
            await deleteFromCloudinary(job.mergedFilePublicId)
          }
        }

        order.filesDeleted = true
        await order.save()

        console.log(`Files deleted for order ${order.orderNumber}`)
      }
    } catch (error) {
      console.error("File deletion cron job error:", error.message)
    }
  })

  console.log("Cron jobs started")
}

export default startCronJobs