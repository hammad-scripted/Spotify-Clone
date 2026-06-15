import { Router } from 'express';
import { getAdmin } from '../controllers/admin.controller.js';
import { protectRoute, checkRole } from '../middlewares/auth.middleware.js';
const router = Router();

router.get('/', protectRoute, checkRole, createSong);

export default router;
