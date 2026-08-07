import { getConnection } from '../config/db.js';
import sql from 'mssql/msnodesqlv8.js';

export const getAllVentas = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
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
                    SELECT TOP 1 monto_cuota
                    FROM Cuotas_Amortizacion
                    WHERE id_venta_fk = v.id_venta
                    ORDER BY numero_cuota ASC
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
                -- ── Artículos comprados (marca + modelo + serie) ──────────────
                (
                    SELECT STRING_AGG(
                        ISNULL(ma.nombre, '') + ' ' + ISNULL(p.modelo, '') +
                        CASE
                            WHEN s.numero_serie_o_chasis IS NOT NULL
                            THEN ' [S/N: ' + s.numero_serie_o_chasis + ']'
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
                -- ── Cantidad de artículos ────────────────────────────────────
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
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener contratos de venta', error: error.message });
    }
};

export const getRecaudadoHoy = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT COALESCE(SUM(monto_cobrado), 0) AS total_hoy
            FROM Abonos
            WHERE CAST(fecha_registro AS DATE) = CAST(GETDATE() AS DATE)
        `);
        res.json({ total: result.recordset[0].total_hoy });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la recaudación del día', error: error.message });
    }
};


export const getVentaById = async (req, res) => {
    try {
        const pool = await getConnection();
        const ventaResult = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT v.*, c.nombres, c.apellidos, c.cedula, c.direccion_detallada, c.telefono_principal
                FROM Ventas_Credito v
                LEFT JOIN Clientes c ON v.id_cliente_fk = c.id_cliente
                WHERE v.id_venta = @id
            `);
            
        if (ventaResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Contrato no encontrado' });
        }
        
        const venta = ventaResult.recordset[0];
        
        const detallesResult = await pool.request()
            .input('id_venta', sql.Int, req.params.id)
            .query(`
                SELECT d.*, p.modelo, p.codigo_sku, s.numero_serie_o_chasis
                FROM Detalle_Ventas d
                LEFT JOIN Inventario_Series s ON d.id_serie_fk = s.id_serie
                LEFT JOIN Productos p ON s.id_producto_fk = p.id_producto
                WHERE d.id_venta_fk = @id_venta
            `);
            
        const cuotasResult = await pool.request()
            .input('id_venta', sql.Int, req.params.id)
            .query(`
                SELECT * FROM Cuotas_Amortizacion
                WHERE id_venta_fk = @id_venta
                ORDER BY numero_cuota
            `);
            
        res.json({
            ...venta,
            detalles: detallesResult.recordset,
            cuotas: cuotasResult.recordset
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
    
    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);
    
    try {
        await transaction.begin();
        
        // 1. Insertar en Ventas_Credito
        const saleResult = await transaction.request()
            .input('id_cliente_fk', sql.Int, id_cliente_fk)
            .input('monto_total_productos', sql.Decimal(10, 2), monto_total_productos)
            .input('valor_entrada', sql.Decimal(10, 2), valor_entrada)
            .input('monto_a_financiar', sql.Decimal(10, 2), monto_a_financiar)
            .input('total_con_intereses', sql.Decimal(10, 2), total_con_intereses)
            .input('cantidad_cuotas', sql.Int, cantidad_cuotas)
            .input('frecuencia_pago', sql.NVarChar(50), frecuencia_pago)
            .query(`
                INSERT INTO Ventas_Credito (id_cliente_fk, monto_total_productos, valor_entrada, monto_a_financiar, total_con_intereses, cantidad_cuotas, frecuencia_pago)
                OUTPUT INSERTED.id_venta
                VALUES (@id_cliente_fk, @monto_total_productos, @valor_entrada, @monto_a_financiar, @total_con_intereses, @cantidad_cuotas, @frecuencia_pago)
            `);
            
        const id_venta = saleResult.recordset[0].id_venta;
        
        // 2. Procesar cada artículo en la venta
        for (const art of articulos) {
            const { id_producto, precio_venta_negociado } = art;
            
            // Buscar si existe una serie disponible para este producto
            let serieResult = await transaction.request()
                .input('id_producto', sql.Int, id_producto)
                .query(`
                    SELECT TOP 1 id_serie 
                    FROM Inventario_Series 
                    WHERE id_producto_fk = @id_producto AND estado_articulo = 'DISPONIBLE'
                `);
                
            let id_serie;
            if (serieResult.recordset.length > 0) {
                id_serie = serieResult.recordset[0].id_serie;
                
                // Actualizar estado de la serie a 'VENDIDO'
                await transaction.request()
                    .input('id_serie', sql.Int, id_serie)
                    .query(`
                        UPDATE Inventario_Series 
                        SET estado_articulo = 'VENDIDO' 
                        WHERE id_serie = @id_serie
                    `);
            } else {
                // Si no hay series físicas disponibles, creamos una de respaldo
                const dummySerieNumber = `S-${id_producto}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                const newSerieResult = await transaction.request()
                    .input('id_producto', sql.Int, id_producto)
                    .input('numero_serie', sql.NVarChar, dummySerieNumber)
                    .query(`
                        INSERT INTO Inventario_Series (id_producto_fk, numero_serie_o_chasis, estado_articulo)
                        OUTPUT INSERTED.id_serie
                        VALUES (@id_producto, @numero_serie, 'VENDIDO')
                    `);
                id_serie = newSerieResult.recordset[0].id_serie;
            }
            
            // Insertar en Detalle_Ventas
            await transaction.request()
                .input('id_venta_fk', sql.Int, id_venta)
                .input('id_serie_fk', sql.Int, id_serie)
                .input('precio_venta_negociado', sql.Decimal(10, 2), precio_venta_negociado)
                .query(`
                    INSERT INTO Detalle_Ventas (id_venta_fk, id_serie_fk, precio_venta_negociado)
                    VALUES (@id_venta_fk, @id_serie_fk, @precio_venta_negociado)
                `);
                
            // Disminuir stock en Productos
            await transaction.request()
                .input('id_producto', sql.Int, id_producto)
                .query(`
                    UPDATE Productos 
                    SET stock_actual = CASE WHEN stock_actual > 0 THEN stock_actual - 1 ELSE 0 END 
                    WHERE id_producto = @id_producto
                `);
        }
        
        // 3. Generar la Cartilla de Amortización (Cuotas_Amortizacion)
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
            } else { // Mensual
                fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i);
            }
            
            // Determinar si es la última cuota (Ajuste) o una cuota normal exacta
            let montoCuotaActual;
            if (i === cantidad_cuotas) {
                montoCuotaActual = parseFloat((total_con_intereses - sumaAcumulada).toFixed(2));
            } else {
                montoCuotaActual = cuotaExacta;
            }
            
            sumaAcumulada += montoCuotaActual;
            // El saldo pendiente inicial de una cuota es exactamente su monto
            const saldoPendiente = montoCuotaActual;
            
            await transaction.request()
                .input('id_venta_fk', sql.Int, id_venta)
                .input('numero_cuota', sql.Int, i)
                .input('fecha_vencimiento', sql.Date, fechaVencimiento)
                .input('monto_cuota', sql.Decimal(10, 2), montoCuotaActual)
                .input('saldo_pendiente', sql.Decimal(10, 2), saldoPendiente)
                .query(`
                    INSERT INTO Cuotas_Amortizacion (id_venta_fk, numero_cuota, fecha_vencimiento, monto_cuota, saldo_pendiente, estado_cuota)
                    VALUES (@id_venta_fk, @numero_cuota, @fecha_vencimiento, @monto_cuota, @saldo_pendiente, 'PENDIENTE')
                `);
        }
        
        await transaction.commit();
        res.status(201).json({ message: 'Contrato y amortización registrados correctamente', id_venta });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ message: 'Error al registrar la venta a crédito', error: error.message });
    }
};

export const registerAbono = async (req, res) => {
    const { id_venta, monto_cobrado, fecha_registro, metodo_pago } = req.body;
    const comprobante_url = req.file ? `/uploads/${req.file.filename}` : null;
    
    if (!id_venta || !monto_cobrado || isNaN(monto_cobrado) || monto_cobrado <= 0) {
        return res.status(400).json({ message: 'Datos de abono inválidos' });
    }
    
    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);
    
    try {
        await transaction.begin();
        
        // 1. Obtener todas las cuotas pendientes o en mora de la venta
        const cuotasResult = await transaction.request()
            .input('id_venta', sql.Int, id_venta)
            .query(`
                SELECT * FROM Cuotas_Amortizacion 
                WHERE id_venta_fk = @id_venta AND estado_cuota IN ('PENDIENTE', 'MORA')
                ORDER BY numero_cuota ASC
            `);
            
        let abonoRestante = parseFloat(monto_cobrado);
        const cuotas = cuotasResult.recordset;
        
        if (cuotas.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Este contrato de crédito ya está completamente pagado.' });
        }
        
        for (const cuota of cuotas) {
            if (abonoRestante <= 0) break;
            
            const saldoActual = parseFloat(cuota.saldo_pendiente);
            if (abonoRestante >= saldoActual) {
                // Pago completo de esta cuota
                await transaction.request()
                    .input('id_cuota', sql.Int, cuota.id_cuota)
                    .query(`
                        UPDATE Cuotas_Amortizacion 
                        SET saldo_pendiente = 0, estado_cuota = 'PAGADA' 
                        WHERE id_cuota = @id_cuota
                    `);
                abonoRestante -= saldoActual;
            } else {
                // Pago parcial de esta cuota
                const nuevoSaldo = (saldoActual - abonoRestante).toFixed(2);
                await transaction.request()
                    .input('id_cuota', sql.Int, cuota.id_cuota)
                    .input('nuevo_saldo', sql.Decimal(10, 2), nuevoSaldo)
                    .query(`
                        UPDATE Cuotas_Amortizacion 
                        SET saldo_pendiente = @nuevo_saldo, estado_cuota = 'PENDIENTE' 
                        WHERE id_cuota = @id_cuota
                    `);
                abonoRestante = 0;
            }
        }
        
        // 2. Registrar el pago en el historial de Abonos
        await transaction.request()
            .input('id_cartilla', sql.Int, id_venta)
            .input('monto_cobrado', sql.Decimal(10, 2), monto_cobrado)
            .input('fecha_registro', sql.DateTime, fecha_registro ? new Date(fecha_registro) : new Date())
            .input('metodo_pago', sql.NVarChar(50), metodo_pago || 'Efectivo')
            .input('comprobante_url', sql.NVarChar(255), comprobante_url)
            .query(`
                INSERT INTO Abonos (id_cartilla, monto_cobrado, fecha_registro, metodo_pago, comprobante_url)
                VALUES (@id_cartilla, @monto_cobrado, @fecha_registro, @metodo_pago, @comprobante_url)
            `);
        
        await transaction.commit();
        res.status(200).json({ message: 'Abono registrado con éxito.' });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ message: 'Error al registrar el abono', error: error.message });
    }
};

