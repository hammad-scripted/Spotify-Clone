import { Router } from 'express';
import { getConversation, getRecentConversations, sendMessage } from '../controllers/message.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(protectRoute);
router.get('/', getRecentConversations);
router.get('/:userId', getConversation);
router.post('/', sendMessage);

export default router;
