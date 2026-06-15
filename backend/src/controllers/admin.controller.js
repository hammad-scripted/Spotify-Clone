import ApiResponse from '../utils/apiResponse.js';

import ApiError from '../utils/apiError.js';

import {StatusCodes} from 'http-status-codes';
import {Song} from '../models/song.model.js';
import {Album} from '../models/album.model.js'; 

export const createSong=(req,res)=>{
   
    if(!req.files || !req.files.audioFile || !req.files.imageFile){
        throw new ApiError(StatusCodes.BAD_REQUEST,'Missing audio or image file');
    }   

    const {title,artist,albumId,duration}=req.body;
    const audioFile=req.files.audioFile;
    const imageFile=req.files.imageFile;

    const song=new Song({
        title,
        artist,
        audioUrl:audioFile.path,
        imageUrl:imageFile.path,
        duration,
        albumId:albumId||null
    });     

    await song.save();


    // ? add song to album 

    if(albumId){
        const album=await Album.findByIdAndUpdate   (albumId,{
            $push:{songs:song._id}
        });
    
    }

    return res
    .status(StatusCodes.CREATED)
    .json(new ApiResponse(StatusCodes.CREATED,'Song created successfully'));


   
}