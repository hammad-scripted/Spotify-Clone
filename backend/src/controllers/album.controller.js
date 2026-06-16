import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { StatusCodes } from 'http-status-codes';

import { Album } from '../models/album.model.js';

export const getAllAlbums = async (req, res) => {
  const albums = await Album.fine({}).sort({ createdAt: -1 });

  return res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, albums, 'Albums fetched successfully'),
    );
};

export const getAlbumById = async (req, res) => {
  const { id: albumId } = req.params;

  const album = await Album.findById(albumId).populate('songs');

  if (!album) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Album not found');
  }

  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, album, 'Album fetched successfully'));
};
