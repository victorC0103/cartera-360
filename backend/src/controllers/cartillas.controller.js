import pool from '../config/db.js';

export const procesarImportacionMasiva = async (req, res) => {
    const { registros } = req.body;
    
    if (!registros || !Array.isArray(registros) || registros.length === 0) {
        return res.status(400).json({ message: 'No se enviaron registros para importar.' });
    }

    const client = await pool.connect();
    
    let creadosClientes = 0;
    let procesadosContratos = 0;

    try {
        await client.query('BEGIN');
        
        for (const reg of registros) {
            const { 
                cedula_cliente, 
                nombres_cliente, 
                monto_total, 
                saldo_pendiente, 
                valor_cuota, 
                frecuencia_pago, 
                fecha_emision, 
                estado 
            } = reg;

            let clientRes = await client.query('SELECT id_cliente FROM Clientes WHERE cedula = $1', [String(cedula_cliente).trim()]);

            let id_cliente;
            if (clientRes.rows.length > 0) {
                id_cliente = clientRes.rows[0].id_cliente;
            } else {
                const nameParts = (nombres_cliente || 'Importado').trim().split(/\s+/);
                const nombres = nameParts[0] || 'Importado';
                const apellidos = nameParts.slice(1).join(' ') || 'Importado';

                const newClientRes = await client.query(`
                    INSERT INTO Clientes (cedula, nombres, apellidos, id_sector_fk, estado_cliente)
                    VALUES ($1, $2, $3, 1, 'ACTIVO')
                    RETURNING id_cliente
                `, [String(cedula_cliente).trim(), nombres, apellidos]);
                
                id_cliente = newClientRes.rows[0].id_cliente;
                creadosClientes++;
            }

            const totalVal = parseFloat(monto_total) || 0;
            const saldoVal = parseFloat(saldo_pendiente) !== undefined ? parseFloat(saldo_pendiente) : totalVal;
            const cuotaVal = parseFloat(valor_cuota) || 0;
            const entradaVal = Math.max(0, totalVal - saldoVal);
            const freq = (frecuencia_pago || 'Mensual').trim();
            const dateEmision = fecha_emision ? new Date(fecha_emision) : new Date();

            let cantCuotas = 12;
            if (cuotaVal > 0) {
                cantCuotas = Math.ceil(saldoVal / cuotaVal);
            }

            const saleRes = await client.query(`
                INSERT INTO Ventas_Credito (id_cliente_fk, fecha_venta, monto_total_productos, valor_entrada, monto_a_financiar, total_con_intereses, cantidad_cuotas, frecuencia_pago)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id_venta
            `, [id_cliente, dateEmision, totalVal, entradaVal, saldoVal, saldoVal, cantCuotas, freq]);

            const id_venta = saleRes.rows[0].id_venta;

            if (cantCuotas > 0 && saldoVal > 0) {
                const valorCuotaIndividual = cuotaVal > 0 ? cuotaVal : (saldoVal / cantCuotas);
                
                for (let i = 1; i <= cantCuotas; i++) {
                    let fechaVencimiento = new Date(dateEmision);
                    if (freq === 'Semanal') {
                        fechaVencimiento.setDate(fechaVencimiento.getDate() + (i * 7));
                    } else if (freq === 'Quincenal') {
                        fechaVencimiento.setDate(fechaVencimiento.getDate() + (i * 15));
                    } else { 
                        fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i);
                    }

                    const cuotaSaldo = Math.min(valorCuotaIndividual, Math.max(0, saldoVal - (valorCuotaIndividual * (i - 1))));
                    const cuotaEstado = (estado || 'PENDIENTE').toUpperCase();

                    await client.query(`
                        INSERT INTO Cuotas_Amortizacion (id_venta_fk, numero_cuota, fecha_vencimiento, monto_cuota, saldo_pendiente, estado_cuota)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [id_venta, i, fechaVencimiento, valorCuotaIndividual, cuotaSaldo, cuotaEstado]);
                }
            }

            procesadosContratos++;
        }

        await client.query('COMMIT');
        res.status(201).json({ 
            message: 'Importación masiva completada con éxito.',
            contratosProcesados: procesadosContratos,
            clientesCreados: creadosClientes
        });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Error al procesar la importación masiva', error: error.message });
    } finally {
        client.release();
    }
};

export const getAbonosByCartilla = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM Abonos WHERE id_cartilla = $1 ORDER BY fecha_registro DESC', [id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el historial de abonos', error: error.message });
    }
};
