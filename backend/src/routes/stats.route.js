import express from "express";
import { Router } from "express";
import {protectRoute,checkRole} from '../middlewares/auth.middleware.js'
import {getStats} from '../controllers/stats.controller.js'
const router = Router();

router.get('/',protectRoute,checkRole, getStats);
export default router;
