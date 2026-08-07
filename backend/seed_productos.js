import pool from './src/config/db.js';

const MOCK_CATEGORIAS = [
  'Refrigeradoras',
  'Lavadoras',
  'Televisores',
  'Cocinas',
  'Aires Acondicionados',
  'Pequeños Electrodomésticos'
];

const MOCK_MARCAS = [
  'Samsung', 'LG', 'Indurama', 'Mabe', 'Sony', 'Whirlpool', 'Panasonic'
];

async function seedCatalogosProductos() {
    try {
        const checkCat = await pool.query('SELECT COUNT(*) FROM Categorias');
        if (parseInt(checkCat.rows[0].count) === 0) {
            console.log('Insertando Categorías...');
            for (const cat of MOCK_CATEGORIAS) {
                await pool.query('INSERT INTO Categorias (nombre) VALUES ($1)', [cat]);
            }
        } else {
            console.log('Las categorías ya existen.');
        }

        const checkMar = await pool.query('SELECT COUNT(*) FROM Marcas');
        if (parseInt(checkMar.rows[0].count) === 0) {
            console.log('Insertando Marcas...');
            for (const mar of MOCK_MARCAS) {
                await pool.query('INSERT INTO Marcas (nombre) VALUES ($1)', [mar]);
            }
        } else {
            console.log('Las marcas ya existen.');
        }

        console.log('Catálogos de productos insertados correctamente en Render.');
        process.exit(0);
    } catch (err) {
        console.error('Error al insertar catálogos:', err.message);
        process.exit(1);
    }
}

seedCatalogosProductos();
