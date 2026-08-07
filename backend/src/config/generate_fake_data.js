import pool from './db.js';

const MOCK_CATEGORIAS = ['Refrigeradoras', 'Lavadoras', 'Televisores', 'Cocinas', 'Aires Acondicionados', 'Pequeños Electrodomésticos'];
const MOCK_MARCAS = ['Samsung', 'LG', 'Indurama', 'Mabe', 'Sony', 'Whirlpool', 'Panasonic'];

const CANTONES = ['Guayaquil', 'Quito', 'Cuenca', 'Santo Domingo', 'Machala'];
const SECTORES = [
    { nombre: 'Norte', tipo_zona: 'Urbano' },
    { nombre: 'Sur', tipo_zona: 'Urbano' },
    { nombre: 'Centro', tipo_zona: 'Urbano' },
    { nombre: 'Alborada', tipo_zona: 'Urbano' },
    { nombre: 'Vía a la Costa', tipo_zona: 'Suburbano' },
    { nombre: 'Valle de los Chillos', tipo_zona: 'Urbano' },
    { nombre: 'Durán', tipo_zona: 'Periferia' }
];

const NOMBRES = ['Juan', 'Maria', 'Carlos', 'Ana', 'Luis', 'Rosa', 'Jorge', 'Carmen', 'Pedro', 'Laura', 'Diego', 'Sofia', 'Andres', 'Lucia', 'Miguel'];
const APELLIDOS = ['Garcia', 'Martinez', 'Lopez', 'Gonzalez', 'Perez', 'Rodriguez', 'Sanchez', 'Ramirez', 'Cruz', 'Gomez', 'Flores', 'Morales', 'Vargas'];

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem(array) {
    return array[getRandomInt(0, array.length - 1)];
}

function generateRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export async function generateFakeData() {
    try {
        const clientCount = await pool.query('SELECT COUNT(*) FROM Clientes');
        if (parseInt(clientCount.rows[0].count) > 0) {
            console.log('La base de datos ya tiene clientes. Omitiendo generación de datos de prueba.');
            return;
        }

        console.log('--- GENERANDO DATOS DE PRUEBA REALISTAS ---');

        // 1. Insertar Cantones
        for (const canton of CANTONES) {
            await pool.query('INSERT INTO Cantones (nombre) VALUES ($1) ON CONFLICT DO NOTHING', [canton]);
        }
        
        // 2. Insertar Sectores
        const cantonesRes = await pool.query('SELECT id_canton FROM Cantones');
        const cantonesIds = cantonesRes.rows.map(r => r.id_canton);
        for (const sector of SECTORES) {
            await pool.query('INSERT INTO Sectores (id_canton_fk, nombre, tipo_zona) VALUES ($1, $2, $3)', 
                [getRandomItem(cantonesIds), sector.nombre, sector.tipo_zona]);
        }

        // 3. Insertar Categorias y Marcas
        for (const cat of MOCK_CATEGORIAS) {
            await pool.query('INSERT INTO Categorias (nombre) VALUES ($1) ON CONFLICT DO NOTHING', [cat]);
        }
        for (const mar of MOCK_MARCAS) {
            await pool.query('INSERT INTO Marcas (nombre) VALUES ($1) ON CONFLICT DO NOTHING', [mar]);
        }

        const catRes = await pool.query('SELECT id_categoria FROM Categorias');
        const marRes = await pool.query('SELECT id_marca FROM Marcas');
        const categoriasIds = catRes.rows.map(r => r.id_categoria);
        const marcasIds = marRes.rows.map(r => r.id_marca);
        const sectoresRes = await pool.query('SELECT id_sector FROM Sectores');
        const sectoresIds = sectoresRes.rows.map(r => r.id_sector);

        // 4. Insertar Productos
        console.log('Generando productos...');
        for (let i = 1; i <= 15; i++) {
            const costo = getRandomInt(200, 800);
            const precio = costo * 1.4;
            await pool.query(
                `INSERT INTO Productos (codigo_sku, id_categoria_fk, id_marca_fk, modelo, precio_venta_contado, costo_adquisicion, stock_actual) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [`SKU-00${i}`, getRandomItem(categoriasIds), getRandomItem(marcasIds), `Modelo ${i}X`, precio, costo, 10]
            );
        }

        const prodRes = await pool.query('SELECT id_producto, precio_venta_contado FROM Productos');
        const productos = prodRes.rows;

        // 5. Insertar Series de Inventario (para los productos vendidos)
        console.log('Generando series...');
        for (const prod of productos) {
            for (let j = 1; j <= 5; j++) {
                await pool.query(
                    `INSERT INTO Inventario_Series (id_producto_fk, numero_serie_o_chasis, estado_articulo) 
                     VALUES ($1, $2, 'DISPONIBLE')`,
                    [prod.id_producto, `SN-${prod.id_producto}-${j}-${getRandomInt(1000, 9999)}`]
                );
            }
        }

        // 6. Insertar Clientes
        console.log('Generando 50 clientes...');
        const clientesIds = [];
        for (let i = 1; i <= 50; i++) {
            const cedula = `09${getRandomInt(10000000, 99999999)}`;
            const res = await pool.query(
                `INSERT INTO Clientes (cedula, nombres, apellidos, id_sector_fk, direccion_detallada, telefono_principal) 
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_cliente`,
                [
                    cedula, 
                    getRandomItem(NOMBRES), 
                    getRandomItem(APELLIDOS) + ' ' + getRandomItem(APELLIDOS), 
                    getRandomItem(sectoresIds), 
                    `Mz ${getRandomInt(1, 100)} Villa ${getRandomInt(1, 50)}`, 
                    `099${getRandomInt(1000000, 9999999)}`
                ]
            );
            clientesIds.push(res.rows[0].id_cliente);
        }

        // 7. Generar Ventas (Créditos)
        console.log('Generando 50 ventas (algunas atrasadas para simular mora)...');
        for (const id_cliente of clientesIds) {
            const producto = getRandomItem(productos);
            const cantidadCuotas = getRandomItem([6, 12, 18]);
            
            const montoProducto = parseFloat(producto.precio_venta_contado);
            const entrada = montoProducto * 0.2; // 20% entrada
            const aFinanciar = montoProducto - entrada;
            const intereses = aFinanciar * 0.3; // 30% interes
            const total = aFinanciar + intereses;
            
            // Simular fecha de venta en el pasado (entre hace 1 y 6 meses)
            const hoy = new Date();
            const mesesAtras = getRandomInt(1, 6);
            const fechaVenta = new Date();
            fechaVenta.setMonth(hoy.getMonth() - mesesAtras);

            const ventaRes = await pool.query(
                `INSERT INTO Ventas_Credito (id_cliente_fk, fecha_venta, monto_total_productos, valor_entrada, monto_a_financiar, total_con_intereses, cantidad_cuotas, frecuencia_pago) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, 'Mensual') RETURNING id_venta`,
                [id_cliente, fechaVenta.toISOString(), montoProducto, entrada, aFinanciar, total, cantidadCuotas]
            );
            const id_venta = ventaRes.rows[0].id_venta;

            // Tomar una serie disponible y marcarla VENDIDA
            const serieRes = await pool.query(`SELECT id_serie FROM Inventario_Series WHERE id_producto_fk = $1 AND estado_articulo = 'DISPONIBLE' LIMIT 1`, [producto.id_producto]);
            if (serieRes.rows.length > 0) {
                const id_serie = serieRes.rows[0].id_serie;
                await pool.query(`UPDATE Inventario_Series SET estado_articulo = 'VENDIDO' WHERE id_serie = $1`, [id_serie]);
                await pool.query(`INSERT INTO Detalle_Ventas (id_venta_fk, id_serie_fk, precio_venta_negociado) VALUES ($1, $2, $3)`, [id_venta, id_serie, montoProducto]);
            }

            // Generar Cuotas
            const montoCuota = total / cantidadCuotas;
            for (let i = 1; i <= cantidadCuotas; i++) {
                const fechaVencimiento = new Date(fechaVenta);
                fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i);

                let estado = 'PENDIENTE';
                let saldoPendiente = montoCuota;

                if (fechaVencimiento < hoy) {
                    // Si ya pasó la fecha, simulamos probabilidad de que pagó o está en MORA
                    const pagoProbabilidad = Math.random();
                    if (pagoProbabilidad > 0.3) {
                        // Pagó
                        estado = 'PAGADA';
                        saldoPendiente = 0;
                        // Registrar abono
                        const fechaAbono = new Date(fechaVencimiento);
                        fechaAbono.setDate(fechaAbono.getDate() - getRandomInt(0, 3)); // Pagó a tiempo o unos días antes
                        await pool.query(
                            `INSERT INTO Abonos (id_cartilla, monto_cobrado, fecha_registro, metodo_pago) VALUES ($1, $2, $3, 'Transferencia')`,
                            [id_venta, montoCuota, fechaAbono.toISOString()]
                        );
                    } else {
                        // Mora
                        estado = 'MORA';
                    }
                }

                await pool.query(
                    `INSERT INTO Cuotas_Amortizacion (id_venta_fk, numero_cuota, fecha_vencimiento, monto_cuota, saldo_pendiente, estado_cuota) 
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [id_venta, i, fechaVencimiento.toISOString().split('T')[0], montoCuota, saldoPendiente, estado]
                );
            }
        }

        console.log('--- DATOS DE PRUEBA GENERADOS CORRECTAMENTE ---');
    } catch (error) {
        console.error('Error generando datos de prueba:', error);
    }
}
