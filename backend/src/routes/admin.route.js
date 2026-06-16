import { Router } from 'express';
import { protectRoute, checkRole } from '../middlewares/auth.middleware.js';
import {
  createSong,
  deleteSong,
  createAlbum,
  deleteAlbum,
  checkAdmin
} from '../controllers/admin.controller.js';
const router = Router();

router.get("/checkAdmin", protectRoute, checkRole, checkAdmin)
router.post('/songs', protectRoute, checkRole, createSong);
router.delete('/songs/:songId', protectRoute, checkRole, deleteSong);

router.post('/albums', protectRoute, checkRole, createAlbum);
router.delete('/albums/:albumId', protectRoute, checkRole, deleteAlbum);

export default router;
