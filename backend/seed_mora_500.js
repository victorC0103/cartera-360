import { getConnection } from './src/config/db.js';
import sql from 'mssql';
import { createVenta } from './src/controllers/ventas.controller.js';

const nombresNombres = ['Carlos', 'Maria', 'Juan', 'Jose', 'Luis', 'Ana', 'Carmen', 'Jorge', 'Pedro', 'Rosa', 'Miguel', 'Sofia', 'Lucia', 'Diego', 'Fernando', 'Valeria', 'Roberto', 'Camila', 'Alejandro', 'Diana'];
const apellidosNombres = ['Garcia', 'Martinez', 'Lopez', 'Gonzalez', 'Rodriguez', 'Fernandez', 'Perez', 'Gomez', 'Sanchez', 'Diaz', 'Torres', 'Ramirez', 'Cruz', 'Morales', 'Ortiz', 'Gutierrez', 'Chavez', 'Castro', 'Ruiz', 'Alvarez'];

function randomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomCedula() {
    return '09' + Math.floor(10000000 + Math.random() * 90000000).toString();
}

async function seedMora() {
    try {
        const pool = await getConnection();
        
        console.log('Borrando datos operativos...');
        await pool.request().query(`
            DELETE FROM Abonos;
            DELETE FROM Cuotas_Amortizacion;
            DELETE FROM Detalle_Ventas;
            DELETE FROM Ventas_Credito;
            DELETE FROM Inventario_Series;
            DELETE FROM Productos;
            DELETE FROM Clientes;
            
            DBCC CHECKIDENT ('Abonos', RESEED, 0);
            DBCC CHECKIDENT ('Cuotas_Amortizacion', RESEED, 0);
            DBCC CHECKIDENT ('Detalle_Ventas', RESEED, 0);
            DBCC CHECKIDENT ('Ventas_Credito', RESEED, 0);
            DBCC CHECKIDENT ('Inventario_Series', RESEED, 0);
            DBCC CHECKIDENT ('Productos', RESEED, 0);
            DBCC CHECKIDENT ('Clientes', RESEED, 0);
        `);
        console.log('Datos limpios.');

        console.log('Insertando productos de prueba...');
        const productosIds = [];
        for (let i = 1; i <= 20; i++) {
            const prodRes = await pool.request()
                .input('id_categoria_fk', sql.Int, (i % 6) + 1)
                .input('id_marca_fk', sql.Int, (i % 7) + 1)
                .input('codigo_sku', sql.NVarChar, `PROD-TEST-${i}`)
                .input('modelo', sql.NVarChar, `Modelo-${i}`)
                .input('precio_venta_contado', sql.Decimal(10,2), Math.floor(Math.random() * 800) + 200)
                .input('costo_adquisicion', sql.Decimal(10,2), Math.floor(Math.random() * 100) + 100)
                .input('stock_actual', sql.Int, 1000)
                .query(`
                    INSERT INTO Productos (id_categoria_fk, id_marca_fk, codigo_sku, modelo, precio_venta_contado, costo_adquisicion, stock_actual)
                    OUTPUT INSERTED.id_producto, INSERTED.precio_venta_contado
                    VALUES (@id_categoria_fk, @id_marca_fk, @codigo_sku, @modelo, @precio_venta_contado, @costo_adquisicion, @stock_actual)
                `);
            productosIds.push(prodRes.recordset[0]);
        }

        console.log('Insertando 500 clientes y ventas...');
        const sectoresRes = await pool.request().query('SELECT id_sector FROM Sectores');
        const sectores = sectoresRes.recordset.map(s => s.id_sector);
        
        for (let i = 1; i <= 500; i++) {
            const id_sector = randomElement(sectores) || 1;
            const clienteRes = await pool.request()
                .input('id_sector_fk', sql.Int, id_sector)
                .input('nombres', sql.NVarChar, randomElement(nombresNombres) + ' ' + randomElement(nombresNombres))
                .input('apellidos', sql.NVarChar, randomElement(apellidosNombres) + ' ' + randomElement(apellidosNombres))
                .input('cedula', sql.NVarChar, getRandomCedula())
                .input('telefono_principal', sql.NVarChar, '0999999999')
                .input('direccion_detallada', sql.NVarChar, 'Direccion de prueba ' + i)
                .query(`
                    INSERT INTO Clientes (id_sector_fk, nombres, apellidos, cedula, telefono_principal, direccion_detallada)
                    OUTPUT INSERTED.id_cliente
                    VALUES (@id_sector_fk, @nombres, @apellidos, @cedula, @telefono_principal, @direccion_detallada)
                `);
            const id_cliente_fk = clienteRes.recordset[0].id_cliente;

            const prod = randomElement(productosIds);
            const articulos = [{ id_producto: prod.id_producto, precio_venta_negociado: prod.precio_venta_contado }];
            const monto_total_productos = prod.precio_venta_contado;
            const valor_entrada = monto_total_productos * 0.2; 
            const cantidad_cuotas = randomElement([6, 12, 18, 24]);
            const frecuencia_pago = randomElement(['Mensual', 'Quincenal']);
            const tasa_interes = 15;

            let ventaCreadaId = null;
            const req = { body: { id_cliente_fk, monto_total_productos, valor_entrada, cantidad_cuotas, frecuencia_pago, articulos, tasa_interes }, user: { id: 1 } };
            const res = { status: function() { return this; }, json: function(data) { ventaCreadaId = data.id_venta; } };

            await createVenta(req, res);
            
            if (ventaCreadaId) {
                const diasMora = Math.floor(Math.random() * 150) + 30; // 30 to 180 days ago
                await pool.request()
                    .input('id_venta', sql.Int, ventaCreadaId)
                    .input('dias', sql.Int, diasMora)
                    .query(`
                        UPDATE Ventas_Credito
                        SET fecha_venta = DATEADD(day, -@dias, fecha_venta)
                        WHERE id_venta = @id_venta;
                        
                        UPDATE Cuotas_Amortizacion
                        SET fecha_vencimiento = DATEADD(day, -@dias, fecha_vencimiento)
                        WHERE id_venta_fk = @id_venta;
                    `);
            }
            
            if (i % 50 === 0) {
                console.log(`Progreso: ${i} / 500...`);
            }
        }

        console.log('Actualizando estado_cuota a MORA para cuotas vencidas...');
        await pool.request().query(`
            UPDATE Cuotas_Amortizacion
            SET estado_cuota = 'MORA'
            WHERE estado_cuota = 'PENDIENTE' AND fecha_vencimiento < GETDATE()
        `);
        
        console.log('âœ… Proceso de seed finalizado con Ã©xito.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

seedMora();
