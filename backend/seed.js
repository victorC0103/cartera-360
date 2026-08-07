import { getConnection } from './src/config/db.js';

async function seed() {
  try {
    const pool = await getConnection();

    // ── Insertar Cantones (solo si no existen) ──
    const cantones = [
      [1, 'Milagro'],
      [2, 'Naranjito'],
      [3, 'Marcelino Maridueña'],
      [4, 'Yaguachi'],
      [5, 'Simón Bolívar'],
      [6, 'Naranjal'],
      [7, 'El Triunfo'],
      [8, 'Bucay'],
    ];

    for (const [id, nombre] of cantones) {
      await pool.request()
        .input('id', id)
        .input('nombre', nombre)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM Cantones WHERE id_canton = @id)
          BEGIN
            SET IDENTITY_INSERT Cantones ON;
            INSERT INTO Cantones (id_canton, nombre) VALUES (@id, @nombre);
            SET IDENTITY_INSERT Cantones OFF;
          END
          ELSE
          BEGIN
            UPDATE Cantones SET nombre = @nombre WHERE id_canton = @id;
          END
        `);
    }

    // ── Insertar Sectores (solo si no existen) ──
    const sectores = [
      // Milagro
      [1,  1, 'Centro de Milagro', 'URBANA'],
      [2,  1, 'Cdla. Las Piñas', 'URBANA'],
      [3,  1, 'Cdla. Los Helechos', 'URBANA'],
      [4,  1, 'Cdla. Bellavista', 'URBANA'],
      [5,  1, 'Km 26 (vía Milagro-Naranjito)', 'RURAL'],
      [6,  1, 'Roberto Astudillo', 'RURAL'],
      [7,  1, 'Chobo', 'RURAL'],
      [8,  1, 'Mariscal Sucre', 'RURAL'],
      // Naranjito
      [9,  2, 'Centro de Naranjito', 'URBANA'],
      [10, 2, 'Barraganetal', 'RURAL'],
      [11, 2, 'San Francisco de Chaguarpamba', 'RURAL'],
      // Marcelino Maridueña
      [12, 3, 'Centro de Marcelino Maridueña', 'URBANA'],
      [13, 3, 'San Carlos (Ingenio)', 'RURAL'],
      // Yaguachi
      [14, 4, 'Yaguachi Nuevo', 'URBANA'],
      [15, 4, 'Yaguachi Viejo (Cone)', 'RURAL'],
      [16, 4, 'Virgen de Fátima', 'RURAL'],
      [17, 4, 'Pedro J. Montero (Boliche)', 'RURAL'],
      // Simón Bolívar
      [18, 5, 'Centro de Simón Bolívar', 'URBANA'],
      [19, 5, 'Lorenzo de Garaicoa', 'RURAL'],
      // Naranjal
      [20, 6, 'Centro de Naranjal', 'URBANA'],
      [21, 6, 'Taura', 'RURAL'],
      [22, 6, 'Jesús María', 'RURAL'],
      // El Triunfo
      [23, 7, 'Centro de El Triunfo', 'URBANA'],
      [24, 7, 'Manuel de J. Calle', 'RURAL'],
      // Bucay
      [25, 8, 'Centro de Bucay', 'URBANA'],
      [26, 8, 'Recinto Esperanza de Dios', 'RURAL'],
    ];

    for (const [id, canton, nombre, zona] of sectores) {
      await pool.request()
        .input('id', id)
        .input('canton', canton)
        .input('nombre', nombre)
        .input('zona', zona)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM Sectores WHERE id_sector = @id)
          BEGIN
            SET IDENTITY_INSERT Sectores ON;
            INSERT INTO Sectores (id_sector, id_canton_fk, nombre, tipo_zona) VALUES (@id, @canton, @nombre, @zona);
            SET IDENTITY_INSERT Sectores OFF;
          END
          ELSE
          BEGIN
            UPDATE Sectores SET nombre = @nombre, tipo_zona = @zona, id_canton_fk = @canton WHERE id_sector = @id;
          END
        `);
    }

    // ── Insertar Categorías ──
    const categoriasList = [
      [1, 'Refrigeradoras'],
      [2, 'Lavadoras'],
      [3, 'Televisores'],
      [4, 'Cocinas'],
      [5, 'Aires Acondicionados'],
      [6, 'Pequeños Electrodomésticos']
    ];

    for (const [id, nombre] of categoriasList) {
      await pool.request()
        .input('id', id)
        .input('nombre', nombre)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM Categorias WHERE id_categoria = @id)
          BEGIN
            SET IDENTITY_INSERT Categorias ON;
            INSERT INTO Categorias (id_categoria, nombre) VALUES (@id, @nombre);
            SET IDENTITY_INSERT Categorias OFF;
          END
          ELSE
          BEGIN
            UPDATE Categorias SET nombre = @nombre WHERE id_categoria = @id;
          END
        `);
    }

    // ── Insertar Marcas ──
    const marcasList = [
      [1, 'Samsung'],
      [2, 'LG'],
      [3, 'Indurama'],
      [4, 'Mabe'],
      [5, 'Sony'],
      [6, 'Whirlpool'],
      [7, 'Panasonic']
    ];

    for (const [id, nombre] of marcasList) {
      await pool.request()
        .input('id', id)
        .input('nombre', nombre)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM Marcas WHERE id_marca = @id)
          BEGIN
            SET IDENTITY_INSERT Marcas ON;
            INSERT INTO Marcas (id_marca, nombre) VALUES (@id, @nombre);
            SET IDENTITY_INSERT Marcas OFF;
          END
          ELSE
          BEGIN
            UPDATE Marcas SET nombre = @nombre WHERE id_marca = @id;
          END
        `);
    }

    console.log('✅ Seed completado: cantones, sectores, categorías y marcas sincronizadas.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

seed();
