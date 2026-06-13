
import ApiError from "../utils/apiError.js";
import { StatusCodes } from "http-status-codes";

export const notFound=(req,res,next)=>{
    next(new ApiError(StatusCodes.NOT_FOUND,'Route not exists!'))
}
