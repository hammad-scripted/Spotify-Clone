
import { StatusCodes } from 'http-status-codes';
import { User } from '../models/user.model.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
export const authCallback = async (req, res) => {
  const { id, firstName, lastName, imageUrl } = req.body;

  if (!id || !firstName || !lastName || !imageUrl) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Missing required fields");
  }
  if (id !== req.userId) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You cannot sync another user profile');
  }
  const user = await User.findOneAndUpdate(
    { clerkId: id },
    { fullName: `${firstName} ${lastName}`.trim(), imageUrl },
    { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, user, 'User synced successfully'));
};
