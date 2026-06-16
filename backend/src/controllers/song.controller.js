import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { StatusCodes } from 'http-status-codes';
import { Song } from '../models/song.model.js';

export const getAllSongs = async (req, res) => {
  const songs = await Song.find({}).sort({ createdAt: -1 });

  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, songs, 'Songs fetched successfully'));
};

export const getFeaturedSongs = async (req, res) => {
  // ? fetch 6 random songs using mongodb aggregation pipeline
  const songs = await Song.aggregate([
    { $sample: { size: 6 } },
    { $project: { _id: 1, title: 1, artist: 1, imageUrl: 1, audioUrl: 1 } }
  ]);

  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, songs, 'Songs fetched successfully'));
};

export const getMadeForYou = async (req, res) => {

  //* fetch randomly
const songs = await Song.aggregate([
    { $sample: { size: 4 } },
    { $project: { _id: 1, title: 1, artist: 1, imageUrl: 1, audioUrl: 1 } }
  ]);

  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, songs, 'Songs fetched successfully'));

};
export const getTrendingSongs = async (req, res) => {
  const songs = await Song.aggregate([
    { $sample: { size: 4 } },
    { $project: { _id: 1, title: 1, artist: 1, imageUrl: 1, audioUrl: 1 } }
  ]);

  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, songs, 'Songs fetched successfully'));
};
