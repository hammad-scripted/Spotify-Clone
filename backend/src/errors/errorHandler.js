import { ReasonPhrases, StatusCodes } from 'http-status-codes'

const errorHandler=(err,req,res,next)=>{

    const statusCode=err.statusCode||StatusCodes.INTERNAL_SERVER_ERROR
    

    res.status(statusCode).json({

        success:false,
        message:err.message|| ReasonPhrases.INTERNAL_SERVER_ERROR,
        errors:err.errors||[],
        data:err.data||null,
        stack: process.env.NODE_ENV === 'development' ? null : err.stack
    })

}
export default errorHandler
