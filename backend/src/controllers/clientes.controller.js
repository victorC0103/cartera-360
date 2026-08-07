import pool from '../config/db.js';

export const getAllClientes = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, s.nombre as nombre_sector, s.tipo_zona, cant.nombre as nombre_canton 
            FROM Clientes c
            LEFT JOIN Sectores s ON c.id_sector_fk = s.id_sector
            LEFT JOIN Cantones cant ON s.id_canton_fk = cant.id_canton
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener clientes', error: error.message });
    }
};

export const getClienteById = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, s.nombre as nombre_sector, s.tipo_zona, cant.nombre as nombre_canton 
            FROM Clientes c
            LEFT JOIN Sectores s ON c.id_sector_fk = s.id_sector
            LEFT JOIN Cantones cant ON s.id_canton_fk = cant.id_canton
            WHERE id_cliente = $1
        `, [req.params.id]);

        if (result.rowCount === 0) return res.status(404).json({ message: 'Cliente no encontrado' });

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el cliente', error: error.message });
    }
};

export const createCliente = async (req, res) => {
    const { cedula, nombres, apellidos, id_sector_fk, direccion_detallada, latitud, longitud, telefono_principal, estado_cliente } = req.body;
    try {
        await pool.query(`
            INSERT INTO Clientes (cedula, nombres, apellidos, id_sector_fk, direccion_detallada, latitud, longitud, telefono_principal, estado_cliente)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [cedula, nombres, apellidos, id_sector_fk, direccion_detallada, latitud || null, longitud || null, telefono_principal, estado_cliente || 'ACTIVO']);
        res.status(201).json({ message: 'Cliente creado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el cliente', error: error.message });
    }
};

export const updateCliente = async (req, res) => {
    const { cedula, nombres, apellidos, id_sector_fk, direccion_detallada, latitud, longitud, telefono_principal, estado_cliente } = req.body;
    try {
        const result = await pool.query(`
            UPDATE Clientes SET 
                cedula = $1,
                nombres = $2,
                apellidos = $3,
                id_sector_fk = $4,
                direccion_detallada = $5,
                latitud = $6,
                longitud = $7,
                telefono_principal = $8,
                estado_cliente = $9
            WHERE id_cliente = $10
        `, [cedula, nombres, apellidos, id_sector_fk, direccion_detallada, latitud || null, longitud || null, telefono_principal || null, estado_cliente || 'ACTIVO', req.params.id]);

        if (result.rowCount === 0) return res.status(404).json({ message: 'Cliente no encontrado' });

        res.json({ message: 'Cliente actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el cliente', error: error.message });
    }
};

export const deleteCliente = async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM Clientes WHERE id_cliente = $1', [req.params.id]);

        if (result.rowCount === 0) return res.status(404).json({ message: 'Cliente no encontrado' });

        res.json({ message: 'Cliente eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el cliente', error: error.message });
    }
};
