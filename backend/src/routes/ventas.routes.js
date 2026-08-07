import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { getAllVentas, getVentaById, createVenta, registerAbono, getRecaudadoHoy } from '../controllers/ventas.controller.js';

// ConfiguraciÃ³n de almacenamiento de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'comprobante-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const router = Router();

router.get('/', getAllVentas);
router.get('/recaudado-hoy', getRecaudadoHoy);
router.get('/:id', getVentaById);
router.post('/', createVenta);
router.post('/abono', upload.single('comprobante'), registerAbono);

export default router;
