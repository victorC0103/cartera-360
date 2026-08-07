import { getConnection } from './src/config/db.js';

async function run() {
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
        
        console.log('Datos borrados y autoincrementales reiniciados.');
        process.exit(0);
    } catch (err) {
        console.error('Error al borrar los datos:', err);
        process.exit(1);
    }
}

run();
