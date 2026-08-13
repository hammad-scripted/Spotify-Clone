import { StatusCodes } from 'http-status-codes';
import { Message } from '../models/message.mode.js';
import { User } from '../models/user.model.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';

export const getConversation = async (req, res) => {
  const currentUserId = req.userId;
  const { userId } = req.params;
  const messages = await Message.find({
    $or: [
      { senderId: currentUserId, receiverId: userId },
      { senderId: userId, receiverId: currentUserId },
    ],
  }).sort({ createdAt: 1 });

  return res.status(StatusCodes.OK).json(
    new ApiResponse(StatusCodes.OK, messages, 'Messages fetched successfully'),
  );
};

export const sendMessage = async (req, res) => {
  const senderId = req.userId;
  const { receiverId, content } = req.body;
  const cleanContent = typeof content === 'string' ? content.trim() : '';

  if (!receiverId || !cleanContent) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Receiver and message are required');
  }
  if (receiverId === senderId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'You cannot message yourself');
  }
  const receiverExists = await User.exists({ clerkId: receiverId });
  if (!receiverExists) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const message = await Message.create({ senderId, receiverId, content: cleanContent });
  req.app.get('io')?.to(`user:${receiverId}`).emit('message:new', message);
  req.app.get('io')?.to(`user:${senderId}`).emit('message:new', message);

  return res.status(StatusCodes.CREATED).json(
    new ApiResponse(StatusCodes.CREATED, message, 'Message sent successfully'),
  );
};
