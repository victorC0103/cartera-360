import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getConnection } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import clientesRoutes from './routes/clientes.routes.js';
import productosRoutes from './routes/productos.routes.js';
import catalogosRoutes from './routes/catalogos.routes.js';
import categoriasRoutes from './routes/categorias.routes.js';
import marcasRoutes from './routes/marcas.routes.js';
import ventasRoutes from './routes/ventas.routes.js';
import cartillasRoutes from './routes/cartillas.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import { verifyToken } from './middlewares/auth.middleware.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Rutas de la API (Públicas)
app.use('/api/auth', authRoutes);

// Middleware Global de Seguridad para el resto de la API
app.use('/api', verifyToken); // Todas las rutas debajo de esta línea requerirán token JWT

// Rutas de la API (Protegidas)
app.use('/api/clientes', clientesRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/catalogos', catalogosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/marcas', marcasRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/cartillas', cartillasRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Verificar conexión a la BD
getConnection().then(() => {
    console.log('Conexión a la base de datos establecida correctamente.');
}).catch((error) => {
    console.error('Error inicial al conectar a la BD:', error);
});

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Servidor Backend ERP CrediRuta (Cartera360) en línea.');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
