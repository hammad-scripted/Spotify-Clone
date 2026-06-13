import {Schema,model}from 'mongoose';


const messageSchema=new Schema=({

    senderId:{
        type:String,
        required:true
    }, //? clerk userid
    receiverId:{
        type:String,
        required:true
    },//? clerk userid
    content:{
        type:String,
        required:true   
    }
},{
    timestamps:true
})

export const Message=model("Message",messageSchema);    