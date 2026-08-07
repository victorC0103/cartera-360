import pool from '../config/db.js';

export const getAllProductos = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, c.nombre as nombre_categoria, m.nombre as nombre_marca 
            FROM Productos p
            LEFT JOIN Categorias c ON p.id_categoria_fk = c.id_categoria
            LEFT JOIN Marcas m ON p.id_marca_fk = m.id_marca
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener productos', error: error.message });
    }
};

export const getProductoById = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, c.nombre as nombre_categoria, m.nombre as nombre_marca 
            FROM Productos p
            LEFT JOIN Categorias c ON p.id_categoria_fk = c.id_categoria
            LEFT JOIN Marcas m ON p.id_marca_fk = m.id_marca
            WHERE id_producto = $1
        `, [req.params.id]);

        if (result.rowCount === 0) return res.status(404).json({ message: 'Producto no encontrado' });

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el producto', error: error.message });
    }
};

export const createProducto = async (req, res) => {
    const { codigo_sku, id_categoria_fk, id_marca_fk, modelo, precio_venta_contado, costo_adquisicion, stock_actual } = req.body;
    try {
        await pool.query(`
            INSERT INTO Productos (codigo_sku, id_categoria_fk, id_marca_fk, modelo, precio_venta_contado, costo_adquisicion, stock_actual)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [codigo_sku, id_categoria_fk, id_marca_fk, modelo, precio_venta_contado, costo_adquisicion, stock_actual || 0]);
        res.status(201).json({ message: 'Producto creado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el producto', error: error.message });
    }
};

export const updateProducto = async (req, res) => {
    const { codigo_sku, id_categoria_fk, id_marca_fk, modelo, precio_venta_contado, costo_adquisicion, stock_actual } = req.body;
    try {
        const result = await pool.query(`
            UPDATE Productos SET 
                codigo_sku = $1,
                id_categoria_fk = $2,
                id_marca_fk = $3,
                modelo = $4,
                precio_venta_contado = $5,
                costo_adquisicion = $6,
                stock_actual = $7
            WHERE id_producto = $8
        `, [codigo_sku, id_categoria_fk, id_marca_fk, modelo, precio_venta_contado, costo_adquisicion, stock_actual, req.params.id]);

        if (result.rowCount === 0) return res.status(404).json({ message: 'Producto no encontrado' });

        res.json({ message: 'Producto actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el producto', error: error.message });
    }
};

export const deleteProducto = async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM Productos WHERE id_producto = $1', [req.params.id]);

        if (result.rowCount === 0) return res.status(404).json({ message: 'Producto no encontrado' });

        res.json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el producto', error: error.message });
    }
};
