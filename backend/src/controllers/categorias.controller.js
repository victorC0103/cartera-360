import { getConnection } from '../config/db.js';
import sql from 'mssql';

export const getAllCategorias = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT * FROM Categorias ORDER BY nombre');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener categorÃ­as', error: error.message });
    }
};

export const createCategoria = async (req, res) => {
    const { nombre } = req.body;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('nombre', sql.NVarChar, nombre)
            .query('INSERT INTO Categorias (nombre) VALUES (@nombre)');
        res.status(201).json({ message: 'CategorÃ­a creada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear categorÃ­a', error: error.message });
    }
};
