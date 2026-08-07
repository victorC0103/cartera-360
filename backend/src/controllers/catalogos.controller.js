import { getConnection } from '../config/db.js';
import sql from 'mssql';

// â”€â”€ CANTONES â”€â”€
export const getAllCantones = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT * FROM Cantones ORDER BY nombre');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener cantones', error: error.message });
    }
};

export const createCanton = async (req, res) => {
    const { nombre } = req.body;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('nombre', sql.NVarChar, nombre)
            .query('INSERT INTO Cantones (nombre) VALUES (@nombre)');
        res.status(201).json({ message: 'CantÃ³n creado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear cantÃ³n', error: error.message });
    }
};

// â”€â”€ SECTORES â”€â”€
export const getAllSectores = async (req, res) => {
    try {
        const pool = await getConnection();
        const { canton } = req.query; // Filtro opcional: /api/catalogos/sectores?canton=1
        let query = 'SELECT s.*, c.nombre as nombre_canton FROM Sectores s LEFT JOIN Cantones c ON s.id_canton_fk = c.id_canton';
        
        if (canton) {
            const result = await pool.request()
                .input('canton', sql.Int, canton)
                .query(query + ' WHERE s.id_canton_fk = @canton ORDER BY s.nombre');
            return res.json(result.recordset);
        }
        
        const result = await pool.request().query(query + ' ORDER BY s.nombre');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener sectores', error: error.message });
    }
};

export const createSector = async (req, res) => {
    const { id_canton_fk, nombre, tipo_zona } = req.body;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('id_canton_fk', sql.Int, id_canton_fk)
            .input('nombre', sql.NVarChar, nombre)
            .input('tipo_zona', sql.NVarChar, tipo_zona || 'URBANA')
            .query('INSERT INTO Sectores (id_canton_fk, nombre, tipo_zona) VALUES (@id_canton_fk, @nombre, @tipo_zona)');
        res.status(201).json({ message: 'Sector creado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear sector', error: error.message });
    }
};
