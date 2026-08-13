import { Router } from "express";
import {StatusCodes,ReasonPhrases} from 'http-status-codes';
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import {User} from '../models/user.model.js'
import {authCallback} from '../controllers/auth.controller.js'
import { protectRoute } from '../middlewares/auth.middleware.js';
const router=Router()



router.post("/callback", protectRoute, authCallback)


export default router;
