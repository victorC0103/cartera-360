import pool from '../config/db.js';

export const getMoraPorSector = async (req, res) => {
    try {
        const query = `
            SELECT 
                sec.nombre AS sector, 
                SUM(ca.saldo_pendiente) AS total_mora
            FROM Clientes c
            INNER JOIN Ventas_Credito vc ON c.id_cliente = vc.id_cliente_fk
            INNER JOIN Cuotas_Amortizacion ca ON vc.id_venta = ca.id_venta_fk
            INNER JOIN Sectores sec ON c.id_sector_fk = sec.id_sector
            WHERE ca.estado_cuota = 'MORA' 
            GROUP BY sec.nombre
            ORDER BY total_mora DESC
            LIMIT 5;
        `;

        const result = await pool.query(query);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener el ranking de mora por sector:', error);
        res.status(500).json({ message: 'Error interno del servidor al procesar la estadística' });
    }
};

export const getIngresosSemana = async (req, res) => {
    try {
        const query = `
            SELECT 
                CAST(fecha_registro AS DATE) AS fecha,
                SUM(monto_cobrado) AS total_ingresos
            FROM Abonos
            WHERE fecha_registro >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY CAST(fecha_registro AS DATE)
            ORDER BY fecha ASC;
        `;

        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener ingresos de la semana:', error);
        res.status(500).json({ message: 'Error interno del servidor al procesar la estadística' });
    }
};

export const getEstadoCarteraPorZona = async (req, res) => {
    try {
        const query = `
            SELECT 
                sec.nombre AS zona,
                SUM(ca.saldo_pendiente) AS total_cartera
            FROM Cuotas_Amortizacion ca
            INNER JOIN Ventas_Credito vc ON ca.id_venta_fk = vc.id_venta
            INNER JOIN Clientes c ON vc.id_cliente_fk = c.id_cliente
            INNER JOIN Sectores sec ON c.id_sector_fk = sec.id_sector
            WHERE ca.estado_cuota IN ('PENDIENTE', 'MORA')
            GROUP BY sec.nombre
            ORDER BY total_cartera DESC;
        `;

        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener el estado de cartera por zona:', error);
        res.status(500).json({ message: 'Error interno del servidor al procesar la estadística' });
    }
};

export const getKpis = async (req, res) => {
    try {
        const carteraResult = await pool.query(`
            SELECT COALESCE(SUM(saldo_pendiente), 0) AS total
            FROM Cuotas_Amortizacion
            WHERE estado_cuota IN ('PENDIENTE', 'MORA')
        `);
        const carteraActiva = parseFloat(carteraResult.rows[0].total);

        const moraResult = await pool.query(`
            SELECT COALESCE(SUM(saldo_pendiente), 0) AS total
            FROM Cuotas_Amortizacion
            WHERE estado_cuota = 'MORA'
        `);
        const moraTotal = parseFloat(moraResult.rows[0].total);
        
        const indiceMorosidad = carteraActiva > 0 ? (moraTotal / carteraActiva) * 100 : 0;

        const recaudacionResult = await pool.query(`
            SELECT COALESCE(SUM(monto_cobrado), 0) AS total
            FROM Abonos
            WHERE CAST(fecha_registro AS DATE) = CURRENT_DATE
        `);
        const recaudacionHoy = parseFloat(recaudacionResult.rows[0].total);

        const clientesResult = await pool.query(`
            SELECT COUNT(DISTINCT vc.id_cliente_fk) AS total
            FROM Ventas_Credito vc
            INNER JOIN Cuotas_Amortizacion ca ON vc.id_venta = ca.id_venta_fk
            WHERE ca.estado_cuota IN ('PENDIENTE', 'MORA')
        `);
        const clientesActivos = parseInt(clientesResult.rows[0].total);

        res.status(200).json({
            carteraActiva,
            indiceMorosidad,
            recaudacionHoy,
            clientesActivos
        });
    } catch (error) {
        console.error('Error al obtener KPIs:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

export const getAlertasCobranza = async (req, res) => {
    try {
        const query = `
            SELECT 
                c.nombres || ' ' || c.apellidos AS cliente,
                c.cedula,
                sec.nombre AS zona,
                CURRENT_DATE - MIN(ca.fecha_vencimiento) AS dias,
                SUM(ca.saldo_pendiente) AS monto
            FROM Cuotas_Amortizacion ca
            INNER JOIN Ventas_Credito vc ON ca.id_venta_fk = vc.id_venta
            INNER JOIN Clientes c ON vc.id_cliente_fk = c.id_cliente
            INNER JOIN Sectores sec ON c.id_sector_fk = sec.id_sector
            WHERE ca.estado_cuota = 'MORA'
            GROUP BY c.id_cliente, c.nombres, c.apellidos, c.cedula, sec.nombre
            HAVING CURRENT_DATE - MIN(ca.fecha_vencimiento) >= 30
            ORDER BY dias DESC;
        `;
        
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener alertas:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
