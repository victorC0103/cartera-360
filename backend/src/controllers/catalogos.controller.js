import pool from '../config/db.js';

// —— CANTONES ——
export const getAllCantones = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Cantones ORDER BY nombre');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener cantones', error: error.message });
    }
};

export const createCanton = async (req, res) => {
    const { nombre } = req.body;
    try {
        await pool.query('INSERT INTO Cantones (nombre) VALUES ($1)', [nombre]);
        res.status(201).json({ message: 'Cantón creado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear cantón', error: error.message });
    }
};

// —— SECTORES ——
export const getAllSectores = async (req, res) => {
    try {
        const { canton } = req.query; // Filtro opcional: /api/catalogos/sectores?canton=1
        let query = 'SELECT s.*, c.nombre as nombre_canton FROM Sectores s LEFT JOIN Cantones c ON s.id_canton_fk = c.id_canton';
        
        if (canton) {
            const result = await pool.query(query + ' WHERE s.id_canton_fk = $1 ORDER BY s.nombre', [canton]);
            return res.json(result.rows);
        }
        
        const result = await pool.query(query + ' ORDER BY s.nombre');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener sectores', error: error.message });
    }
};

export const createSector = async (req, res) => {
    const { id_canton_fk, nombre, tipo_zona } = req.body;
    try {
        await pool.query('INSERT INTO Sectores (id_canton_fk, nombre, tipo_zona) VALUES ($1, $2, $3)', [id_canton_fk, nombre, tipo_zona || 'URBANA']);
        res.status(201).json({ message: 'Sector creado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear sector', error: error.message });
    }
};
