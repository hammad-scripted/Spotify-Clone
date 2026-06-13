import { Schema, model } from 'mongoose';

const songSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
  },
  artist: {
    type: String,
    required: true,
  },
  audioUrl: {
    type: String,
    required: [true, 'Audio url is required'],
  },
  duration: {
    type: Number,
  },
  albumId:{
    type:Schema.Types.ObjectId,
    ref:'Album',
    required:false
  }
},{
    timestamps:true
});


export const Song = model('Song', songSchema);  


