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
  audioPublicId: { type: String },
  imageUrl: {
    type: String,
    required: [true, 'Image url is required'],
  },
  imagePublicId: { type: String },
  duration: {
    type: Number,
  },
  sourceUrl: {
    type: String,
  },
  isPreview: {
    type: Boolean,
    default: false,
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


