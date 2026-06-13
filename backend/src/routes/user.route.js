import { Router } from "express";
import ApiResponse from '../utils/apiResponse.js  ';

const router = Router();

router.get("/",(req,res)=>{
   res.json(new ApiResponse(200,'hello'))   ;
})

export default router;