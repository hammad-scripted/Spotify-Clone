import { clerkClient, getAuth } from '@clerk/express';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../utils/apiError.js';

export const protectRoute = (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, 'You are not logged in!'));
  }
  req.userId = userId;
  return next();
};

export const checkRole = async (req, res, next) => {
  try {
    const currentUser = await clerkClient.users.getUser(req.userId);

    const isAdmin =
      currentUser.primaryEmailAddress?.emailAddress?.toLowerCase() ===
      process.env.ADMIN_EMAIL?.trim().toLowerCase();

    if (!isAdmin) {
      return next(new ApiError(
        StatusCodes.FORBIDDEN,
        'You are not authorized to access this route'
      ));
    }

    return next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    return next(new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Something went wrong while verifying admin access'
    ));
  }
};
