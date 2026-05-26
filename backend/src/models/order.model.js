import mongoose from "mongoose";

// ─────────────────────────────────────────────────────────────────
// Counter Schema
// A single document that keeps track of the last orderNumber used
// Using MongoDB's atomic $inc to prevent race conditions
//
// Usage in order creation:
// const counter = await Counter.findOneAndUpdate(
//   { _id: "orderNumber" },
//   { $inc: { value: 1 } },
//   { new: true, upsert: true }
// )
// const orderNumber = counter.value
// ─────────────────────────────────────────────────────────────────

const counterSchema = new mongoose.Schema({
  _id: {
    type: String,
   
  },
  value: {
    type: Number,
    default: 1000,
    // orders start from 1001
    
  },
});

export const Counter = mongoose.model("Counter", counterSchema);



// Order Schema


const orderSchema = new mongoose.Schema(
  {
    // Readable Order Number 
    orderNumber: {
      type: Number,
      unique: true,
      // generated atomically from Counter before save
      // this is what students and shopkeepers say out loud
      
    },

    //Who and Where 
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student is required"],
    },

    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: [true, "Shop is required"],
    },

    // Print Jobs
    // Each file the student uploads is one print job
    // Each has its own print options
    // All files in one order share one separator page
    
    // Separator page structure (generated on acceptance):
    // START PAGE → Order number, student name, list of all files
    // [file1 pages][file2 pages][file3 pages]
    // END PAGE   → Order number, student name
    //
    // Student is responsible for separating their own files
    // within the printed stack

    printJobs: [
      {
        // File Info
        originalFileName: {
          type: String,
          required: true,
          // "assignment3.pdf" — shown to shopkeeper
        },

        fileUrl: {
          type: String,
          required: true,
          // cloudinary URL of the original uploaded file
        },

        filePublicId: {
          type: String,
          required: true,
          // cloudinary public ID — needed to delete file after 30 min
        },

        mergedFileUrl: {
          type: String,
          default: null,
          // cloudinary URL of the merged PDF
          // (separator pages + all student files combined)
          // generated when shopkeeper accepts the order
          // this is what gets sent to browser print dialog
          // only one merged file per order (not per print job)
          // stored on the first printJob, null on the rest
        },

        mergedFilePublicId: {
          type: String,
          default: null,
          // cloudinary public ID of merged file — for deletion
        },

        // ── Print Options ──
        printOptions: {
          color: {
            type: Boolean,
            required: true,
            // true = color, false = black & white
          },

          doubleSided: {
            type: Boolean,
            required: true,
            // true = double sided, false = single sided
          },

          copies: {
            type: Number,
            required: true,
            min: [1, "At least 1 copy required"],
            max: [50, "Maximum 50 copies allowed"],
          },
        },

        notes: {
          type: String,
          default: null,
          trim: true,
          maxlength: [200, "Notes cannot exceed 200 characters"],
          // optional instructions for this specific file
          // "Please print only pages 1-5"
          // "This file needs to be stapled separately"
        },
      },
    ],

    // Stationery Items
    // Items the student wants to buy along with the print order
    // No partial fulfillment in V1 — all or nothing

    stationeryItems: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "StationeryItem",
        },

        itemName: {
          type: String,
          required: true,
          // stored at order time
          // if shopkeeper renames the item later, this order still
          // shows the original name
        },

        quantity: {
          type: Number,
          required: true,
          min: [1, "Quantity must be at least 1"],
        },

        priceAtOrderTime: {
          type: Number,
          required: true,
          // stored at order time
          // if shopkeeper changes the price tomorrow,
          // this order still shows the original price
          // NEVER use current item price for old orders
        },
      },
    ],

    // ─── Order Status ────────────────────────────────────────────
    // One status for the whole order
    //
    // PENDING   → paid and submitted, shopkeeper hasn't responded
    // ACCEPTED  → shopkeeper accepted, printing in progress
    // READY     → printed, student can come pick up
    // COMPLETED → student picked up, order closed
    // REJECTED  → shopkeeper rejected, full refund triggered
    // CANCELLED → student cancelled (PENDING only), full refund
    // TIMEOUT   → shopkeeper didn't respond in time, full refund

    status: {
      type: String,
      enum: [
        "PENDING",
        "ACCEPTED",
        "READY",
        "COMPLETED",
        "REJECTED",
        "CANCELLED",
        "TIMEOUT",
      ],
      default: "PENDING",
    },

    // reason shown to student when order is rejected
    // shopkeeper must pick one — cannot reject without reason
    rejectionReason: {
      type: String,
      enum: [
        "Shop is closed",
        "File cannot be printed",
        "Item out of stock",
        "Too many orders right now",
        "Other",
      ],
      default: null,
    },

    // free text when rejection reason is "Other"
    rejectionNote: {
      type: String,
      default: null,
      trim: true,
      maxlength: [200, "Rejection note cannot exceed 200 characters"],
    },

    //Amount 
    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
      // calculated before order is created:
      // sum of (copies × per page cost) for each print job
      // + sum of (quantity × priceAtOrderTime) for stationery
      // stored so it never changes even if prices change later
    },

    // Payment
    payment: {
      method: {
        type: String,
        enum: ["ONLINE", "AT_PICKUP"],
        required: true,
      },

      status: {
        type: String,
        enum: ["PENDING", "PAID", "REFUNDED"],
        default: "PENDING",
        // PENDING  → payment initiated but not confirmed yet
        // PAID     → Razorpay confirmed payment
        // REFUNDED → full refund processed
      },

      razorpayOrderId: {
        type: String,
        default: null,
        // generated when student initiates payment
        // format: "order_abc123xyz"
      },

      razorpayPaymentId: {
        type: String,
        default: null,
        // received after student completes payment
        // format: "pay_xyz789abc"
        // THIS is what you pass to razorpay.payments.refund()
      },

      paidAt: {
        type: Date,
        default: null,
        // timestamp when Razorpay confirmed payment
      },

      refundedAt: {
        type: Date,
        default: null,
        // timestamp when refund was processed
      },
    },

    //File Deletion 
    deleteFilesAt: {
      type: Date,
      default: null,
      // set to (completedAt + 30 minutes) when order is COMPLETED
      // your background job checks this and deletes files from
      // cloudinary when this timestamp is reached
      // protects student privacy, saves storage costs
    },

    filesDeleted: {
      type: Boolean,
      default: false,
      // flipped to true after background job deletes the files
      // prevents double deletion attempts
    },

    
    // timestamps of every status change
    

    timeline: {
      placedAt: {
        type: Date,
        default: Date.now,
        // when student submitted the order
      },

      acceptedAt: {
        type: Date,
        default: null,
        // when shopkeeper clicked Accept
      },

      readyAt: {
        type: Date,
        default: null,
        // when shopkeeper clicked Done (printed)
      },

      completedAt: {
        type: Date,
        default: null,
        // when shopkeeper clicked Complete (student picked up)
        // deleteFilesAt = completedAt + 30 minutes
      },

      cancelledAt: {
        type: Date,
        default: null,
        // when student cancelled
      },

      rejectedAt: {
        type: Date,
        default: null,
        // when shopkeeper rejected
      },
    },

    // ─── Timeout ─────────────────────────────────────────────────
    timeoutAt: {
      type: Date,
      
    },
  },

  { timestamps: true }
);

// ─── Pre-save: generate orderNumber ──────────────────────────────
// Atomically increments the counter and assigns the next number
// Runs only when creating a new order (not on updates)

orderSchema.pre("save", async function (next) {
  if (!this.isNew) return next();
  // isNew is true only on first save, not on updates
  // this prevents regenerating orderNumber on every update

  try {
    const counter = await Counter.findOneAndUpdate(
      { _id: "orderNumber" },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
      // upsert: true → creates the counter document if it doesn't exist yet
      // new: true → returns the updated document (with new value)
    );

    this.orderNumber = counter.value;
    next();
  } catch (error) {
    next(error);
  }
});

// ─── Pre-save: set deleteFilesAt when order is completed 
orderSchema.pre("save", function (next) {
  if (
    this.isModified("status") &&
    this.status === "COMPLETED" &&
    this.timeline.completedAt &&
    !this.deleteFilesAt
  ) {
    // 30 minutes after completion, files should be deleted
    this.deleteFilesAt = new Date(
      this.timeline.completedAt.getTime() + 30 * 60 * 1000
    );
  }
  next();
});

// ─── Indexes ──────────────────────────────────────────────────────

orderSchema.index({ studentId: 1, createdAt: -1 });
// GET /api/orders/mine → student's orders newest first
// compound: filter by student AND sort by date in one index

orderSchema.index({ shopId: 1, status: 1, createdAt: -1 });
// GET /api/orders/shop → shopkeeper sees their orders
// compound: filter by shop AND status AND sort newest first

orderSchema.index({ status: 1, timeoutAt: 1 });
// background job query: find PENDING orders past their timeoutAt
// runs every minute to check for timed out orders

orderSchema.index({ filesDeleted: 1, deleteFilesAt: 1 });
// background job query: find completed orders ready for file deletion
// filesDeleted: false AND deleteFilesAt <= now

orderSchema.index({ orderNumber: 1 });
// look up order by human readable number
// "find order 1042"

export const Order = mongoose.model("Order", orderSchema);