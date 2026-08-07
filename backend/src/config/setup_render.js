import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupRenderDB() {
    try {
        console.log('1. Conectando a la BD...');
        
        // Ejecutar DDL
        const sqlPath = path.resolve(__dirname, '../../../database.sql');
        if (fs.existsSync(sqlPath)) {
            console.log('2. Creando tablas desde database.sql...');
            const sqlContent = fs.readFileSync(sqlPath, 'utf8');
            await pool.query(sqlContent);
            console.log('Tablas creadas con éxito.');
        } else {
            console.log('Advertencia: No se encontró database.sql en', sqlPath);
        }

        // Insertar Usuarios
        console.log('3. Creando usuarios por defecto...');
        const countRes = await pool.query('SELECT COUNT(*) as count FROM Usuarios');
        if (parseInt(countRes.rows[0].count) === 0) {
            const hashAdmin = await bcrypt.hash('123456', 10);
            const hashSecre = await bcrypt.hash('123456', 10);
            await pool.query('INSERT INTO Usuarios (username, password_hash, rol) VALUES ($1, $2, $3)', ['admin', hashAdmin, 'Superusuario']);
            await pool.query('INSERT INTO Usuarios (username, password_hash, rol) VALUES ($1, $2, $3)', ['secre', hashSecre, 'Secretaria']);
            console.log('Usuarios (admin / secre) creados.');
        } else {
            console.log('Los usuarios ya existen.');
        }

        console.log('¡Inicialización de base de datos completada!');
        process.exit(0);
    } catch (err) {
        console.error('Error fatal durante la inicialización:', err);
        process.exit(1);
    }
}

setupRenderDB();
