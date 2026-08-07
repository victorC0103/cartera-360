import { getConnection } from '../config/db.js';

export const getMoraPorSector = async (req, res) => {
    try {
        const pool = await getConnection();
        
        const query = `
            SELECT TOP 5 
                sec.nombre AS sector, 
                SUM(ca.saldo_pendiente) AS total_mora
            FROM Clientes c
            INNER JOIN Ventas_Credito vc ON c.id_cliente = vc.id_cliente_fk
            INNER JOIN Cuotas_Amortizacion ca ON vc.id_venta = ca.id_venta_fk
            INNER JOIN Sectores sec ON c.id_sector_fk = sec.id_sector
            WHERE ca.estado_cuota = 'MORA' 
            GROUP BY sec.nombre
            ORDER BY total_mora DESC;
        `;

        const result = await pool.request().query(query);

        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error al obtener el ranking de mora por sector:', error);
        res.status(500).json({ message: 'Error interno del servidor al procesar la estadÃ­stica' });
    }
};

export const getIngresosSemana = async (req, res) => {
    try {
        const pool = await getConnection();
        
        const query = `
            SELECT 
                CAST(fecha_registro AS DATE) AS fecha,
                SUM(monto_cobrado) AS total_ingresos
            FROM Abonos
            WHERE fecha_registro >= DATEADD(day, -7, GETDATE())
            GROUP BY CAST(fecha_registro AS DATE)
            ORDER BY fecha ASC;
        `;

        const result = await pool.request().query(query);
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error al obtener ingresos de la semana:', error);
        res.status(500).json({ message: 'Error interno del servidor al procesar la estadÃ­stica' });
    }
};

export const getEstadoCarteraPorZona = async (req, res) => {
    try {
        const pool = await getConnection();
        
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

        const result = await pool.request().query(query);
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error al obtener el estado de cartera por zona:', error);
        res.status(500).json({ message: 'Error interno del servidor al procesar la estadÃ­stica' });
    }
};

export const getKpis = async (req, res) => {
    try {
        const pool = await getConnection();
        
        const carteraResult = await pool.request().query(`
            SELECT COALESCE(SUM(saldo_pendiente), 0) AS total
            FROM Cuotas_Amortizacion
            WHERE estado_cuota IN ('PENDIENTE', 'MORA')
        `);
        const carteraActiva = carteraResult.recordset[0].total;

        const moraResult = await pool.request().query(`
            SELECT COALESCE(SUM(saldo_pendiente), 0) AS total
            FROM Cuotas_Amortizacion
            WHERE estado_cuota = 'MORA'
        `);
        const moraTotal = moraResult.recordset[0].total;
        
        const indiceMorosidad = carteraActiva > 0 ? (moraTotal / carteraActiva) * 100 : 0;

        const recaudacionResult = await pool.request().query(`
            SELECT COALESCE(SUM(monto_cobrado), 0) AS total
            FROM Abonos
            WHERE CAST(fecha_registro AS DATE) = CAST(GETDATE() AS DATE)
        `);
        const recaudacionHoy = recaudacionResult.recordset[0].total;

        const clientesResult = await pool.request().query(`
            SELECT COUNT(DISTINCT vc.id_cliente_fk) AS total
            FROM Ventas_Credito vc
            INNER JOIN Cuotas_Amortizacion ca ON vc.id_venta = ca.id_venta_fk
            WHERE ca.estado_cuota IN ('PENDIENTE', 'MORA')
        `);
        const clientesActivos = clientesResult.recordset[0].total;

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
        const pool = await getConnection();
        
        const query = `
            SELECT 
                c.nombres + ' ' + c.apellidos AS cliente,
                c.cedula,
                sec.nombre AS zona,
                DATEDIFF(day, MIN(ca.fecha_vencimiento), GETDATE()) AS dias,
                SUM(ca.saldo_pendiente) AS monto
            FROM Cuotas_Amortizacion ca
            INNER JOIN Ventas_Credito vc ON ca.id_venta_fk = vc.id_venta
            INNER JOIN Clientes c ON vc.id_cliente_fk = c.id_cliente
            INNER JOIN Sectores sec ON c.id_sector_fk = sec.id_sector
            WHERE ca.estado_cuota = 'MORA'
            GROUP BY c.id_cliente, c.nombres, c.apellidos, c.cedula, sec.nombre
            HAVING DATEDIFF(day, MIN(ca.fecha_vencimiento), GETDATE()) >= 30
            ORDER BY dias DESC;
        `;
        
        const result = await pool.request().query(query);
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error al obtener alertas:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
