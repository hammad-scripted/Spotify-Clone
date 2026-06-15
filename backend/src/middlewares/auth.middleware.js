import { clerkClient } from '@clerk/express';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../utils/apiError.js';

export const protectRoute = async (req, res, next) => {
  if (!req.auth.userId) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'You are not logged in!'
    );
  }

  next();
};

export const checkRole = async (req, res, next) => {
  try {
    const currentUser = await clerkClient.users.getUser(req.auth.userId);
    console.log(currentUser);

    const isAdmin =
      currentUser.primaryEmailAddress?.emailAddress ===
      process.env.ADMIN_EMAIL;

    if (!isAdmin) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        'You are not authorized to access this route'
      );
    }

    next();
  } catch (error) {
    console.error(error);

    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Something went wrong while verifying admin access'
    );
  }
};