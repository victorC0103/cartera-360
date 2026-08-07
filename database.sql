-- 1. Catálogos
CREATE TABLE Cantones (
    id_canton SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE Sectores (
    id_sector SERIAL PRIMARY KEY,
    id_canton_fk INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    tipo_zona VARCHAR(50),
    FOREIGN KEY (id_canton_fk) REFERENCES Cantones(id_canton)
);

CREATE TABLE Categorias (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE Marcas (
    id_marca SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

-- 2. Entidades Principales
CREATE TABLE Clientes (
    id_cliente SERIAL PRIMARY KEY,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    id_sector_fk INT NOT NULL,
    direccion_detallada VARCHAR(255),
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    telefono_principal VARCHAR(20),
    estado_cliente VARCHAR(50) DEFAULT 'ACTIVO',
    FOREIGN KEY (id_sector_fk) REFERENCES Sectores(id_sector)
);

CREATE TABLE Productos (
    id_producto SERIAL PRIMARY KEY,
    codigo_sku VARCHAR(50) UNIQUE NOT NULL,
    id_categoria_fk INT NOT NULL,
    id_marca_fk INT NOT NULL,
    modelo VARCHAR(100),
    precio_venta_contado DECIMAL(10, 2) NOT NULL,
    costo_adquisicion DECIMAL(10, 2) NOT NULL,
    stock_actual INT DEFAULT 0,
    FOREIGN KEY (id_categoria_fk) REFERENCES Categorias(id_categoria),
    FOREIGN KEY (id_marca_fk) REFERENCES Marcas(id_marca)
);

CREATE TABLE Inventario_Series (
    id_serie SERIAL PRIMARY KEY,
    id_producto_fk INT NOT NULL,
    numero_serie_o_chasis VARCHAR(100) UNIQUE NOT NULL,
    estado_articulo VARCHAR(50) DEFAULT 'DISPONIBLE',
    FOREIGN KEY (id_producto_fk) REFERENCES Productos(id_producto)
);

-- 3. Entidades Financieras (Core)
CREATE TABLE Ventas_Credito (
    id_venta SERIAL PRIMARY KEY,
    id_cliente_fk INT NOT NULL,
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    monto_total_productos DECIMAL(10, 2) NOT NULL,
    valor_entrada DECIMAL(10, 2) NOT NULL,
    monto_a_financiar DECIMAL(10, 2) NOT NULL,
    total_con_intereses DECIMAL(10, 2) NOT NULL,
    cantidad_cuotas INT NOT NULL,
    frecuencia_pago VARCHAR(50) NOT NULL,
    FOREIGN KEY (id_cliente_fk) REFERENCES Clientes(id_cliente)
);

CREATE TABLE Detalle_Ventas (
    id_detalle SERIAL PRIMARY KEY,
    id_venta_fk INT NOT NULL,
    id_serie_fk INT NOT NULL,
    precio_venta_negociado DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (id_venta_fk) REFERENCES Ventas_Credito(id_venta),
    FOREIGN KEY (id_serie_fk) REFERENCES Inventario_Series(id_serie)
);

CREATE TABLE Cuotas_Amortizacion (
    id_cuota SERIAL PRIMARY KEY,
    id_venta_fk INT NOT NULL,
    numero_cuota INT NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    monto_cuota DECIMAL(10, 2) NOT NULL,
    saldo_pendiente DECIMAL(10, 2) NOT NULL,
    estado_cuota VARCHAR(50) DEFAULT 'PENDIENTE',
    FOREIGN KEY (id_venta_fk) REFERENCES Ventas_Credito(id_venta)
);

-- 4. Autenticación y Usuarios
CREATE TABLE Usuarios (
    id_usuario SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(30) NOT NULL CHECK (rol IN ('Superusuario', 'Secretaria')),
    estado BOOLEAN DEFAULT TRUE
);


-- 5. Historial de Pagos
CREATE TABLE Abonos (
    id_abono SERIAL PRIMARY KEY,
    id_cartilla INT NOT NULL,
    monto_cobrado DECIMAL(10, 2) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metodo_pago VARCHAR(50) DEFAULT 'Efectivo',
    comprobante_url VARCHAR(255),
    FOREIGN KEY (id_cartilla) REFERENCES Ventas_Credito(id_venta)
);

