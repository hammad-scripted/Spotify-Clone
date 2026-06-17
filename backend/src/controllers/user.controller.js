import { User } from '../models/user.model.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import { StatusCodes } from 'http-status-codes';

export const getAllUsers = async (req, res) => {
  const currentUserId = req.auth.userId;
  const users = await User.find({
    clerkId: { $ne: currentUserId },
  });

  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, users, 'Users fetched successfully'));
};
