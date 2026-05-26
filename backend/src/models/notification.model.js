import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // Who receives this notification
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    
    
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      // "Order Ready for Pickup"
      // "Order Rejected"
      // "Low Stock Alert"
    },

    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      // "Your order #1042 is ready. Come pick it up!"
      // "Your order #1042 was rejected: Shop is closed"
      // "Only 3 Pens left in stock"
    },

    
    // used on frontend to show different icons per notification type
    
    type: {
      type: String,
      required: [true, "Type is required"],
      enum: [
        "ORDER_PLACED",
        "ORDER_ACCEPTED",
        "ORDER_READY",
        "ORDER_COMPLETED",
        "ORDER_REJECTED",
        "ORDER_CANCELLED",
        "ORDER_TIMEOUT",
        "LOW_STOCK",
      ],
    },

    
    isRead: {
      type: Boolean,
      default: false,
      // flipped to true when user opens the notification
      // used to show unread count badge in UI
    },

    // Auto Deletion
    // MongoDB TTL index automatically deletes documents
    // when the current time passes this field's value
    // no background job needed — MongoDB handles it natively
    deleteAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      // 1 day from creation
      // notifications are real time alerts, not history
      // after 1 day they are irrelevant
    },
  },

  { timestamps: true }
);

// ─── TTL Index ────────────────────────────────────────────────────
// TTL = Time To Live
// MongoDB watches this index and automatically deletes documents
// when Date.now() passes the deleteAt value
// runs MongoDB's internal cleanup every 60 seconds
// no cron job or background job needed for notifications
notificationSchema.index({ deleteAt: 1 }, { expireAfterSeconds: 0 });
// expireAfterSeconds: 0 means "delete exactly when deleteAt is reached"
// the actual expiry time is controlled by the deleteAt field value

// ─── Other Indexes ────────────────────────────────────────────────
notificationSchema.index({ userId: 1, createdAt: -1 });
// GET /api/notifications → user's notifications newest first

notificationSchema.index({ userId: 1, isRead: 1 });
// GET unread count → how many unread notifications does this user have
// used for the notification badge in the UI

export const Notification = mongoose.model("Notification", notificationSchema);