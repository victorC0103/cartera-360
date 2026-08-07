import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

// Configuración de conexión para PostgreSQL
const poolConfig = process.env.DATABASE_URL 
    ? { 
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Requerido por Render para conexiones externas
      }
    : {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_SERVER,
        database: process.env.DB_DATABASE,
        port: parseInt(process.env.DB_PORT) || 5432,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };

const pool = new Pool(poolConfig);

// Event listener para errores del pool
pool.on('error', (err, client) => {
    console.error('Error inesperado en el pool de PostgreSQL:', err);
    process.exit(-1);
});

// En Postgres, normalmente exportamos el query o el pool completo.
// Para mantener compatibilidad con la estructura anterior, podemos exportar el pool directamente.
// O exportar una función getConnection() que devuelve el pool o un cliente.
// Exportamos pool directamente y una función query helper

export const query = (text, params) => pool.query(text, params);

export async function getConnection() {
    try {
        const client = await pool.connect();
        return client;
    } catch (error) {
        console.error('Error al intentar conectar a la base de datos PostgreSQL:', error);
        throw error;
    }
}

export default pool;
