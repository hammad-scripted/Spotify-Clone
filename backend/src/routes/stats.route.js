import { Router } from 'express';
import ApiResponse from './../utils/apiResponse.js';
import ApiError from './../utils/apiError.js';
import { StatusCodes } from 'http-status-codes';
import { Song } from '../models/song.model.js';
import { Album } from '../models/album.model.js';
import { User } from '../models/user.model.js';
import {protectRoute,checkRole} from '../middlewares/auth.middleware.js'

const router = Router();

router.get('/',protectRoute,checkRole, async (req, res) => {
  const { totalSongs, totalAlbums, totalUsers, uniqueArtists } =
    await Promise.all([
      Song.countDocuments(),
      Album.countDocuments(),
      User.countDocuments(),

      Song.aggregate([
        {
          $unionWith: {
            coll: 'albums',
            pipeline: [],
          },
        },
        { $group: { _id: '$artist' } },
        { $count: 'count' },
      ]),
    ]);

  return res.status(StatusCodes.OK).json(
    new ApiResponse(
      StatusCodes.OK,
      {
        totalSongs,
        totalAlbums,
        totalUsers,
        totalArtists: uniqueArtists[0]?.count || 0,
      },
      'Stats fetched successfully',
    ),
  );
});
export default router;
