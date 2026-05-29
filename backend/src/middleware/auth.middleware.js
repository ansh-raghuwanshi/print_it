import {User} from '../models/user.model.js'
import Apierror from '../utils/ApiError.js'
import jwt from 'jsonwebtoken'


const verifyjwt=async(req,res,next)=>{
 try{
   const token=req.cookies?.accessToken || req.headers?.authorization?.split(" ")[1]
  if(!token)
  {
    throw new Apierror(401,"unothorized")
  }
  const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
  const user=await User.findById(decodedToken.userId).select("-password -refreshToken")
  if(!user)
  {
    throw new Apierror(401,"unothorized")
  }
  if (!user.isActive)
  {
    throw new Apierror(403, "Account has been deactivated")
  }
  req.user=user
  next()
 }
  catch(error){
    throw new Apierror(401,error?.message||"unothorized")
  }

}
export default verifyjwt