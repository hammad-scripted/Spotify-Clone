import mongoose from "mongoose";
import chalk from "chalk";
export const connectDB=async()=>{
    try{
        const conn=await mongoose.connect(process.env.MONGO_URI)
       console.log(chalk.cyan.italic(`MongoDB connected successfully : ${conn.connection.host}`  ) )
    }
    catch(error){
        console.log(error)
        process.exit(1)
        //? 1 is failure, 0 is success
    }
}