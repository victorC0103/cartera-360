import { Router } from 'express';
import { getMoraPorSector, getIngresosSemana, getEstadoCarteraPorZona, getKpis, getAlertasCobranza } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/mora-por-sector', getMoraPorSector);
router.get('/ingresos-semana', getIngresosSemana);
router.get('/estado-cartera-zona', getEstadoCarteraPorZona);
router.get('/kpis', getKpis);
router.get('/alertas', getAlertasCobranza);

export default router;
