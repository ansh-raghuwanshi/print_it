import { Router } from 'express';
import {searchColleges, getShopsByCollege} from '../controllers/college.controller.js'


const router=Router()

router.route("/search").get(searchColleges)
router.route("/:id/shops").get(getShopsByCollege)

export default router