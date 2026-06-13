import ApiResponse from '../utils/apiResponse.js'
export const getAdmin=async(req,res)=>{
    res.status(200).json(new ApiResponse(200,'hello'))
}