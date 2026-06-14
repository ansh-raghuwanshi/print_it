import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
 
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
 
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
 
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
 
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      match: [/^[6-9][0-9]{9}$/, "Invalid phone number"],
    },
 
    role: {
      type: String,
      enum: ["student", "shopkeeper","admin"],
      required: [true, "Role is required"],
    },
 
    // students only
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      default: null,
    },
 
    collegeIdNumber: {
      type: String,
      trim: true,
      default: null,
    },
 
    // shopkeepers only
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      default: null,
    },
 
    isActive: {
      type: Boolean,
      default: true,
    },
 
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
 
    emailVerificationToken: {
      type: String,
      default: null,
      select: false,
    },
 
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
  },
  { timestamps: true }
)
 
userSchema.index({ role: 1 })
userSchema.index({ collegeId: 1 })
 
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return
  this.password = await bcrypt.hash(this.password, 10)
})
 
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password)
}
 
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { userId: this._id, role: this.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" }
  )
}
 
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { userId: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
  )
}
 
export const User = mongoose.model("User", userSchema)