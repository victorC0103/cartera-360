import pool from '../config/db.js';

export const getAllVentas = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                v.*,
                c.nombres,
                c.apellidos,
                c.cedula,
                c.telefono_principal,
                c.direccion_detallada,
                sec.nombre AS nombre_sector,
                (
                    SELECT COALESCE(SUM(saldo_pendiente), 0)
                    FROM Cuotas_Amortizacion
                    WHERE id_venta_fk = v.id_venta
                ) AS saldo_pendiente,
                (
                    SELECT monto_cuota
                    FROM Cuotas_Amortizacion
                    WHERE id_venta_fk = v.id_venta
                    ORDER BY numero_cuota ASC
                    LIMIT 1
                ) AS valor_cuota,
                (CASE
                    WHEN EXISTS (
                        SELECT 1 FROM Cuotas_Amortizacion
                        WHERE id_venta_fk = v.id_venta AND estado_cuota = 'MORA'
                    ) THEN 'Mora'
                    WHEN NOT EXISTS (
                        SELECT 1 FROM Cuotas_Amortizacion
                        WHERE id_venta_fk = v.id_venta AND estado_cuota = 'PENDIENTE'
                    ) THEN 'Pagado'
                    ELSE 'Activo'
                END) AS estado,
                (
                    SELECT STRING_AGG(
                        COALESCE(ma.nombre, '') || ' ' || COALESCE(p.modelo, '') ||
                        CASE
                            WHEN s.numero_serie_o_chasis IS NOT NULL
                            THEN ' [S/N: ' || s.numero_serie_o_chasis || ']'
                            ELSE ''
                        END,
                        ' | '
                    )
                    FROM Detalle_Ventas d
                    LEFT JOIN Inventario_Series s ON d.id_serie_fk = s.id_serie
                    LEFT JOIN Productos p ON s.id_producto_fk = p.id_producto
                    LEFT JOIN Marcas ma ON p.id_marca_fk = ma.id_marca
                    WHERE d.id_venta_fk = v.id_venta
                ) AS articulos_detalle,
                (
                    SELECT COUNT(*)
                    FROM Detalle_Ventas d
                    WHERE d.id_venta_fk = v.id_venta
                ) AS cantidad_articulos
            FROM Ventas_Credito v
            LEFT JOIN Clientes c ON v.id_cliente_fk = c.id_cliente
            LEFT JOIN Sectores sec ON c.id_sector_fk = sec.id_sector
            ORDER BY v.fecha_venta DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener contratos de venta', error: error.message });
    }
};

export const getRecaudadoHoy = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT COALESCE(SUM(monto_cobrado), 0) AS total_hoy
            FROM Abonos
            WHERE CAST(fecha_registro AS DATE) = CURRENT_DATE
        `);
        res.json({ total: result.rows[0].total_hoy });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la recaudación del día', error: error.message });
    }
};

export const getVentaById = async (req, res) => {
    try {
        const ventaResult = await pool.query(`
            SELECT v.*, c.nombres, c.apellidos, c.cedula, c.direccion_detallada, c.telefono_principal
            FROM Ventas_Credito v
            LEFT JOIN Clientes c ON v.id_cliente_fk = c.id_cliente
            WHERE v.id_venta = $1
        `, [req.params.id]);
            
        if (ventaResult.rows.length === 0) {
            return res.status(404).json({ message: 'Contrato no encontrado' });
        }
        
        const venta = ventaResult.rows[0];
        
        const detallesResult = await pool.query(`
            SELECT d.*, p.modelo, p.codigo_sku, s.numero_serie_o_chasis
            FROM Detalle_Ventas d
            LEFT JOIN Inventario_Series s ON d.id_serie_fk = s.id_serie
            LEFT JOIN Productos p ON s.id_producto_fk = p.id_producto
            WHERE d.id_venta_fk = $1
        `, [req.params.id]);
            
        const cuotasResult = await pool.query(`
            SELECT * FROM Cuotas_Amortizacion
            WHERE id_venta_fk = $1
            ORDER BY numero_cuota
        `, [req.params.id]);
            
        res.json({
            ...venta,
            detalles: detallesResult.rows,
            cuotas: cuotasResult.rows
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener detalle de venta', error: error.message });
    }
};

export const createVenta = async (req, res) => {
    const { 
        id_cliente_fk, 
        monto_total_productos, 
        valor_entrada, 
        cantidad_cuotas, 
        frecuencia_pago, 
        articulos,
        tasa_interes
    } = req.body;

    const monto_a_financiar = Math.max(0, monto_total_productos - valor_entrada);
    const total_con_intereses = monto_a_financiar + (monto_a_financiar * ((tasa_interes || 15) / 100));
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const saleResult = await client.query(`
            INSERT INTO Ventas_Credito (id_cliente_fk, monto_total_productos, valor_entrada, monto_a_financiar, total_con_intereses, cantidad_cuotas, frecuencia_pago)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id_venta
        `, [id_cliente_fk, monto_total_productos, valor_entrada, monto_a_financiar, total_con_intereses, cantidad_cuotas, frecuencia_pago]);
            
        const id_venta = saleResult.rows[0].id_venta;
        
        for (const art of articulos) {
            const { id_producto, precio_venta_negociado } = art;
            
            let serieResult = await client.query(`
                SELECT id_serie 
                FROM Inventario_Series 
                WHERE id_producto_fk = $1 AND estado_articulo = 'DISPONIBLE'
                LIMIT 1
            `, [id_producto]);
                
            let id_serie;
            if (serieResult.rows.length > 0) {
                id_serie = serieResult.rows[0].id_serie;
                
                await client.query(`
                    UPDATE Inventario_Series 
                    SET estado_articulo = 'VENDIDO' 
                    WHERE id_serie = $1
                `, [id_serie]);
            } else {
                const dummySerieNumber = `S-${id_producto}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                const newSerieResult = await client.query(`
                    INSERT INTO Inventario_Series (id_producto_fk, numero_serie_o_chasis, estado_articulo)
                    VALUES ($1, $2, 'VENDIDO')
                    RETURNING id_serie
                `, [id_producto, dummySerieNumber]);
                id_serie = newSerieResult.rows[0].id_serie;
            }
            
            await client.query(`
                INSERT INTO Detalle_Ventas (id_venta_fk, id_serie_fk, precio_venta_negociado)
                VALUES ($1, $2, $3)
            `, [id_venta, id_serie, precio_venta_negociado]);
                
            await client.query(`
                UPDATE Productos 
                SET stock_actual = CASE WHEN stock_actual > 0 THEN stock_actual - 1 ELSE 0 END 
                WHERE id_producto = $1
            `, [id_producto]);
        }
        
        const cuotaBase = total_con_intereses / cantidad_cuotas;
        const cuotaExacta = parseFloat(cuotaBase.toFixed(2));
        
        let fechaActual = new Date();
        let sumaAcumulada = 0;

        for (let i = 1; i <= cantidad_cuotas; i++) {
            let fechaVencimiento = new Date(fechaActual);
            if (frecuencia_pago === 'Semanal') {
                fechaVencimiento.setDate(fechaVencimiento.getDate() + (i * 7));
            } else if (frecuencia_pago === 'Quincenal') {
                fechaVencimiento.setDate(fechaVencimiento.getDate() + (i * 15));
            } else { 
                fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i);
            }
            
            let montoCuotaActual;
            if (i === cantidad_cuotas) {
                montoCuotaActual = parseFloat((total_con_intereses - sumaAcumulada).toFixed(2));
            } else {
                montoCuotaActual = cuotaExacta;
            }
            
            sumaAcumulada += montoCuotaActual;
            const saldoPendiente = montoCuotaActual;
            
            await client.query(`
                INSERT INTO Cuotas_Amortizacion (id_venta_fk, numero_cuota, fecha_vencimiento, monto_cuota, saldo_pendiente, estado_cuota)
                VALUES ($1, $2, $3, $4, $5, 'PENDIENTE')
            `, [id_venta, i, fechaVencimiento, montoCuotaActual, saldoPendiente]);
        }
        
        await client.query('COMMIT');
        res.status(201).json({ message: 'Contrato y amortización registrados correctamente', id_venta });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Error al registrar la venta a crédito', error: error.message });
    } finally {
        client.release();
    }
};

export const registerAbono = async (req, res) => {
    const { id_venta, monto_cobrado, fecha_registro, metodo_pago } = req.body;
    const comprobante_url = req.file ? `/uploads/${req.file.filename}` : null;
    
    if (!id_venta || !monto_cobrado || isNaN(monto_cobrado) || monto_cobrado <= 0) {
        return res.status(400).json({ message: 'Datos de abono inválidos' });
    }
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const cuotasResult = await client.query(`
            SELECT * FROM Cuotas_Amortizacion 
            WHERE id_venta_fk = $1 AND estado_cuota IN ('PENDIENTE', 'MORA')
            ORDER BY numero_cuota ASC
        `, [id_venta]);
            
        let abonoRestante = parseFloat(monto_cobrado);
        const cuotas = cuotasResult.rows;
        
        if (cuotas.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Este contrato de crédito ya está completamente pagado.' });
        }
        
        for (const cuota of cuotas) {
            if (abonoRestante <= 0) break;
            
            const saldoActual = parseFloat(cuota.saldo_pendiente);
            if (abonoRestante >= saldoActual) {
                await client.query(`
                    UPDATE Cuotas_Amortizacion 
                    SET saldo_pendiente = 0, estado_cuota = 'PAGADA' 
                    WHERE id_cuota = $1
                `, [cuota.id_cuota]);
                abonoRestante -= saldoActual;
            } else {
                const nuevoSaldo = (saldoActual - abonoRestante).toFixed(2);
                await client.query(`
                    UPDATE Cuotas_Amortizacion 
                    SET saldo_pendiente = $1, estado_cuota = 'PENDIENTE' 
                    WHERE id_cuota = $2
                `, [nuevoSaldo, cuota.id_cuota]);
                abonoRestante = 0;
            }
        }
        
        await client.query(`
            INSERT INTO Abonos (id_cartilla, monto_cobrado, fecha_registro, metodo_pago, comprobante_url)
            VALUES ($1, $2, $3, $4, $5)
        `, [id_venta, monto_cobrado, fecha_registro ? new Date(fecha_registro) : new Date(), metodo_pago || 'Efectivo', comprobante_url]);
        
        await client.query('COMMIT');
        res.status(200).json({ message: 'Abono registrado con éxito.' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Error al registrar el abono', error: error.message });
    } finally {
        client.release();
    }
};
