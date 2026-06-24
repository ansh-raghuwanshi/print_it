import {Router} from 'express';
import{registerStudent,verifyEmail,login,logout,refreshAccessToken,getMe,registerShopkeeper,resendVerificationEmail} from '../controllers/user.controller.js'
import verifyjwt from '../middleware/auth.middleware.js'

const router=Router()

//student routes
router.route("/register/student").post(registerStudent)
router.route("/verify-email/:token").get(verifyEmail)
router.route("/login").post(login)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/resend-verification").post(resendVerificationEmail)
//shopkeeper routes
router.route("/register/shopkeeper").post(registerShopkeeper)



//protected routes
router.route("/logout").post(verifyjwt,logout)
router.route("/me").get(verifyjwt,getMe)




export default router