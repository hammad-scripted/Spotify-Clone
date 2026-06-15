import { Router } from 'express';
import { getAdmin } from '../controllers/admin.controller.js';
import { protectRoute, checkRole } from '../middlewares/auth.middleware.js';
import { createSong } from '../controllers/admin.controller.js';
const router = Router();

router.post('/songs', protectRoute, checkRole, createSong);

export default router;
