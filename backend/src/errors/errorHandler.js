import { ReasonPhrases, StatusCodes } from 'http-status-codes'

const errorHandler=(err,req,res,next)=>{

    const isDatabaseInputError = err.name === 'ValidationError' || err.name === 'CastError';
    const statusCode=err.statusCode || (isDatabaseInputError ? StatusCodes.BAD_REQUEST : StatusCodes.INTERNAL_SERVER_ERROR)
    

    res.status(statusCode).json({

        success:false,
        message:err.name === 'CastError' ? 'Invalid resource identifier' : err.message|| ReasonPhrases.INTERNAL_SERVER_ERROR,
        errors:err.errors||[],
        data:err.data||null,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })

}
export default errorHandler
