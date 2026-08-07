import { Router } from 'express';
import { procesarImportacionMasiva, getAbonosByCartilla } from '../controllers/cartillas.controller.js';

const router = Router();

router.post('/bulk', procesarImportacionMasiva);
router.get('/:id/abonos', getAbonosByCartilla);

export default router;
