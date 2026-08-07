import { getConnection } from './src/config/db.js';
import sql from 'mssql';
import { createVenta } from './src/controllers/ventas.controller.js';

const nombresNombres = ['Carlos', 'Maria', 'Juan', 'Jose', 'Luis', 'Ana', 'Carmen', 'Jorge', 'Pedro', 'Rosa'];
const apellidosNombres = ['Garcia', 'Martinez', 'Lopez', 'Gonzalez', 'Rodriguez', 'Fernandez', 'Perez', 'Gomez', 'Sanchez', 'Diaz'];

function randomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomCÃ©dula() {
    return '09' + Math.floor(10000000 + Math.random() * 90000000).toString();
}

async function seed() {
    try {
        const pool = await getConnection();
        
        // 1. Conseguir un sector para los clientes
        const sectorResult = await pool.request().query('SELECT TOP 1 id_sector FROM Sectores');
        const id_sector = sectorResult.recordset[0]?.id_sector || 1;

        // 2. Insertar algunos productos de prueba
        console.log('Insertando productos de prueba...');
        const productosIds = [];
        for (let i = 1; i <= 5; i++) {
            const prodRes = await pool.request()
                .input('id_categoria_fk', sql.Int, 1)
                .input('id_marca_fk', sql.Int, 1)
                .input('codigo_sku', sql.NVarChar, `PROD-TEST-${i}`)
                .input('modelo', sql.NVarChar, `Mod-T${i}`)
                .input('precio_venta_contado', sql.Decimal(10,2), 500 + i * 100)
                .input('costo_adquisicion', sql.Decimal(10,2), 300 + i * 50)
                .input('stock_actual', sql.Int, 1000)
                .query(`
                    INSERT INTO Productos (id_categoria_fk, id_marca_fk, codigo_sku, modelo, precio_venta_contado, costo_adquisicion, stock_actual)
                    OUTPUT INSERTED.id_producto, INSERTED.precio_venta_contado
                    VALUES (@id_categoria_fk, @id_marca_fk, @codigo_sku, @modelo, @precio_venta_contado, @costo_adquisicion, @stock_actual)
                `);
            productosIds.push(prodRes.recordset[0]);
        }

        console.log('Insertando 250 clientes y ventas de prueba...');
        
        for (let i = 1; i <= 250; i++) {
            // Insertar cliente
            const clienteRes = await pool.request()
                .input('id_sector_fk', sql.Int, id_sector)
                .input('nombres', sql.NVarChar, randomElement(nombresNombres) + ' ' + randomElement(nombresNombres))
                .input('apellidos', sql.NVarChar, randomElement(apellidosNombres) + ' ' + randomElement(apellidosNombres))
                .input('cedula', sql.NVarChar, getRandomCÃ©dula())
                .input('telefono_principal', sql.NVarChar, '0999999999')
                .input('direccion_detallada', sql.NVarChar, 'Direccion de prueba ' + i)
                .query(`
                    INSERT INTO Clientes (id_sector_fk, nombres, apellidos, cedula, telefono_principal, direccion_detallada)
                    OUTPUT INSERTED.id_cliente
                    VALUES (@id_sector_fk, @nombres, @apellidos, @cedula, @telefono_principal, @direccion_detallada)
                `);
            const id_cliente_fk = clienteRes.recordset[0].id_cliente;

            // Preparar venta aleatoria
            const prod = randomElement(productosIds);
            const articulos = [{
                id_producto: prod.id_producto,
                precio_venta_negociado: prod.precio_venta_contado
            }];
            
            const monto_total_productos = prod.precio_venta_contado;
            const valor_entrada = monto_total_productos * 0.2; // 20% de entrada
            const cantidad_cuotas = randomElement([6, 12, 18, 24]);
            const frecuencia_pago = randomElement(['Mensual', 'Quincenal', 'Semanal']);
            const tasa_interes = 15;

            // Mock de Req y Res
            const req = {
                body: {
                    id_cliente_fk,
                    monto_total_productos,
                    valor_entrada,
                    cantidad_cuotas,
                    frecuencia_pago,
                    articulos,
                    tasa_interes
                }
            };

            const res = {
                status: function(code) {
                    this.statusCode = code;
                    return this;
                },
                json: function(data) {
                    // console.log(`Venta creada para cliente ${id_cliente_fk}:`, data);
                }
            };

            await createVenta(req, res);
            
            if (i % 50 === 0) {
                console.log(`Progreso: ${i} / 250 ventas creadas...`);
            }
        }

        console.log('âœ… Proceso de seed 250 registros finalizado.');
        process.exit(0);
    } catch (err) {
        console.error('Error en el proceso:', err);
        process.exit(1);
    }
}

seed();
