import pool from './db.js';
import bcrypt from 'bcryptjs';

async function initAuthDB() {
    try {
        console.log('Creando tabla Usuarios si no existe...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Usuarios (
                id_usuario SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                rol VARCHAR(30) NOT NULL CHECK (rol IN ('Superusuario', 'Secretaria')),
                estado BOOLEAN DEFAULT TRUE
            );
        `);
        console.log('Tabla Usuarios lista.');

        // Comprobar si hay usuarios
        const countRes = await pool.query('SELECT COUNT(*) as count FROM Usuarios');
        if (parseInt(countRes.rows[0].count) === 0) {
            console.log('No hay usuarios, insertando admin y secre por defecto...');
            
            const hashAdmin = await bcrypt.hash('123456', 10);
            const hashSecre = await bcrypt.hash('123456', 10);
            
            await pool.query(`
                INSERT INTO Usuarios (username, password_hash, rol) VALUES ($1, $2, $3);
            `, ['admin', hashAdmin, 'Superusuario']);
            
            await pool.query(`
                INSERT INTO Usuarios (username, password_hash, rol) VALUES ($1, $2, $3);
            `, ['secre', hashSecre, 'Secretaria']);

            console.log('Usuarios de prueba creados exitosamente.');
        } else {
            console.log('Los usuarios ya existen en la base de datos.');
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Error al inicializar la BD de autenticación:', err);
        process.exit(1);
    }
}

initAuthDB();
