import { Router } from "express"
import { getMyShop, updateShop, toggleShopStatus,updatePricing } from "../controllers/shop.controller.js"
import  verifyJWT  from "../middleware/auth.middleware.js"
import { requireRole } from "../middleware/role.middleware.js"

const router = Router()

// all shop routes require login and shopkeeper role
router.use(verifyJWT)
router.use(requireRole("shopkeeper"))

router.route("/me")
  .get(getMyShop)
  .patch(updateShop)

router.route("/me/status").patch(toggleShopStatus)
router.route("/me/pricing").patch(updatePricing)
export default router