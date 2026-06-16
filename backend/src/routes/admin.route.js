import { Router } from 'express';
import { getAdmin } from '../controllers/admin.controller.js';
import { protectRoute, checkRole } from '../middlewares/auth.middleware.js';
import {
  createSong,
  deleteSong,
  createAlbum,
  deleteAlbum
} from '../controllers/admin.controller.js';
const router = Router();

router.post('/songs', protectRoute, checkRole, createSong);
router.delete('/songs/:songId', protectRoute, checkRole, deleteSong);

router.post('/albums', protectRoute, checkRole, createAlbum);
router.delete('/albums/:albumId', protectRoute, checkRole, deleteAlbum);

export default router;
