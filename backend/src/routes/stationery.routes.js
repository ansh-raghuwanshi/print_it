import { Router } from "express"
import {
  getMyItems,
  addItem,
  updateItem,
  restockItem,
  toggleAvailability,
  deleteItem,
  getShopItems,
} from "../controllers/stationery.controller.js"
import verifyJWT from "../middleware/auth.middleware.js"
import { requireRole } from "../middleware/role.middleware.js"


const router = Router()

// student public route (no auth needed)
router.route("/shop/:shopId").get(getShopItems)

// shopkeeper only routes
router.use(verifyJWT)
router.use(requireRole("shopkeeper"))

router.route("/")
  .get(getMyItems)
  .post(addItem)

router.route("/:id")
  .patch(updateItem)
  .delete(deleteItem)

router.route("/:id/restock").patch(restockItem)
router.route("/:id/toggle").patch(toggleAvailability)

export default router