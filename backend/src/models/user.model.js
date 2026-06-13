import {Schema,model} from "mongoose";


const userSchema=new Schema({


    fullName:{
        type:String,
        required:[true,"Full name is required"]
    },
    imageUrl:{
        type:String,
        required:[true,"Image url is required"]
    },

    clerkId:{
        type:String,
        required:[true,"Clerk id is required"],
        unique:true

    }

},{timestamps:true})


export const User=model("User",userSchema);
