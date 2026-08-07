import { Router } from 'express';
import {
    getAllCantones,
    createCanton,
    getAllSectores,
    createSector,
} from '../controllers/catalogos.controller.js';

const router = Router();

// Cantones
router.get('/cantones', getAllCantones);
router.post('/cantones', createCanton);

// Sectores
router.get('/sectores', getAllSectores);
router.post('/sectores', createSector);

export default router;
