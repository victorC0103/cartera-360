import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const dbSettings = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT, 10),
    options: {
        encrypt: true, // Para Azure, establecer en true. Local suele ser false o requiere trustServerCertificate
        trustServerCertificate: true // Importante para desarrollo local
    }
};

export async function getConnection() {
    try {
        const pool = await sql.connect(dbSettings);
        return pool;
    } catch (error) {
        console.error('Error conectando a la base de datos:', error);
        throw error;
    }
}
