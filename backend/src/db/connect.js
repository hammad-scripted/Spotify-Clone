import mongoose from "mongoose";
import chalk from "chalk";
import dns from 'node:dns/promises';
export const connectDB=async()=>{
    try{
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not configured');
        }
        if (process.env.MONGO_URI.startsWith('mongodb+srv://')) {
            dns.setServers(['8.8.8.8', '1.1.1.1']);
        }
        const conn=await mongoose.connect(process.env.MONGO_URI)
       console.log(chalk.cyan.italic(`MongoDB connected successfully : ${conn.connection.host}`  ) )
    }
    catch(error){
        console.log(error)
        throw error
    }
}
