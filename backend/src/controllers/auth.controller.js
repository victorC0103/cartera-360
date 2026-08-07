import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const userRes = await pool.query('SELECT * FROM Usuarios WHERE username = $1', [username]);

        const dbUser = userRes.rows[0];

        if (!dbUser) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }

        // Verificamos la contraseña usando bcryptjs
        const isMatch = await bcrypt.compare(password, dbUser.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        // Generar JWT que firma el id y el rol del usuario
        const token = jwt.sign(
            { id: dbUser.id_usuario, rol: dbUser.rol },
            process.env.JWT_SECRET || 'crediruta_secret_key_2026',
            { expiresIn: '8h' }
        );

        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: dbUser.id_usuario,
                username: dbUser.username,
                rol: dbUser.rol
            }
        });
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ 
            message: 'Error en el servidor', 
            error: error.message, 
            detalles: error.stack 
        });
    }
};
