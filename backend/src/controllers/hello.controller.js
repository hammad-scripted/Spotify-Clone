import { StatusCodes } from 'http-status-codes';
import ApiResponse from '../utils/apiResponse.js';

export const geHello = (req, res) => {
  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, 'Hello World', 'Hello World'));
};
