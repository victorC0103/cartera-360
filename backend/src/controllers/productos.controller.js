import { getConnection } from '../config/db.js';
import sql from 'mssql';

export const getAllProductos = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT p.*, c.nombre as nombre_categoria, m.nombre as nombre_marca 
            FROM Productos p
            LEFT JOIN Categorias c ON p.id_categoria_fk = c.id_categoria
            LEFT JOIN Marcas m ON p.id_marca_fk = m.id_marca
        `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener productos', error: error.message });
    }
};

export const getProductoById = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT p.*, c.nombre as nombre_categoria, m.nombre as nombre_marca 
                FROM Productos p
                LEFT JOIN Categorias c ON p.id_categoria_fk = c.id_categoria
                LEFT JOIN Marcas m ON p.id_marca_fk = m.id_marca
                WHERE id_producto = @id
            `);

        if (result.rowsAffected[0] === 0) return res.status(404).json({ message: 'Producto no encontrado' });

        res.json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el producto', error: error.message });
    }
};

export const createProducto = async (req, res) => {
    const { codigo_sku, id_categoria_fk, id_marca_fk, modelo, precio_venta_contado, costo_adquisicion, stock_actual } = req.body;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('codigo_sku', sql.NVarChar, codigo_sku)
            .input('id_categoria_fk', sql.Int, id_categoria_fk)
            .input('id_marca_fk', sql.Int, id_marca_fk)
            .input('modelo', sql.NVarChar, modelo)
            .input('precio_venta_contado', sql.Decimal(10, 2), precio_venta_contado)
            .input('costo_adquisicion', sql.Decimal(10, 2), costo_adquisicion)
            .input('stock_actual', sql.Int, stock_actual || 0)
            .query(`
                INSERT INTO Productos (codigo_sku, id_categoria_fk, id_marca_fk, modelo, precio_venta_contado, costo_adquisicion, stock_actual)
                VALUES (@codigo_sku, @id_categoria_fk, @id_marca_fk, @modelo, @precio_venta_contado, @costo_adquisicion, @stock_actual)
            `);
        res.status(201).json({ message: 'Producto creado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el producto', error: error.message });
    }
};

export const updateProducto = async (req, res) => {
    const { codigo_sku, id_categoria_fk, id_marca_fk, modelo, precio_venta_contado, costo_adquisicion, stock_actual } = req.body;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('codigo_sku', sql.NVarChar, codigo_sku)
            .input('id_categoria_fk', sql.Int, id_categoria_fk)
            .input('id_marca_fk', sql.Int, id_marca_fk)
            .input('modelo', sql.NVarChar, modelo)
            .input('precio_venta_contado', sql.Decimal(10, 2), precio_venta_contado)
            .input('costo_adquisicion', sql.Decimal(10, 2), costo_adquisicion)
            .input('stock_actual', sql.Int, stock_actual)
            .query(`
                UPDATE Productos SET 
                    codigo_sku = @codigo_sku,
                    id_categoria_fk = @id_categoria_fk,
                    id_marca_fk = @id_marca_fk,
                    modelo = @modelo,
                    precio_venta_contado = @precio_venta_contado,
                    costo_adquisicion = @costo_adquisicion,
                    stock_actual = @stock_actual
                WHERE id_producto = @id
            `);

        if (result.rowsAffected[0] === 0) return res.status(404).json({ message: 'Producto no encontrado' });

        res.json({ message: 'Producto actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el producto', error: error.message });
    }
};

export const deleteProducto = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Productos WHERE id_producto = @id');

        if (result.rowsAffected[0] === 0) return res.status(404).json({ message: 'Producto no encontrado' });

        res.json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el producto', error: error.message });
    }
};
