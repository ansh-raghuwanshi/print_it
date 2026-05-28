import {Router} from 'express';
import{registerStudent} from '../controllers/user.controller.js'

const router=Router()

//student routes
router.route("/register/student").post(registerStudent)




export default router