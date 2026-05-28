import { asyncHandler } from "../utils/asyncHandler.js"
import Apiresponse from "../utils/ApiResponse.js"
import Apierror from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { College } from "../models/colleges.model.js"


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

  const user=await User.create({
    name:name.trim(),
    email:email.toLowerCase().trim(),
    password,
    phone,
    role:"student",
    collegeId,
    collegeIdNumber:collegeIdNumber.trim()
  })

  const createdUser=await User.findById(user._id).select("-password -refreshToken")
  if(!createdUser)
  {
    throw new Apierror(500,"user creation failed something went wrong")
  }

  return res.status(201)
  .json(new Apiresponse(201,createdUser,"student registered successfully"))

})



export{registerStudent}