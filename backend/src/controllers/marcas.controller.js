import pool from '../config/db.js';

export const getAllMarcas = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Marcas ORDER BY nombre');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener marcas', error: error.message });
    }
};

export const createMarca = async (req, res) => {
    const { nombre } = req.body;
    try {
        await pool.query('INSERT INTO Marcas (nombre) VALUES ($1)', [nombre]);
        res.status(201).json({ message: 'Marca creada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear marca', error: error.message });
    }
};
