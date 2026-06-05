import { Router } from "express"
import {
  calculateOrder,
  initiatePayment,
  confirmOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getShopOrders,
  acceptOrder,
  rejectOrder,
  markReady,
  markCompleted,
} from "../controllers/order.controller.js"
import verifyJWT  from "../middleware/auth.middleware.js"
import { requireRole } from "../middleware/role.middleware.js"
import { upload } from "../middleware/multer.middleware.js"
import crypto from "crypto"
import { asyncHandler } from "../utils/asyncHandler.js"

const router = Router()

// all order routes require login
router.use(verifyJWT)

//test route
 router.route("/test-signature").post(asyncHandler(async (req, res) => {
  const { razorpayOrderId } = req.body
  const fakePaymentId = "pay_test_" + Date.now()
  const signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${fakePaymentId}`)
    .digest("hex")

  res.json({ razorpayPaymentId: fakePaymentId, razorpaySignature: signature })
}))

// Student routes 
router.route("/calculate")
  .post(requireRole("student"), upload.array("files", 5), calculateOrder)

router.route("/initiate-payment")
  .post(requireRole("student"), initiatePayment)

router.route("/confirm")
  .post(requireRole("student"), confirmOrder)

router.route("/mine")
  .get(requireRole("student"), getMyOrders)

// Shopkeeper routes 
router.route("/shop")
  .get(requireRole("shopkeeper"), getShopOrders)

router.route("/:id/accept")
  .patch(requireRole("shopkeeper"), acceptOrder)

router.route("/:id/reject")
  .patch(requireRole("shopkeeper"), rejectOrder)

router.route("/:id/ready")
  .patch(requireRole("shopkeeper"), markReady)

router.route("/:id/complete")
  .patch(requireRole("shopkeeper"), markCompleted)

//Shared routes 
router.route("/:id")
  .get(getOrderById)
  .delete(requireRole("student"), cancelOrder)

export default router