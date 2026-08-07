import sql from 'mssql/msnodesqlv8.js';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER};Database=${process.env.DB_DATABASE};Trusted_Connection=yes;`;

export async function getConnection() {
    try {
        const pool = await sql.connect({ connectionString });
        return pool;
    } catch (error) {
        console.error('Error al intentar conectar a la base de datos (Windows Auth):', error);
        throw error;
    }
}
