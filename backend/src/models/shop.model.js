import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    
    name: {
      type: String,
      required: [true, "Shop name is required"],
      trim: true,
    },

    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: [true, "College is required"],
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },

    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^[6-9][0-9]{9}$/, "Invalid phone number"],
    },

   
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "INACTIVE", "REJECTED"],
      default: "PENDING",
    },

    // reason shown to shopkeeper if rejected
    rejectionReason: {
      type: String,
      default: null,
    },

    // shopkeeper can temporarily close their shop
    isOpen: {
      type: Boolean,
      default: true,
    },

    //Subscription 
    subscription: {
      status: {
        type: String,
        enum: ["TRIAL", "ACTIVE", "INACTIVE"],
        default: "TRIAL",
      },
      startDate: {
        type: Date,
        default: Date.now,
      },
      endDate: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        // 30 day trial by default
      },
    },

    // Approval tracking 
    approvedAt: {
      type: Date,
      default: null,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      // ref to admin user who approved
    },
    printPricing: {
  bwSingleSided:    { type: Number, default: 1   },
  bwDoubleSided:    { type: Number, default: 1.5 },
  colorSingleSided: { type: Number, default: 5   },
  colorDoubleSided: { type: Number, default: 8   },
 }
  },

  { timestamps: true }
);


shopSchema.index({ collegeId: 1 });


shopSchema.index({ status: 1 });
// filter active shops quickly

shopSchema.index({ collegeId: 1, status: 1 });
// compound index — most common query:
// "give me all ACTIVE shops at this college"
// much faster than two separate indexes for this query

export const Shop = mongoose.model("Shop", shopSchema);