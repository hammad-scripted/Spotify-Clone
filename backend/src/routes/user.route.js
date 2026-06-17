import { Router } from 'express';
import ApiResponse from '../utils/apiResponse.js  ';
import ApiError from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { protectRoute, checkRole } from '../middlewares/auth.middleware.js';
import { getAllUsers } from '../controllers/user.controller.js';
import { StatusCodes } from 'http-status-codes';

const router = Router();

router.get('/', protectRoute, getAllUsers);
// Todo get messages


export default router;
