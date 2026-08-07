import pool from '../config/db.js';

export const getAllCategorias = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Categorias ORDER BY nombre');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener categorías', error: error.message });
    }
};

export const createCategoria = async (req, res) => {
    const { nombre } = req.body;
    try {
        await pool.query('INSERT INTO Categorias (nombre) VALUES ($1)', [nombre]);
        res.status(201).json({ message: 'Categoría creada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear categoría', error: error.message });
    }
};
