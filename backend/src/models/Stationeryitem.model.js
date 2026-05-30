import mongoose from "mongoose";

const stationeryItemSchema = new mongoose.Schema(
  {
    //owner
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: [true, "Shop is required"],
    },

    
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Pens & Pencils",
        "Files & Folders",
        "Paper",
        "Notebooks",
        "Lab Items",
        "Other",
      ],
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },

    
    image: {
      url: {
        type: String,
        default: null,
        // cloudinary URL
      },
      publicId: {
        type: String,
        default: null,
        // cloudinary public ID — needed to delete the image later
      },
    },

    

    realStock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
      
    },

    bufferPercent: {
      type: Number,
      default: 20,
      min: [0, "Buffer cannot be negative"],
      max: [50, "Buffer cannot exceed 50%"],
      
    },

    
    isAvailable: {
      type: Boolean,
      default: true,
      // shopkeeper can toggle availability
    },

    //low stock alert
    lowStockAlert: {
      type: Number,
      default: 5,
      min: [0, "Alert threshold cannot be negative"],
     
    },

    
    lastRestockedAt: {
      type: Date,
      default: null,
      
    },
  },

  { timestamps: true }
);

// ─── Virtual: visibleStock ────────────────────────────────────────
// calculated on the fly, never stored in database
// this is what students see
// virtuals are included in .toJSON() and .toObject() calls
// when you do res.json(item), visibleStock is automatically included

stationeryItemSchema.virtual("visibleStock").get(function () {
  const buffer = Math.ceil(this.realStock * (this.bufferPercent / 100));
  return Math.max(0, this.realStock - buffer);
});

// needed for virtuals to show up in JSON responses
stationeryItemSchema.set("toJSON", { virtuals: true });
stationeryItemSchema.set("toObject", { virtuals: true });

//automatic availability toggle
stationeryItemSchema.pre("save", async function () {
  if (this.realStock === 0) {
    this.isAvailable = false
  }
})


stationeryItemSchema.index({ shopId: 1 });

stationeryItemSchema.index({ shopId: 1, isAvailable: 1 });

stationeryItemSchema.index({ shopId: 1, category: 1 });


export const StationeryItem = mongoose.model(
  "StationeryItem",
  stationeryItemSchema
);