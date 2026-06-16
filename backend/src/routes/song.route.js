import { Router } from 'express';
import { getAllSongs } from '../controllers/song.controller.js';
import {protectRoute,checkRole} from '../middlewares/auth.middleware.js'    
import {getFeaturedSongs,getMadeForYou,getTrendingSongs} from '../controllers/song.controller.js'
const router = Router();

router.get('/',protectRoute,checkRole, getAllSongs);
router.get('/featured',getFeaturedSongs);
router.get("/made-for-you",getMadeForYou)
router.get("/trending-songs",getTrendingSongs)


export default router;
