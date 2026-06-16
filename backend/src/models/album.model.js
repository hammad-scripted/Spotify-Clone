import { Schema, model } from 'mongoose';

const albumSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
    },
    artist: {
      type: String,
      required: [true, 'Artist is required'],
    },
    imageUrl: {
      type: String,
      required: [true, 'Image url is required'],
    },

    releaseYear: {
      type: Number,
      required: [true, 'Release year is required'],
    },
    // ? array of song with id, foreign key to song 
    songs:[{
        type:Schema.Types.ObjectId,
        ref:'Song',
       
    }]
  },
  { timestamps: true },
);

export const Album = model('Album', albumSchema);