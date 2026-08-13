

import ApiResponse from './../utils/apiResponse.js';
import { StatusCodes } from 'http-status-codes';
import { Song } from '../models/song.model.js';
import { Album } from '../models/album.model.js';
import { User } from '../models/user.model.js';

export const getStats = async (req, res) => {
  const [totalSongs, totalAlbums, totalUsers, songArtists, albumArtists] =
    await Promise.all([
      Song.countDocuments(),
      Album.countDocuments(),
      User.countDocuments(),
      Song.distinct('artist'),
      Album.distinct('artist'),
    ]);
  const totalArtists = new Set([...songArtists, ...albumArtists]).size;

  return res.status(StatusCodes.OK).json(
    new ApiResponse(
      StatusCodes.OK,
      {
        totalSongs,
        totalAlbums,
        totalUsers,
        totalArtists,
      },
      'Stats fetched successfully',
    ),
  );
};
