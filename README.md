# Cartera360 - Fase 1 (Backend)

Este es el backend del sistema ERP Cartera360, enfocado en la gestión de créditos, cobranzas e inventario para un almacén minorista.

## Requisitos Previos

- Node.js (v16+)
- Microsoft SQL Server
- SQL Server Management Studio (SSMS) o cualquier otro cliente SQL (Opcional, pero recomendado)

## Configuración de la Base de Datos

1. Abre tu cliente SQL Server.
2. Ejecuta el script completo que se encuentra en el archivo `database.sql`. Esto creará la base de datos `Cartera360` y todas sus tablas con las relaciones necesarias.

## Instalación y Configuración del Proyecto

1. Instala las dependencias del proyecto:
   ```bash
   npm install
   ```

2. Configura las variables de entorno. Edita el archivo `.env` en la raíz del proyecto y actualiza las credenciales de tu servidor SQL Server:
   ```env
   PORT=3000
   DB_USER=sa
   DB_PASSWORD=tu_password_aqui
   DB_SERVER=localhost
   DB_DATABASE=Cartera360
   DB_PORT=1433
   ```

## Ejecución del Servidor

Para iniciar el servidor en modo desarrollo/producción, ejecuta:

```bash
node src/index.js
```

Si deseas usar algo como `nodemon` (recomendado para desarrollo):
```bash
npm install -g nodemon
nodemon src/index.js
```

El servidor estará disponible en `http://localhost:3000/`.

## Endpoints Disponibles (Fase 1)

### Clientes
- `GET /api/clientes` - Obtener todos los clientes (incluye nombres de sector y cantón)
- `GET /api/clientes/:id` - Obtener un cliente por su ID
- `POST /api/clientes` - Crear un nuevo cliente
- `PUT /api/clientes/:id` - Actualizar un cliente
- `DELETE /api/clientes/:id` - Eliminar un cliente

### Productos
- `GET /api/productos` - Obtener todos los productos (incluye nombres de categoría y marca)
- `GET /api/productos/:id` - Obtener un producto por su ID
- `POST /api/productos` - Crear un nuevo producto
- `PUT /api/productos/:id` - Actualizar un producto
- `DELETE /api/productos/:id` - Eliminar un producto
