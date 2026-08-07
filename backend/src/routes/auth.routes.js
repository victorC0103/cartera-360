import { Router } from 'express';
import { login } from '../controllers/auth.controller.js';

const router = Router();

// Endpoint público para iniciar sesión
router.post('/login', login);

export default router;
