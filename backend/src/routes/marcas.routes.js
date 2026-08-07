import { Router } from 'express';
import { getAllMarcas, createMarca } from '../controllers/marcas.controller.js';

const router = Router();

router.get('/', getAllMarcas);
router.post('/', createMarca);

export default router;
