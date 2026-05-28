import {Router} from 'express';
import{registerStudent,verifyEmail} from '../controllers/user.controller.js'

const router=Router()

//student routes
router.route("/register/student").post(registerStudent)
router.route("/verify-email/:token").get(verifyEmail)



export default router