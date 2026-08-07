import { getConnection } from '../config/db.js';
import sql from 'mssql/msnodesqlv8.js';

export const procesarImportacionMasiva = async (req, res) => {
    const { registros } = req.body;
    
    if (!registros || !Array.isArray(registros) || registros.length === 0) {
        return res.status(400).json({ message: 'No se enviaron registros para importar.' });
    }

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);
    
    let creadosClientes = 0;
    let procesadosContratos = 0;

    try {
        await transaction.begin();
        
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

            // 1. Validar existencia del cliente
            let clientRes = await transaction.request()
                .input('cedula', sql.NVarChar(20), String(cedula_cliente).trim())
                .query('SELECT id_cliente FROM Clientes WHERE cedula = @cedula');

            let id_cliente;
            if (clientRes.recordset.length > 0) {
                id_cliente = clientRes.recordset[0].id_cliente;
            } else {
                // Si el cliente no existe, lo creamos
                // Separar nombres y apellidos (dividir por espacios)
                const nameParts = (nombres_cliente || 'Importado').trim().split(/\s+/);
                const nombres = nameParts[0] || 'Importado';
                const apellidos = nameParts.slice(1).join(' ') || 'Importado';

                const newClientRes = await transaction.request()
                    .input('cedula', sql.NVarChar(20), String(cedula_cliente).trim())
                    .input('nombres', sql.NVarChar(100), nombres)
                    .input('apellidos', sql.NVarChar(100), apellidos)
                    .query(`
                        INSERT INTO Clientes (cedula, nombres, apellidos, id_sector_fk, estado_cliente)
                        OUTPUT INSERTED.id_cliente
                        VALUES (@cedula, @nombres, @apellidos, 1, 'ACTIVO')
                    `);
                id_cliente = newClientRes.recordset[0].id_cliente;
                creadosClientes++;
            }

            // 2. Insertar el Contrato Financiero (Ventas_Credito)
            const totalVal = parseFloat(monto_total) || 0;
            const saldoVal = parseFloat(saldo_pendiente) !== undefined ? parseFloat(saldo_pendiente) : totalVal;
            const cuotaVal = parseFloat(valor_cuota) || 0;
            const entradaVal = Math.max(0, totalVal - saldoVal);
            const freq = (frecuencia_pago || 'Mensual').trim();
            const dateEmision = fecha_emision ? new Date(fecha_emision) : new Date();

            // Calcular cantidad de cuotas
            let cantCuotas = 12;
            if (cuotaVal > 0) {
                cantCuotas = Math.ceil(saldoVal / cuotaVal);
            }

            const saleRes = await transaction.request()
                .input('id_cliente_fk', sql.Int, id_cliente)
                .input('fecha_venta', sql.DateTime, dateEmision)
                .input('monto_total_productos', sql.Decimal(10, 2), totalVal)
                .input('valor_entrada', sql.Decimal(10, 2), entradaVal)
                .input('monto_a_financiar', sql.Decimal(10, 2), saldoVal)
                .input('total_con_intereses', sql.Decimal(10, 2), saldoVal) // Para históricos asumimos intereses incluidos o entrada resta
                .input('cantidad_cuotas', sql.Int, cantCuotas)
                .input('frecuencia_pago', sql.NVarChar(50), freq)
                .query(`
                    INSERT INTO Ventas_Credito (id_cliente_fk, fecha_venta, monto_total_productos, valor_entrada, monto_a_financiar, total_con_intereses, cantidad_cuotas, frecuencia_pago)
                    OUTPUT INSERTED.id_venta
                    VALUES (@id_cliente_fk, @fecha_venta, @monto_total_productos, @valor_entrada, @monto_a_financiar, @total_con_intereses, @cantidad_cuotas, @frecuencia_pago)
                `);

            const id_venta = saleRes.recordset[0].id_venta;

            // 3. Generar la Cartilla de Amortización (Cuotas_Amortizacion)
            if (cantCuotas > 0 && saldoVal > 0) {
                const valorCuotaIndividual = cuotaVal > 0 ? cuotaVal : (saldoVal / cantCuotas);
                
                for (let i = 1; i <= cantCuotas; i++) {
                    let fechaVencimiento = new Date(dateEmision);
                    if (freq === 'Semanal') {
                        fechaVencimiento.setDate(fechaVencimiento.getDate() + (i * 7));
                    } else if (freq === 'Quincenal') {
                        fechaVencimiento.setDate(fechaVencimiento.getDate() + (i * 15));
                    } else { // Mensual
                        fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i);
                    }

                    const cuotaSaldo = Math.min(valorCuotaIndividual, Math.max(0, saldoVal - (valorCuotaIndividual * (i - 1))));
                    const cuotaEstado = (estado || 'PENDIENTE').toUpperCase();

                    await transaction.request()
                        .input('id_venta_fk', sql.Int, id_venta)
                        .input('numero_cuota', sql.Int, i)
                        .input('fecha_vencimiento', sql.Date, fechaVencimiento)
                        .input('monto_cuota', sql.Decimal(10, 2), valorCuotaIndividual)
                        .input('saldo_pendiente', sql.Decimal(10, 2), cuotaSaldo)
                        .input('estado_cuota', sql.NVarChar(50), cuotaEstado)
                        .query(`
                            INSERT INTO Cuotas_Amortizacion (id_venta_fk, numero_cuota, fecha_vencimiento, monto_cuota, saldo_pendiente, estado_cuota)
                            VALUES (@id_venta_fk, @numero_cuota, @fecha_vencimiento, @monto_cuota, @saldo_pendiente, @estado_cuota)
                        `);
                }
            }

            procesadosContratos++;
        }

        await transaction.commit();
        res.status(201).json({ 
            message: 'Importación masiva completada con éxito.',
            contratosProcesados: procesadosContratos,
            clientesCreados: creadosClientes
        });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ message: 'Error al procesar la importación masiva', error: error.message });
    }
};

export const getAbonosByCartilla = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id_cartilla', sql.Int, id)
            .query('SELECT * FROM Abonos WHERE id_cartilla = @id_cartilla ORDER BY fecha_registro DESC');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el historial de abonos', error: error.message });
    }
};
