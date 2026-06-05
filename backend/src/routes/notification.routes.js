import { Router } from "express"
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from "../controllers/notification.controller.js"
import  verifyJWT  from "../middleware/auth.middleware.js"

const router = Router()

router.use(verifyJWT)

router.route("/").get(getNotifications)
router.route("/unread-count").get(getUnreadCount)
router.route("/read-all").patch(markAllAsRead)
router.route("/:id/read").patch(markAsRead)

export default router