import ApiResponse from '../utils/apiResponse.js';

import ApiError from '../utils/apiError.js';

import {StatusCodes} from 'http-status-codes';
import {Song} from '../models/song.model.js';
import {Album} from '../models/album.model.js'; 
import {cloudinary} from '../utils/cloudinary.js';
const uploadToCloudinary=async(file)=>{
    try{
    const {secure_url}=await cloudinary.uploader.upload(file.tempFilePath,{resource_type:'auto'});
    return secure_url;}
    catch(error){
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR,'Something went wrong while uploading to cloudinary');
    }   
}

export const createSong=(req,res)=>{
   
    if(!req.files || !req.files.audioFile || !req.files.imageFile){
        throw new ApiError(StatusCodes.BAD_REQUEST,'Missing audio or image file');
    }   

    const {title,artist,albumId,duration}=req.body;
    const audioFile=req.files.audioFile;
    const imageFile=req.files.imageFile;


    const audioUrl= await uploadToCloudinary(audioFile);
    const audioUrl= await uploadToCloudinary(imageFile);

    const song=new Song({
        title,
        artist,
        audioUrl,
        imageUrl,
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
    .json(new ApiResponse(StatusCodes.CREATED,song,'Song created successfully'));


   
}

export const deleteSong=async(req,res)=>{
    const {songId}=req.params;

    const song= await Song.findById(songId);
    // ? if song belongs to album then we need to remove it from album

    if(song.albumId){

        await Album.findByIdAndUpdate(song.albumId,{$pull:{songs:song._id}} )
    }
    if(!song){
        throw new ApiError(StatusCodes.NOT_FOUND,'Song not found');
    }   

    await song.remove();
    return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK,song,'Song deleted successfully'));


}