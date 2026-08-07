import { getConnection } from './db.js';
import bcrypt from 'bcryptjs';
import sql from 'mssql/msnodesqlv8.js';

async function initAuthDB() {
    try {
        const pool = await getConnection();
        
        console.log('Creando tabla Usuarios si no existe...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Usuarios' and xtype='U')
            BEGIN
                CREATE TABLE Usuarios (
                    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
                    username NVARCHAR(50) UNIQUE NOT NULL,
                    password_hash NVARCHAR(255) NOT NULL,
                    rol NVARCHAR(30) NOT NULL CHECK (rol IN ('Superusuario', 'Secretaria')),
                    estado BIT DEFAULT 1
                );
            END
        `);
        console.log('Tabla Usuarios lista.');

        // Comprobar si hay usuarios
        const countRes = await pool.request().query('SELECT COUNT(*) as count FROM Usuarios');
        if (countRes.recordset[0].count === 0) {
            console.log('No hay usuarios, insertando admin y secre por defecto...');
            
            const hashAdmin = await bcrypt.hash('123456', 10);
            const hashSecre = await bcrypt.hash('123456', 10);
            
            await pool.request()
                .input('user1', sql.NVarChar, 'admin')
                .input('pass1', sql.NVarChar, hashAdmin)
                .input('rol1', sql.NVarChar, 'Superusuario')
                .input('user2', sql.NVarChar, 'secre')
                .input('pass2', sql.NVarChar, hashSecre)
                .input('rol2', sql.NVarChar, 'Secretaria')
                .query(`
                    INSERT INTO Usuarios (username, password_hash, rol) VALUES (@user1, @pass1, @rol1);
                    INSERT INTO Usuarios (username, password_hash, rol) VALUES (@user2, @pass2, @rol2);
                `);
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
