import { Router } from "express"
import {
  getPendingColleges,
  approveCollege,
  getShops,
  approveShop,
  rejectShop,
  updateSubscription,
} from "../controllers/admin.controller.js"
import  verifyJWT  from "../middleware/auth.middleware.js"
import { requireAdmin } from "../middleware/role.middleware.js"

const router = Router()

// all admin routes require login + admin role
router.use(verifyJWT)
router.use(requireAdmin)

// college routes
router.route("/colleges").get(getPendingColleges)
router.route("/colleges/:id/approve").patch(approveCollege)

// shop routes
router.route("/shops").get(getShops)
router.route("/shops/:id/approve").patch(approveShop)
router.route("/shops/:id/reject").patch(rejectShop)
router.route("/shops/:id/subscription").patch(updateSubscription)

export default router