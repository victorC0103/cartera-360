import { getConnection } from '../config/db.js';
import sql from 'mssql/msnodesqlv8.js';

export const getAllClientes = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT c.*, s.nombre as nombre_sector, s.tipo_zona, cant.nombre as nombre_canton 
            FROM Clientes c
            LEFT JOIN Sectores s ON c.id_sector_fk = s.id_sector
            LEFT JOIN Cantones cant ON s.id_canton_fk = cant.id_canton
        `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener clientes', error: error.message });
    }
};

export const getClienteById = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT c.*, s.nombre as nombre_sector, s.tipo_zona, cant.nombre as nombre_canton 
                FROM Clientes c
                LEFT JOIN Sectores s ON c.id_sector_fk = s.id_sector
                LEFT JOIN Cantones cant ON s.id_canton_fk = cant.id_canton
                WHERE id_cliente = @id
            `);

        if (result.rowsAffected[0] === 0) return res.status(404).json({ message: 'Cliente no encontrado' });

        res.json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el cliente', error: error.message });
    }
};

export const createCliente = async (req, res) => {
    const { cedula, nombres, apellidos, id_sector_fk, direccion_detallada, latitud, longitud, telefono_principal, estado_cliente } = req.body;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('cedula', sql.NVarChar, cedula)
            .input('nombres', sql.NVarChar, nombres)
            .input('apellidos', sql.NVarChar, apellidos)
            .input('id_sector_fk', sql.Int, id_sector_fk)
            .input('direccion_detallada', sql.NVarChar, direccion_detallada)
            .input('latitud', sql.Decimal(10, 8), latitud || null)
            .input('longitud', sql.Decimal(11, 8), longitud || null)
            .input('telefono_principal', sql.NVarChar, telefono_principal)
            .input('estado_cliente', sql.NVarChar, estado_cliente || 'ACTIVO')
            .query(`
                INSERT INTO Clientes (cedula, nombres, apellidos, id_sector_fk, direccion_detallada, latitud, longitud, telefono_principal, estado_cliente)
                VALUES (@cedula, @nombres, @apellidos, @id_sector_fk, @direccion_detallada, @latitud, @longitud, @telefono_principal, @estado_cliente)
            `);
        res.status(201).json({ message: 'Cliente creado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el cliente', error: error.message });
    }
};

export const updateCliente = async (req, res) => {
    const { cedula, nombres, apellidos, id_sector_fk, direccion_detallada, latitud, longitud, telefono_principal, estado_cliente } = req.body;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('cedula', sql.NVarChar, cedula)
            .input('nombres', sql.NVarChar, nombres)
            .input('apellidos', sql.NVarChar, apellidos)
            .input('id_sector_fk', sql.Int, id_sector_fk)
            .input('direccion_detallada', sql.NVarChar, direccion_detallada)
            .input('latitud', sql.Decimal(10, 8), latitud || null)
            .input('longitud', sql.Decimal(11, 8), longitud || null)
            .input('telefono_principal', sql.NVarChar, telefono_principal || null)
            .input('estado_cliente', sql.NVarChar, estado_cliente || 'ACTIVO')
            .query(`
                UPDATE Clientes SET 
                    cedula = @cedula,
                    nombres = @nombres,
                    apellidos = @apellidos,
                    id_sector_fk = @id_sector_fk,
                    direccion_detallada = @direccion_detallada,
                    latitud = @latitud,
                    longitud = @longitud,
                    telefono_principal = @telefono_principal,
                    estado_cliente = @estado_cliente
                WHERE id_cliente = @id
            `);

        if (result.rowsAffected[0] === 0) return res.status(404).json({ message: 'Cliente no encontrado' });

        res.json({ message: 'Cliente actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el cliente', error: error.message });
    }
};

export const deleteCliente = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Clientes WHERE id_cliente = @id');

        if (result.rowsAffected[0] === 0) return res.status(404).json({ message: 'Cliente no encontrado' });

        res.json({ message: 'Cliente eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el cliente', error: error.message });
    }
};
