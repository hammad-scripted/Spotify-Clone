import { Router } from "express";
import {StatusCodes,ReasonPhrases} from 'http-status-codes';
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import {User} from '../models/user.model.js'
const router=Router()



router.post("/",(req,res)=>{

    const{id,firstName,lastName,imageUrl}=req.body;

    if(!id || !firstName || !lastName || !imageUrl){
      throw new ApiError(StatusCodes.BAD_REQUEST,ReasonPhrases.BAD_REQUEST)
    }
    // ? check if user exists already
const user=User.findOne({clerkId:id});
if(user){
   return res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK,'User already exists'))
}
const newUser=new User({
    clerkId:id,
    fullName:`${firstName} ${lastName}`,
    imageUrl:imageUrl
})
await newUser.save();
return res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED,'User created successfully'))

})


export default router;