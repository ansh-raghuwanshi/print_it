import { asyncHandler } from "../utils/asyncHandler.js"
import Apiresponse from "../utils/ApiResponse.js"
import Apierror from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { College } from "../models/colleges.model.js"
import crypto from "crypto"
import sendEmail from "../utils/sendEmail.js"
import { verificationEmailTemplate } from "../utils/emailTemplates.js"
import { Shop } from "../models/shop.model.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"


const registerStudent=asyncHandler(async(req,res)=>{
  const{name,email,password,phone,collegeId,collegeIdNumber}=req.body
  if([name,email,password,phone,collegeId,collegeIdNumber].some((field)=>!field ||field.trim()==="")){
    throw new Apierror(400,"All fields are required")
  }
  const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if(!emailRegex.test(email)){
    throw new Apierror(400,"Invalid email format")
  }
  const phoneRegex=/^[6-9][0-9]{9}$/
  if(!phoneRegex.test(phone)){
    throw new Apierror(400,"Invalid phone number")
  }
  if(password.length<6){
    throw new Apierror(400,"Password must be at least 6 characters long")
  }
  const college=await College.findById(collegeId)
  if(!college)
  {
    throw new Apierror(404,"college not found")
  }
  if(college.status !=="ACTIVE")
  {
    throw new Apierror(400,"college is not active")
  }
  const existingemail=await User.findOne({email:email.toLowerCase()})
  if(existingemail)
  {
    throw new Apierror(400,"email already in use login instead")
  }
  const existingPhone=await User.findOne({phone})
  if(existingPhone)
  {
    throw new Apierror(400,"phone already in use login insted")
  }

  const verificationToken = crypto.randomBytes(32).toString("hex")

  const user=await User.create({
    name:name.trim(),
    email:email.toLowerCase().trim(),
    password,
    phone,
    role:"student",
    collegeId,
    collegeIdNumber:collegeIdNumber.trim(),
    emailVerificationToken: verificationToken
  })

  const verificationUrl = `${process.env.CORS_ORIGIN}/verify-email/${verificationToken}`
  const template = verificationEmailTemplate({ name: user.name, verificationUrl })
  await sendEmail({ to: user.email, subject: template.subject, html: template.html })

  const createdUser=await User.findById(user._id).select("-password -refreshToken -emailVerificationToken")

  if(!createdUser)
  {
    throw new Apierror(500,"user creation failed something went wrong")
  }

  return res.status(201)
  .json(new Apiresponse(201,createdUser,"student registered Please check your email to verify your account"))

})


const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params
 
  if (!token) {
    throw new Apierror(400, "Invalid verification link")
  }
 
  // need +emailVerificationToken because select:false hides it by default
  const user = await User.findOne({
    emailVerificationToken: token,
  }).select("+emailVerificationToken")
 
  if (!user) {
    throw new Apierror(400, "Invalid or expired verification link")
  }
 
  // mark verified and clear token
  user.isEmailVerified = true
  user.emailVerificationToken = null
  await user.save()
 
  return res.status(200).json(
    new Apiresponse(200, null, "Email verified successfully. You can now log in.")
  )
})


const login=asyncHandler(async(req,res)=>{
  const {email,password}=req.body
   if([email,password].some((field)=>!field ||field.trim()==="")){
    throw new Apierror(400,"All fields are required")
  }

  const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if(!emailRegex.test(email)){
    throw new Apierror(400,"Invalid email format")
  }
  
  const user=await User.findOne({email:email.toLowerCase().trim()}).select("+password")
  if(!user)
  {
    throw new Apierror(400,"Invalid email or password")
  }
  const isMatch=await user.isPasswordCorrect(password)
  if(!isMatch)
  {
    throw new Apierror(400,"Invalid email or password")
  }
  if(!user.isEmailVerified)
  {
    throw new Apierror(400,"Email not verified Please check your email to verify your account")
  }

  if(!user.isActive)
  {
    throw new Apierror(403,"Your account is inactive Please contact support")
  }

  if(user.role==="shopkeeper")
  {
    const shop=await Shop.findById(user.shopId)
    if(!shop)
    {
      throw new Apierror(404,"Associated shop not found Please contact support")
    }
     if (shop.status === "INACTIVE") {
      throw new Apierror(403, "Your shop subscription has expired")
    }
    if (shop.status === "PENDING") {
      throw new Apierror(403, "Your shop is pending approval")
    }
    if (shop.status === "REJECTED") {
      throw new Apierror(403, "Your shop application was rejected")
    }
  }
  const accessToken=user.generateAccessToken()
  const refreshToken=user.generateRefreshToken()
  user.refreshToken=refreshToken
  await user.save()
  const logedinUser=await User.findById(user._id).select("-password -refreshToken -emailVerificationToken")
  return res.status(200).json(new Apiresponse(200,{user:logedinUser,accessToken,refreshToken},"Login successful"))

  const cookiesOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  }
  res.cookie("refreshToken", refreshToken, cookiesOptions)
  return res.status(200)
  .res.cookie("refreshToken", refreshToken, cookiesOptions)
  .json(new Apiresponse(200,{user:logedinUser,accessToken},"Login successful"))
})


const logout=asyncHandler(async(req,res)=>{
  await User.findByIdAndUpdate(req.user._id,{refreshToken:null})
  return res
  .status(200)
  .clearCookie("refreshToken",{
    httpOnly: true,
    secure: true,
    sameSite: "strict"
  })
  .json(new Apiresponse(200,null,"Logout successful"))
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
  const incomingRefreshToken=req.cookies?.refreshToken || req.headers?.authorization?.split(" ")[1]
  if(!incomingRefreshToken)
  {
    throw new Apierror(401,"Refresh token not provided")
  }
  const decoded=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
  const user=await User.findById(decoded.userId).select("+refreshToken")
  if(!user || user.refreshToken !== incomingRefreshToken)
  {
    throw new Apierror(401,"Invalid refresh token")
  }
  const accessToken=user.generateAccessToken()
  const newRefreshToken=user.generateRefreshToken()
  user.refreshToken=newRefreshToken
  await user.save()
  const cookiesOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  }
  
  return res.status(200)
  .res.cookie("refreshToken", newRefreshToken, cookiesOptions)
  .json(new Apiresponse(200,{accessToken},"Access token refreshed successfully"))
})

const getMe=asyncHandler(async(req,res)=>{
  const user=req.user
  return res
  .status(200)
  .json(new Apiresponse(200,{user},"User details fetched successfully"))
})


const registerShopkeeper = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    shopName,
    shopPhone,
    address,
    collegeId,
    newCollege,
  } = req.body

  if (
    [name, email, password, phone, shopName, shopPhone, address].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new Apierror(400, "All fields are required")
  }

  if (!collegeId && !newCollege) {
    throw new Apierror(400, "Please select or create a college")
  }

  if (collegeId && newCollege) {
    throw new Apierror(400, "Provide either collegeId or newCollege, not both")
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new Apierror(400, "Invalid email format")
  }

  const phoneRegex = /^[6-9][0-9]{9}$/
  if (!phoneRegex.test(phone)) {
    throw new Apierror(400, "Invalid phone number")
  }
  if (!phoneRegex.test(shopPhone)) {
    throw new Apierror(400, "Invalid shop phone number")
  }

  if (password.length < 6) {
    throw new Apierror(400, "Password must be at least 6 characters")
  }

  const existingEmail = await User.findOne({ email: email.toLowerCase() })
  if (existingEmail) {
    throw new Apierror(409, "Email already registered. Please login instead.")
  }

  const existingPhone = await User.findOne({ phone })
  if (existingPhone) {
    throw new Apierror(409, "Phone number already registered.")
  }

  let finalCollegeId

  if (collegeId) {
    const college = await College.findById(collegeId)
    if (!college) {
      throw new Apierror(404, "College not found")
    }
    finalCollegeId = college._id
  } else {
    const { name: collegeName, shortName, city, state } = newCollege

    if (
      [collegeName, shortName, city, state].some(
        (field) => !field || field.trim() === ""
      )
    ) {
      throw new Apierror(400, "All college fields are required")
    }

    const existingCollege = await College.findOne({
      name: { $regex: new RegExp(`^${collegeName.trim()}$`, "i") },
      city: { $regex: new RegExp(`^${city.trim()}$`, "i") },
    })

    if (existingCollege) {
      throw new Apierror(
        409,
        "A college with this name already exists in this city. Please search and select it."
      )
    }

    const college = await College.create({
      name: collegeName.trim(),
      shortName: shortName.trim().toUpperCase(),
      city: city.trim(),
      state: state.trim(),
      status: "PENDING",
      createdBy: new mongoose.Types.ObjectId("000000000000000000000001"),
    })

    finalCollegeId = college._id
  }

  const verificationToken = crypto.randomBytes(32).toString("hex")

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    phone,
    role: "shopkeeper",
    shopId: null,
    emailVerificationToken: verificationToken,
  })

  if (newCollege) {
    await College.findByIdAndUpdate(finalCollegeId, {
      createdBy: user._id,
    })
  }

  const shop = await Shop.create({
    name: shopName.trim(),
    collegeId: finalCollegeId,
    ownerId: user._id,
    address: address.trim(),
    phone: shopPhone,
    status: "PENDING",
  })

  user.shopId = shop._id
  await user.save()

  const verificationUrl = `${process.env.CORS_ORIGIN}/verify-email/${verificationToken}`
  const template = verificationEmailTemplate({ name: user.name, verificationUrl })
  await sendEmail({ to: user.email, subject: template.subject, html: template.html })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken"
  )

  return res.status(201).json(
    new Apiresponse(
      201,
      { user: createdUser, shop },
      "Registration successful. Please check your email to verify your account. Your shop will be reviewed and approved within 24 hours."
    )
  )
})

export{registerStudent, 
  verifyEmail, 
  login, 
  logout, 
  refreshAccessToken, 
  getMe,
  registerShopkeeper
} 