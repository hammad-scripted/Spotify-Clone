import { unlink } from 'node:fs/promises';
import { StatusCodes } from 'http-status-codes';
import { Album } from '../models/album.model.js';
import { Song } from '../models/song.model.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import cloudinary from '../utils/cloudinary.js';

const cleanupFile = async (file) => {
  if (file?.tempFilePath) await unlink(file.tempFilePath).catch(() => undefined);
};

const uploadToCloudinary = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file.tempFilePath, { resource_type: 'auto' });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
    };
  } catch {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Something went wrong while uploading to Cloudinary');
  }
};

const destroyAsset = async (publicId, resourceType = 'image') => {
  if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

export const createSong = async (req, res) => {
  if (!req.files?.audioFile || !req.files?.imageFile) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Missing audio or image file');
  }
  const { title, artist, albumId, duration } = req.body;
  if (!title?.trim() || !artist?.trim()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Title and artist are required');
  }
  if (albumId && !(await Album.exists({ _id: albumId }))) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Album not found');
  }

  const audioFile = req.files.audioFile;
  const imageFile = req.files.imageFile;
  let audioUpload;
  let imageUpload;
  try {
    const uploadResults = await Promise.allSettled([
      uploadToCloudinary(audioFile),
      uploadToCloudinary(imageFile),
    ]);
    if (uploadResults[0].status === 'fulfilled') audioUpload = uploadResults[0].value;
    if (uploadResults[1].status === 'fulfilled') imageUpload = uploadResults[1].value;
    const failedUpload = uploadResults.find((result) => result.status === 'rejected');
    if (failedUpload?.status === 'rejected') throw failedUpload.reason;
    const song = await Song.create({
      title: title.trim(), artist: artist.trim(), duration,
      audioUrl: audioUpload.url, audioPublicId: audioUpload.publicId,
      imageUrl: imageUpload.url, imagePublicId: imageUpload.publicId,
      albumId: albumId || null,
    });
    if (albumId) await Album.findByIdAndUpdate(albumId, { $addToSet: { songs: song._id } });
    return res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, song, 'Song created successfully'));
  } catch (error) {
    await Promise.allSettled([
      destroyAsset(audioUpload?.publicId, audioUpload?.resourceType),
      destroyAsset(imageUpload?.publicId, imageUpload?.resourceType),
    ]);
    throw error;
  } finally {
    await Promise.all([cleanupFile(audioFile), cleanupFile(imageFile)]);
  }
};

export const deleteSong = async (req, res) => {
  const song = await Song.findById(req.params.songId);
  if (!song) throw new ApiError(StatusCodes.NOT_FOUND, 'Song not found');
  if (song.albumId) await Album.findByIdAndUpdate(song.albumId, { $pull: { songs: song._id } });
  await Promise.allSettled([
    destroyAsset(song.audioPublicId, 'video'),
    destroyAsset(song.imagePublicId, 'image'),
  ]);
  await song.deleteOne();
  return res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, song, 'Song deleted successfully'));
};

export const createAlbum = async (req, res) => {
  const { title, artist, releaseYear } = req.body;
  if (!title?.trim() || !artist?.trim() || !releaseYear) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Title, artist, and release year are required');
  }
  if (!req.files?.imageFile) throw new ApiError(StatusCodes.BAD_REQUEST, 'Missing album image');
  const imageFile = req.files.imageFile;
  let imageUpload;
  try {
    imageUpload = await uploadToCloudinary(imageFile);
    const album = await Album.create({
      title: title.trim(), artist: artist.trim(), releaseYear,
      imageUrl: imageUpload.url, imagePublicId: imageUpload.publicId,
    });
    return res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, album, 'Album created successfully'));
  } catch (error) {
    await destroyAsset(imageUpload?.publicId, imageUpload?.resourceType).catch(() => undefined);
    throw error;
  } finally {
    await cleanupFile(imageFile);
  }
};

export const deleteAlbum = async (req, res) => {
  const album = await Album.findById(req.params.albumId);
  if (!album) throw new ApiError(StatusCodes.NOT_FOUND, 'Album not found');
  await destroyAsset(album.imagePublicId, 'image').catch(() => undefined);
  await Song.updateMany({ albumId: album._id }, { $set: { albumId: null } });
  await album.deleteOne();
  return res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, album, 'Album deleted successfully'));
};

export const checkAdmin = async (req, res) => res
  .status(StatusCodes.OK)
  .json(new ApiResponse(StatusCodes.OK, { isAdmin: true }, 'You are an admin'));
