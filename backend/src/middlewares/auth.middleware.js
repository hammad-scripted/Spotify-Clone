import { clerkClient, getUser } from '@clerk/express';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../utils/apiError.js';
export const protectRoute = async (req, res, next) => {
  if (!req.auth.userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are not logged in!');
  }
  next();
};

export const checkRole = async (req, res, next) => {
  try {
    const currentUser = await clerkClient.users.getUser(req.auth.userId);
    console.log(currentUser);
    const isAdmin =
      process.env.ADMIN_EMAIL === currentUser.primaryEmailAddress?.emailAddress;
    if (!isAdmin) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'You are not an admin!, you are not authorized to access this route',
      );
    }
    next();
  } catch (e) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'You are not an admin!, you are not authorized to access this route',
    );
  }

  // ? check if user is admin

  const user = await getUser({ userId: req.auth.userId });

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are not logged in!');
  }
  next();
};
