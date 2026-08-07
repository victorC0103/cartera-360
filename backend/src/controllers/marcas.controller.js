import { getConnection } from '../config/db.js';
import sql from 'mssql';

export const getAllMarcas = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT * FROM Marcas ORDER BY nombre');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener marcas', error: error.message });
    }
};

export const createMarca = async (req, res) => {
    const { nombre } = req.body;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('nombre', sql.NVarChar, nombre)
            .query('INSERT INTO Marcas (nombre) VALUES (@nombre)');
        res.status(201).json({ message: 'Marca creada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear marca', error: error.message });
    }
};
