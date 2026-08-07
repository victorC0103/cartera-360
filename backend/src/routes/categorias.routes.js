import { Router } from 'express';
import { getAllCategorias, createCategoria } from '../controllers/categorias.controller.js';

const router = Router();

router.get('/', getAllCategorias);
router.post('/', createCategoria);

export default router;
