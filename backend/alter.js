import { getConnection } from './src/config/db.js';

async function run() {
    try {
        const pool = await getConnection();
        await pool.request().query('ALTER TABLE Abonos ADD comprobante_url NVARCHAR(255) NULL;');
        console.log('Columna comprobante_url añadida exitosamente.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}
run();
