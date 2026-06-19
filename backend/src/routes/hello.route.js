import { Router } from 'express';
import { geHello } from '../controllers/hello.controller.js';
const router = Router();

router.get('/hello', getHello);
