## [2026-08-06] - Correcci�n de JOINs SQL en Widget de Mora
**M�dulo Afectado:** Backend (Controladores)

### ?? Corregido (Fixed)
- **dashboard.controller.js:** Se corrigi� un error de sintaxis SQL en el endpoint \/mora-por-sector\. Las cl�usulas \INNER JOIN\ estaban referenciando columnas locales en lugar de las llaves for�neas reales (\id_cliente_fk\ e \id_venta_fk\). Este error causaba una excepci�n interna (HTTP 500) que el Frontend interpretaba como "cero datos", mostrando el estado vac�o incorrectamente.

### ?? Notas T�cnicas / Justificaci�n Acad�mica
- Garantizar la nomenclatura exacta del modelo entidad-relaci�n es cr�tico. Una discrepancia de sufijo causaba fallos silenciosos en la capa de red. Con la correcci�n de las llaves, el motor de base de datos puede hacer los cruces relacionales exitosamente.

---
## [2026-08-06] - Implementaci�n de Paginaci�n en Alertas de Cobranza
**M�dulo Afectado:** Frontend (UI/UX)

### ?? A�adido (Added)
- **Dashboard.jsx:** Se implement� paginaci�n del lado del cliente para la tabla de "Rutas Prioritarias de Cobranza". Ahora muestra bloques de 5 registros por vista, e incluye controles inferiores (Botones Anterior / Siguiente) y un contador din�mico ("Mostrando 1 a 5 de N alertas").

### ?? Modificado (Changed)
- **Tabla de Alertas:** Se a�adi� una nueva clase de alerta de color rojo intenso (\g-rose-100 text-rose-800\) exclusivamente para los morosos cr�ticos que superan los 60 d�as de atraso.

### ?? Notas T�cnicas / Justificaci�n Acad�mica
- Evitar el renderizado de listas interminables ("Infinite Scroll" o grandes vol�menes de <tr>) en un Dashboard previene el colapso del Virtual DOM de React. La paginaci�n "Client-Side" aplicada a conjuntos de datos medios (cientos de registros) ofrece una transici�n instant�nea entre p�ginas sin saturar a la base de datos con consultas SQL redundantes por cada clic, mejorando significativamente la usabilidad y rendimiento.

---
## [2026-08-06] - Integraci�n de Datos Reales en KPIs y Alertas del Dashboard
**M�dulo Afectado:** Full-Stack (Backend / Frontend)

### ?? A�adido (Added)
- **Backend:** Se crearon dos nuevos endpoints en \dashboard.controller.js\:
  - \/kpis\: Calcula din�micamente la "Cartera Activa" (saldo total pendiente), el "�ndice de Morosidad" (porcentaje de mora frente a cartera activa), la "Recaudaci�n de Hoy" y el total de "Clientes Activos" (con deuda vigente).
  - \/alertas\: Obtiene el listado de clientes cuya deuda se encuentre en estado \MORA\ y tenga un atraso mayor a 30 d�as, devolviendo nombres, c�dula, zona, d�as de mora y monto adeudado.

### ?? Modificado (Changed)
- **Dashboard.jsx:** Se eliminaron las variables est�ticas (\kpiData\ y \lertasData\ quemadas en c�digo). El componente principal ahora consume en tiempo real los endpoints a trav�s de React \useEffect\ y gestiona estados de carga (\Loader2\) antes de mapear la informaci�n a las tarjetas superiores (KpiCard) y a la tabla inferior de "Rutas Prioritarias de Cobranza".

### ?? Notas T�cnicas / Justificaci�n Acad�mica
- Desacoplar la vista de los datos duros ("hardcoded data") es fundamental en el patr�n MVC. Las m�tricas gerenciales ahora se calculan a nivel del motor de base de datos usando funciones agregadas (\SUM\, \COUNT\, \DATEDIFF\), garantizando que el Dashboard sea una radiograf�a financiera 100% veraz y actualizada del estado del ERP.

---
## [2026-08-06] - Redise�o Total UI/UX del Dashboard (Estilo Fintech)
**M�dulo Afectado:** Frontend (UI/UX)

### ?? Modificado (Changed)
- **Dashboard.jsx:** Se implement� una paleta de colores estricta (Slate/Indigo) eliminando tonos saturados. Se aplic� redondeo (\ounded-2xl\), bordes ultra finos (\order-slate-200/60\) y sombras suaves a todos los contenedores para un aspecto minimalista y profesional. La estructura principal ahora aloja tres widgets en una cuadr�cula proporcional.
- **IngresosChartWidget.jsx:** Se eliminaron las l�neas de las cuadr�culas (CartesianGrid), se aument� el grosor de las barras (\arSize={40}\), se aplicaron bordes redondeados y colores corporativos (Slate Profundo).
- **EstadoCarteraChartWidget.jsx:** Se modific� la l�gica de datos limitando la "Dona" a 4 segmentos principales. El resto de las zonas ahora se consolidan bajo un segmento sem�ntico color gris claro denominado "Otras Zonas", previniendo la saturaci�n crom�tica.
- **MoraPorSectorWidget.jsx:** Se incorpor� un \Empty State\ profesional. En caso de no existir mora, se despliega un �cono \CheckCircle2\ con un mensaje de validaci�n visualmente amigable, evitando vac�os estructurales.

### ?? Notas T�cnicas / Justificaci�n Acad�mica
- Aplicar principios de dise�o 60-30-10 y utilizar colores sem�nticos mejora dr�sticamente la carga cognitiva del usuario gerencial. En plataformas ERP/Fintech, un dise�o que priorice la estructura y tipograf�a frente a una excesiva coloraci�n incrementa la usabilidad percibida y la legibilidad de la data financiera cr�tica.

---
## [2026-08-06] - Refactorizaci�n de Widget de Mora a Gr�fico
**M�dulo Afectado:** Frontend (UI)

### ?? Modificado (Changed)
- **MoraPorSectorWidget.jsx:** Se reescribi� completamente el componente para abandonar el formato de "lista" en texto plano. En su lugar, ahora se utiliza la librer�a \Recharts\ para renderizar un gr�fico de barras horizontales de alto impacto visual.

### ?? Notas T�cnicas / Justificaci�n Acad�mica
- Para alinear el dise�o general del Dashboard a est�ndares gerenciales estrictos, se unific� la presentaci�n visual. El gr�fico horizontal permite leer claramente los nombres largos de los sectores (eje Y) comparando intuitivamente la magnitud del saldo adeudado (eje X) marcado en color rojo (alerta visual).

---
## [2026-08-06] - Implementaci�n de Gr�ficos Profesionales en Dashboard
**M�dulo Afectado:** Full-Stack (Frontend / Backend)

### ?? A�adido (Added)
- **Backend:** Se crearon dos nuevos endpoints en \dashboard.controller.js\: 
  - \/ingresos-semana\: Calcula los ingresos diarios de los �ltimos 7 d�as desde la tabla \Abonos\.
  - \/estado-cartera-zona\: Agrupa el saldo pendiente de las cuotas en estado \PENDIENTE\ o \MORA\ clasificado por \Sectores\ (Zonas).
- **Frontend (UI):** Se integr� la librer�a **Recharts** para el renderizado de gr�ficos SVG interactivos de alto rendimiento.
- **Frontend (Componentes):** 
  - Se cre� \IngresosChartWidget.jsx\ (Gr�fico de Barras) para comparar ingresos vs proyecci�n.
  - Se cre� \EstadoCarteraChartWidget.jsx\ (Gr�fico Circular/Dona) para visualizar la distribuci�n de la cartera activa por zonas.

### ?? Modificado (Changed)
- **Dashboard.jsx:** Se reemplazaron los contenedores de texto gen�ricos (placeholders) por los nuevos componentes gr�ficos interactivos de Recharts, elevando la calidad est�tica y profesionalismo del resumen gerencial.

### ?? Notas T�cnicas / Justificaci�n Acad�mica
- El uso de Recharts permite renderizar informaci�n cr�tica de forma fluida y totalmente responsiva. En las consultas SQL se implement� l�gica a nivel de base de datos (\DATEADD\, \SUM\, \GROUP BY\) para minimizar el procesamiento en Node.js, enviando al cliente (React) arreglos listos para su graficaci�n inmediata, siguiendo el patr�n de dise�o eficiente cliente-servidor.

---
## [2026-08-06] - Correcci�n L�gica de Mora en Seeder
**M�dulo Afectado:** Base de Datos / Backend

### ?? Corregido (Fixed)
- Se corrigi� el algoritmo del script \seed_mora_500.js\. Anteriormente se alteraba aleatoriamente las fechas de cada cuota por separado, lo cual romp�a la consistencia del calendario de amortizaci�n y no alteraba el estado real.
- **Ahora**, por cada cr�dito simulado, se desplaza tanto la fecha de \Ventas_Credito\ como las fechas de TODAS sus \Cuotas_Amortizacion\ por un desfase uniforme (entre 30 y 180 d�as en el pasado). Adem�s, se ejecuta un UPDATE final que cambia el \estado_cuota\ a \'MORA'\ para las cuotas cuya nueva fecha de vencimiento sea menor a la actual.

### ?? Notas T�cnicas / Justificaci�n Acad�mica
- Garantizar la integridad cronol�gica entre \echa_venta\ y \echa_vencimiento\ es vital para que las reglas de negocio del ERP eval�en correctamente la mora. El estado de la cuota (\MORA\, \PENDIENTE\, \PAGADA\) es el verdadero indicador que alimenta al Frontend.

---
## [2026-08-06] - Seeder de Datos Reales de Mora
**M�dulo Afectado:** Base de Datos / Backend

### ?? A�adido (Added)
- **Script de Poblaci�n (\seed_mora_500.js\):** Se implement� un nuevo script para limpiar la base de datos de pruebas e inyectar 500 registros simulados de ventas a cr�dito.
- El script desplaza aleatoriamente las fechas de vencimiento de las cuotas generadas hacia el pasado (entre 30 y 180 d�as) para simular escenarios de mora reales y alimentar correctamente el Widget del Dashboard.

### ?? Notas T�cnicas / Justificaci�n Acad�mica
- Para simular mora realista, se reutiliz� el controlador \createVenta\ a nivel interno y se ejecut� un \UPDATE\ masivo calculando un \DATEADD\ aleatorio en SQL Server para alterar el campo \echa_vencimiento\. Esto asegura la integridad referencial y genera un volumen de datos robusto para pruebas de carga en la aplicaci�n.

---
## [2026-08-06] - Indicador de Sectores con Mayor Mora (Dashboard)
**M�dulo Afectado:** Full-Stack (Backend / Frontend)

### ?? A�adido (Added)
- **Backend:** Nuevo endpoint y controlador para obtener el Top 5 de sectores con m�s deuda atrasada (JOIN entre Clientes, Ventas_Credito y Cuotas_Amortizacion).
- **Frontend:** Componente de React MoraPorSectorWidget que consume el endpoint y muestra el ranking en el Dashboard.

### ?? Notas T�cnicas / Justificaci�n Acad�mica
- Se deleg� el filtro de fechas (GETDATE()) y el c�lculo de la suma al motor SQL Server para optimizar el rendimiento. En el frontend se maneja el estado de carga y formato num�rico para mejor UX.

---
## [2026-08-04] - Integración Full-Stack de Autenticación (React Context & Axios Interceptors)
**Módulo Afectado:** Frontend (UI, Servicios y Estado Global)

### 🚀 Añadido (Added)
- **Contexto Global (`AuthContext.jsx`):** Se creó un proveedor de estado para manejar el ciclo de vida de la sesión (Login/Logout) y persistir el token JWT y los datos del usuario en el `localStorage`.
- **Vista de Inicio de Sesión (`Login.jsx`):** Se diseñó e implementó una interfaz gráfica moderna y responsiva alineada al UI del ERP, con manejo de errores asíncronos y feedback visual.
- **Enrutamiento Protegido (`App.jsx`):** Se modificó la raíz de la aplicación para aislar completamente el sistema. Si el usuario no está autenticado, el ERP bloquea el renderizado del `Dashboard` y fuerza la vista de `Login`.
- **Axios Interceptor (`api.js`):** Se configuró la capa de servicios para que intercepte automáticamente cada solicitud saliente hacia la API e inyecte el encabezado `Authorization: Bearer <token>`, garantizando el acceso fluido a los recursos protegidos.

---

## [2026-08-04] - Implementación de Lógica de Autenticación (JWT & bcryptjs)
**Módulo Afectado:** Backend (Middlewares y Controladores)

### 🚀 Añadido (Added)
- Dependencias `jsonwebtoken` y `bcryptjs` instaladas en el backend para manejar la seguridad criptográfica de credenciales y sesiones.
- **Controlador de Login (`auth.controller.js`):** Nuevo endpoint lógico que extrae las credenciales, busca al usuario, verifica su contraseña (simulada) de forma asíncrona mediante un hash de bcrypt (`bcrypt.compare`), y genera un token JWT firmado (`jwt.sign`) de 8 horas de duración, incluyendo en la firma el `id` y `rol` del usuario.
- **Middlewares de Seguridad (`auth.middleware.js`):** 
  - `verifyToken`: Intercepta peticiones HTTP, extrae el token Bearer del header `Authorization`, lo valida criptográficamente (`jwt.verify`) y lo inyecta decodificado en `req.user`.
  - `checkRole`: Middleware HOF (Higher Order Function) que valida dinámicamente si el rol del usuario que realiza la petición pertenece al arreglo de roles autorizados para acceder al endpoint, protegiendo las rutas con un `403 Forbidden` en caso de infracción.

### 📝 Notas Técnicas / Justificación Académica
- **Seguridad en APIs REST:** En lugar de utilizar sesiones en servidor (Stateful), se implementó Autenticación Basada en Tokens (Stateless / JWT) siguiendo las mejores prácticas para escalar microservicios en Node.js. El almacenamiento del rol en el payload del token y la protección de los endpoints mediante Middlewares garantiza un Control de Acceso Basado en Roles (RBAC) robusto y de alto rendimiento, evitando saturar la base de datos con consultas de privilegios por cada request.

---

## [2026-08-04] - Limpieza de Base de Datos y Generación Masiva (250 Registros)
**Módulo Afectado:** Base de Datos / Scripts

### 🔄 Modificado (Changed)
- Se ejecutó el script `reset.js` para limpiar completamente los datos operativos y reiniciar los contadores autoincrementales de la base de datos.
- Se creó y ejecutó un nuevo script `seed_250.js` que generó aleatoriamente 250 clientes y 250 contratos de ventas a crédito, junto con nuevos productos de prueba, garantizando que el sistema mantenga un entorno saturado para facilitar las pruebas de rendimiento y estrés en los módulos de Inventario, Clientes y Cartillas.

### 📝 Notas Técnicas / Justificación Académica
- **Pruebas de Estrés y Paginación:** Poblar masivamente el ERP con 250 registros distribuidos ayuda a validar el rendimiento del front-end (renderizado condicional y sistemas de paginación) y a garantizar que las consultas SQL subyacentes se ejecuten de manera eficiente antes de entrar a un entorno de producción real.

---

## [2026-08-04] - Tasa de Interés Dinámica en Créditos
**Módulo Afectado:** Frontend / Backend

### 🚀 Añadido (Added)
- Se implementó la posibilidad de modificar dinámicamente la tasa de interés al momento de crear un nuevo crédito.
- **Frontend (`NuevaVenta.jsx`):** El campo "Tasa de Interés (%)" pasó de ser estático (15% fijo) a ser un input editable y controlado por el estado. Se envía este valor en la carga útil (payload) bajo la llave `tasa_interes`.
- **Backend (`ventas.controller.js`):** El controlador `createVenta` ahora recupera `tasa_interes` y recalcula en el servidor el `monto_a_financiar` y el `total_con_intereses` en lugar de confiar ciegamente en el frontend, garantizando integridad financiera en la creación del crédito.

---

## [2026-08-04] - Cambio de Regla de Negocio: Cuotas con Centavos Exactos
**Módulo Afectado:** Frontend / Backend

### 🔄 Modificado (Changed)
- Se eliminó el redondeo a fracciones de `$0.50` en el cálculo de las cuotas.
- **Frontend (`NuevaVenta.jsx`):** La `Cuota Proyectada` ahora refleja el valor de la división exacta formateado a dos decimales.
- **Backend (`ventas.controller.js`):** La creación de la cartilla (`createVenta`) ahora almacena las cuotas con sus centavos exactos en `monto_cuota` y `saldo_pendiente`.
- Se mantuvo la lógica de cuota de ajuste en la última cuota para absorber el pequeño desfase de división de punto flotante.

### 📝 Notas Técnicas / Justificación Académica
- **Precisión Financiera (Floats):** Se modificó el requerimiento para trabajar con matemática exacta y centavos reales en los flujos de caja, mejorando la precisión en el seguimiento de saldos y registros de abonos, pero reteniendo la corrección de exactitud para la sumatoria de las cuotas.

---

## [2026-08-04] - Lógica de Financiamiento y Redondeo de Cuotas
**Módulo Afectado:** Frontend (Utils)

### 🚀 Añadido (Added)
- Se implementó la función `generarCuotas(montoTotal, numeroCuotas)` en `calculosFinancieros.js`.
- **Lógica Estricta de Fracciones:** La función garantiza que no existan centavos sueltos en el almacén, redondeando las cuotas al múltiplo de `$0.50` más cercano.
- **Cuota de Ajuste:** Se programó que la última cuota actúe siempre como comodín de balance. Esta absorberá la diferencia (ya sea positiva o negativa) para garantizar que la sumatoria de las cuotas calce exactamente con el monto a financiar total.

### 📝 Notas Técnicas / Justificación Académica
- **Precisión Financiera (Floats):** Se ha utilizado matemática de fracciones para el redondeo a los 50 centavos (`Math.round(val * 2) / 2`) combinada con un fix para la precisión de punto flotante de JavaScript en la cuota final (`parseFloat(val.toFixed(2))`). Esto evita el clásico error de lenguaje de obtener valores como `0.9999999` y perder centavos en los flujos de caja.

---

## [2026-08-04] - Limpieza de Base de Datos (Tercer Wipe)
**Módulo Afectado:** Base de Datos

### 🔄 Modificado (Changed)
- Se ejecutó el script `reset.js` para limpiar la base de datos de pruebas residuales y validar la corrección de inserción del `saldo_pendiente` inicial de cada cuota. Los catálogos (Sectores, Marcas, etc.) se mantienen intactos.

---

## [2026-08-04] - Corrección Lógica del Saldo Pendiente en Cartillas Nuevas
**Módulo Afectado:** Backend (Ventas Controller)

### 🐛 Corregido (Fixed)
- Se detectó un error arquitectónico en el método de creación de ventas (`createVenta`) donde las cuotas recién generadas se guardaban con un `saldo_pendiente` equivalente al remanente de todo el crédito (ej. 550, 500, 450) en lugar del valor de la cuota en sí (ej. 50, 50, 50). 
- Al ser listadas en la tabla principal (`getAllVentas`), la base de datos sumaba correctamente la columna de la tabla `Cuotas_Amortizacion`, pero al sumar estos valores escalonados producía cifras astronómicas irreales (ej. $3,278.00).
- Se modificó la inserción para que el `saldo_pendiente` inicial de toda nueva cuota sea exactamente igual a su `monto_cuota`.

---

## [2026-08-04] - Corrección de Columna de Cuotas en Control de Cartillas
**Módulo Afectado:** Backend (Ventas Controller / SQL)

### 🐛 Corregido (Fixed)
- Se identificó y resolvió un error lógico en la consulta SQL de `getAllVentas` (`ventas.controller.js`). Anteriormente, la API enviaba el campo `valor_cuota` calculando una división en tiempo real al vuelo `(total_con_intereses / cantidad_cuotas)`, lo que generaba y exponía los decimales (ej. $65.81) al Frontend.
- Se reemplazó el cálculo dinámico por una sub-consulta directa a la base de datos (`SELECT TOP 1 monto_cuota...`) garantizando que la columna de la tabla ahora consuma e imprima el valor puro ya redondeado directamente desde la cartilla almacenada. El frontend (`Cartillas.jsx`) no requirió cambios porque ya estaba mapeando directamente esta variable con su formateador.

---

## [2026-08-04] - Limpieza de Base de Datos (Segundo Wipe)
**Módulo Afectado:** Base de Datos

### 🔄 Modificado (Changed)
- Se ejecutó nuevamente el script `reset.js` para limpiar la base de datos de pruebas residuales y probar la nueva lógica de redondeo en el backend. Los catálogos se mantienen intactos.

---

## [2026-08-04] - Sincronización de Backend para Generación de Cuotas Redondeadas
**Módulo Afectado:** Backend (Ventas Controller)

### 🐛 Corregido (Fixed)
- Se solucionó una discrepancia donde el frontend previsualizaba las cuotas redondeadas al múltiplo de `$0.50`, pero el backend (`createVenta`) almacenaba en la base de datos las cuotas con todos los centavos.
- Se implementó la misma regla de negocio de fracciones y "Cuota de Ajuste" en el backend para la creación de las filas en `Cuotas_Amortizacion`.

### 📝 Notas Técnicas / Justificación Académica
- **Single Source of Truth (SSOT):** Es fundamental que el backend, como guardián de la base de datos, implemente las mismas reglas de negocio estrictas que se proyectan en el frontend. Dejar la generación de la tabla de amortización a un cálculo flotante nativo causaba desajustes en el estado de cuenta del cliente real.

---

## [2026-08-04] - Limpieza de Base de Datos (Wipe de Datos Operativos)
**Módulo Afectado:** Base de Datos

### 🔄 Modificado (Changed)
- Se ejecutó un script de limpieza total (`reset.js`) para vaciar los datos operativos (Clientes, Productos, Inventario, Ventas, Cuotas y Abonos) y reiniciar los contadores autoincrementales (`DBCC CHECKIDENT RESEED 0`).
- Se preservaron intactos los datos maestros / catálogos (Cantones, Sectores, Categorías y Marcas) para que el sistema siga siendo operativo al momento de ingresar nuevos registros.

### 📝 Notas Técnicas / Justificación Académica
- **Hard Reset / Preparación para Producción:** Esta limpieza era necesaria para eliminar la data "basura" de las fases de desarrollo/pruebas. Al mantener los datos maestros intactos, garantizamos que las reglas de negocio (ej. validaciones de ubicación y clasificación de inventario) funcionen desde el registro número 1 real.

---

## [2026-08-04] - Subida y Visualización de Comprobantes de Pago (Transferencias)
**Módulo Afectado:** Backend / Frontend / Base de Datos

### 🚀 Añadido (Added)
- **Base de Datos:** Se añadió la columna `comprobante_url` a la tabla `Abonos` para almacenar la ruta del archivo adjunto.
- **Backend:** Se instaló la dependencia `multer` para procesar peticiones `multipart/form-data`. Se habilitó la carpeta `uploads/` como contenido estático en Express para servir los archivos localmente.
- **Frontend (`AbonoModal`):** Se agregó un campo de subida de archivo condicional que se activa y es **obligatorio** únicamente cuando el método de pago seleccionado es "Transferencia".
- **Frontend (`HistorialPagosModal`):** Se añadió un botón en la tabla histórica de abonos que permite visualizar el comprobante en una nueva pestaña, si existe.

### 📝 Notas Técnicas / Justificación Académica
- **Integridad Documental Financiera:** En sistemas ERP o de Cartera, los recaudos por transferencia (dinero no físico) exigen respaldo documental para evitar fraudes operativos y facilitar la conciliación bancaria. Guardar el archivo en el servidor y registrar su ruta en la base de datos permite mantener el historial auditable, una práctica indispensable en el desarrollo de software empresarial.

---

## [2026-08-04] - Búsqueda Avanzada de Clientes y Artículos en POS (Nuevo Contrato)
**Módulo Afectado:** Frontend

### 🚀 Añadido (Added)
- **`react-select`** instalado vía `npm install react-select`. Se reemplazaron los `<select>` nativos en el Punto de Venta (POS) / Módulo de Nuevo Contrato por componentes de búsqueda avanzada (Combobox).
- **Búsqueda Dinámica de Clientes:** Ahora al formular un nuevo crédito, se puede buscar al cliente ingresando fragmentos de su Cédula, Nombres o Apellidos.
- **Búsqueda Dinámica de Artículos:** El catálogo de electrodomésticos ahora permite búsquedas difusas (fuzzy search) mediante SKU, Marca o Modelo del artículo, mejorando drásticamente el flujo de venta frente a listados grandes.

### 📝 Notas Técnicas / Justificación Académica
- **UX Transaccional y Rendimiento Operativo:** Reemplazar selectores estáticos por campos de autocompletado en un ERP es una característica "Enterprise". Evita que el operador tenga que hacer un scroll manual extenso al momento de facturar, optimizando el tiempo de servicio al cliente. El componente `react-select` incluye un filtro robusto nativo que analiza la etiqueta completa sin necesidad de implementar algoritmos de búsqueda a la medida, garantizando escalabilidad a miles de registros en el lado del cliente.

---

## [2026-08-04] - Mejoras UX: Zoom en Previsualización y Alertas Profesionales
**Módulo Afectado:** Frontend

### 🚀 Añadido (Added)
- **`react-hot-toast`** instalado vía `npm install react-hot-toast`. Se reemplazaron todas las alertas nativas bloqueantes (`alert()`) en `NotificacionMoraModal.jsx` por notificaciones flotantes (Toasts) elegantes y no intrusivas en la esquina inferior derecha. Incluye indicadores de carga animados (`toast.loading`), éxitos (`toast.success`) y errores (`toast.error`).
- **Zoom Interactivo en Previsualizador PDF:** Se añadieron controles de zoom (Acercar, Alejar y Restablecer con indicador de porcentaje) en la barra de herramientas de `VisualizadorCartillaModal.jsx`. 

### 🔄 Modificado (Changed)
- **`NotificacionMoraModal.jsx`** — Flujo de generación de WhatsApp Web reescrito. Ya no se bloquea la interfaz con pop-ups nativos. Las alertas informan silenciosamente el copiado de la imagen al portapapeles y los errores son capturados por el manejador de notificaciones.
- **`VisualizadorCartillaModal.jsx`** — El contenedor de la cartilla en la previsualización de impresión ahora respeta las transformaciones CSS (`transform: scale(zoom)`) con origen `origin-top` para permitir inspeccionar detalladamente el documento antes de emitirlo.

### 📝 Notas Técnicas / Justificación Académica
- **Enterprise UX (User Experience):** La eliminación de las alertas nativas (que bloquean el main thread del navegador y paralizan la UI) y su reemplazo por librerías de Toast es un estándar indispensable en el desarrollo de Software as a Service (SaaS). 
- **Accesibilidad y Legibilidad:** Agregar funcionalidad de Zoom a la previsualización de documentos PDF permite a los usuarios con monitores pequeños o deficiencia visual validar los cálculos de las cuotas de forma cómoda.

---

## [2026-08-04] - Fix: Cálculo de Mora en Historial de Pagos
**Módulo Afectado:** Frontend

### 🐛 Corregido (Fixed)
- **Error de "Al Día" en Historial:** Se corrigió un error en `HistorialPagosModal.jsx` donde se enviaba la propiedad incorrecta (`cartilla.fecha_emision` en lugar de `cartilla.fecha_venta`) a la función `calcularMontoExigible`. Esto provocaba que clientes con atrasos figuraran erróneamente como "Al Día" al abrir su historial de pagos, ya que el cálculo recibía una fecha indefinida.
- **Descuadre de Centavos en "Valor Vencido":** Se sincronizó la fórmula de cálculo de `totalPagado` y `saldoPendiente` dentro de `HistorialPagosModal.jsx` para que utilice como fuente de la verdad la propiedad `saldo_pendiente` del contrato, en lugar de sumar manualmente el array de abonos. Esto previene pequeños desfases (ej. $0.01) provocados por redondeos de cuotas o liquidaciones de cierre de caja.
- **Actualización Incorrecta de Recaudación Diaria:** Se corrigió el callback `onSaved` en `AbonoModal.jsx` para que envíe correctamente el monto real cobrado (`payload.monto_cobrado`) tras el éxito de la API. Antes se omitía el parámetro, lo que causaba que el sistema hiciera un fallback sumando solo el valor de la cuota estándar al KPI "Total Recaudado Hoy", incluso si el cliente abonaba una cifra mucho mayor para cancelar la deuda completa.
- **Persistencia del KPI "Total Recaudado Hoy":** Se añadió un nuevo endpoint (`GET /api/ventas/recaudado-hoy`) en el backend que suma dinámicamente todos los ingresos de la tabla `Abonos` con fecha del día actual. El frontend (`Cartillas.jsx`) ahora consume este endpoint al montarse, evitando que el contador de caja se reinicie a cero cada vez que el usuario recarga la página.
- **Cálculo Dinámico de Meta de Recaudación:** El KPI "Meta de Recaudación (Día)" en `Cartillas.jsx` dejó de ser un valor fijo hardcoded ($500.00). Ahora se calcula matemáticamente prorrateando las cuotas activas según su frecuencia de pago: las cuotas semanales aportan (cuota/7) al día, las quincenales (cuota/15) y las mensuales (cuota/30). Esto proporciona una proyección financiera realista de los ingresos diarios esperados por la empresa.
- **Orden Cronológico en Cartilla Física:** Se corrigió un error visual y lógico en `ImpresionCartilla.jsx` (previsualizador e impresión) donde los abonos se listaban de más reciente a más antiguo (orden descendente). Esto provocaba que el saldo decreciente en la tabla de papel se calculara al revés. Se aplicó un algoritmo de inversión cronológica (`[...abonos].reverse()`) para asegurar que el primer pago realizado aparezca primero, manteniendo la coherencia de lectura física clásica.
### 📝 Notas Técnicas / Justificación Académica
- Mantener consistencia en los nombres de las propiedades derivadas de la base de datos es clave para la integridad del estado en el Frontend. Al coincidir la prop con la columna de SQL Server (`fecha_venta`), la utilidad de cálculo financiero vuelve a sincronizar correctamente la mora.

---

## [2026-08-04] - Módulo de Gestión de Cobranza Activa (WhatsApp + html2canvas)
**Módulo Afectado:** Frontend / Infraestructura

### 🚀 Añadido (Added)
- **Dependencia `html2canvas`** instalada vía `npm install html2canvas`. Permite capturar componentes React renderizados en el DOM y convertirlos en imágenes PNG de alta resolución directamente en el navegador del cliente, sin servidor.
- **`src/components/NotificacionMoraModal.jsx`** — Nuevo modal empresarial de gestión de cobranza con las siguientes capacidades:
  - **KPIs de Mora:** Grid de 3 indicadores (Valor Vencido, Saldo Pendiente, Cuota) con colores semánticos (rojo/índigo/ámbar).
  - **Badge de Atraso Dinámico:** Calcula automáticamente el tiempo de mora en días/semanas/meses usando un algoritmo interno (`calcularTiempoAtraso`) que proratea los períodos transcurridos versus las cuotas pagadas.
  - **Selector de Tono de Mensaje:** 3 botones tipo card con íconos y colores diferenciados:
    - `Recordatorio Amistoso` (verde, tono cordial con emojis).
    - `Aviso de Vencimiento` (ámbar, tono firme exigiendo el monto vencido).
    - `Notificación Pre-Judicial` (rojo, ultimátum con advertencia legal a 48h).
  - **Vista Previa del Mensaje:** `<textarea>` read-only con el texto completo interpolado dinámicamente (`[Nombre]`, `[Valor Vencido]`, `[Tiempo Atraso]`, firma del almacén). Seleccionable con un clic.
  - **Descarga de Imagen (html2canvas):** Botón secundario que ejecuta `html2canvas` sobre una instancia oculta de `ImpresionCartilla` (mode='preview'), generando y descargando automáticamente `EstadoDeCuenta_[Nombre].png` a escala 2x.
  - **Integración WhatsApp Web + Clipboard API:** Botón primario verde que ejecuta un flujo secuencial asíncrono:
    1. Captura la cartilla con `html2canvas` a escala 2x.
    2. Convierte el canvas a Blob PNG y lo copia al portapapeles vía `navigator.clipboard.write([new ClipboardItem])`.
    3. Muestra una alerta UX indicando que la imagen está lista para pegar con `Ctrl+V`.
    4. Abre `https://web.whatsapp.com/send?phone=[593...]&text=[encoded]` en nueva pestaña.
    5. Incluye fallback graceful: si la Clipboard API falla (ej. HTTP sin HTTPS), redirige igualmente a WhatsApp y sugiere usar el botón "Descargar Imagen" como alternativa manual.
  - **Normalización de Teléfonos Ecuatorianos:** Aplica la regla estricta `0XXXXXXXXX` → `593XXXXXXXXX` eliminando caracteres no numéricos (espacios, guiones, paréntesis) antes de construir la URL de WhatsApp.
  - **Info de Teléfono:** Banner inferior que muestra el número registrado del cliente con alerta visual si no hay teléfono registrado.

### 🔄 Modificado (Changed)
- **`src/pages/Cartillas.jsx`** — Se añadió un botón de ícono `MessageCircle` (verde) en la columna "Acción" de la tabla principal. Este botón **solo aparece** cuando el Monto Exigible del cliente es mayor a $0.00 (es decir, cuando está en mora). Al hacer clic, carga asincrónicamente los abonos del cliente y abre `NotificacionMoraModal`.

### 📝 Notas Técnicas / Justificación Académica
- **Cobranza Activa Digital:** La integración con WhatsApp Web API (sin librerías de terceros ni tokens de Meta Business) es la forma más pragmática de implementar notificaciones en un ERP de escala PYME. No requiere servidor de mensajería, cuenta Business API, ni costos recurrentes.
- **Clipboard API (navigator.clipboard.write):** Es la API nativa del navegador para escritura programática al portapapeles. Requiere HTTPS en producción (funciona en localhost por excepción de seguridad). Al copiar la imagen como `ClipboardItem` de tipo `image/png`, el usuario puede pegarla directamente en el campo de adjuntos de WhatsApp Web con `Ctrl+V`, eliminando el paso manual de buscar el archivo descargado.
- **Captura Client-Side (html2canvas):** Generar la imagen directamente en el navegador evita la necesidad de un servicio de renderizado en el backend (como Puppeteer o wkhtmltoimage), reduciendo la complejidad de infraestructura. La captura a escala 2x garantiza legibilidad en pantallas móviles.
- **Plantillas con Escalada de Tono:** La segmentación en 3 niveles de severidad refleja el proceso real de cobro de la empresa: recordatorio amistoso → aviso formal → ultimátum pre-judicial. Esto permite documentar para la tesis el concepto de "gestión de cartera por niveles de riesgo" (Credit Risk Management).

---

## [2026-08-03] - Fix: Lógica de techo implementada para evitar que el Valor Vencido supere el Saldo Pendiente
**Módulo Afectado:** Lógica Financiera / Frontend

### 🐛 Corregido (Fixed)
- **Cálculo de Mora Desbordado:** Se corrigió un error lógico en la utilidad `calcularMontoExigible` donde el "Monto Esperado" crecía indefinidamente al pasar el tiempo (incluso si la deuda real restante era mucho menor). 
- Se implementó una **regla de techo** obligatoria usando `Math.min(valorVencidoCalculado, saldoPendiente)`, garantizando matemáticamente que el sistema nunca exija a un cliente pagar en mora un valor superior al total real de su deuda restante. Todos los componentes dependientes (`Cartillas.jsx`, `HistorialPagosModal.jsx` y `AbonoModal.jsx`) fueron actualizados para inyectar esta restricción.

---

## [2026-08-03] - Simplificación de Interfaz (Remoción de Estado)
**Módulo Afectado:** Frontend

### 🔄 Modificado (Changed)
- **`frontend/src/pages/Cartillas.jsx`** — Se eliminó la columna "Estado" (Al Día / Mora) de la tabla principal, ya que esta información ahora se muestra de forma más precisa y cuantitativa en la nueva columna **"Valor Vencido"**, reduciendo la redundancia visual en el dashboard.

---

## [2026-08-03] - Algoritmo de Monto Exigible (Alerta de Mora)
**Módulo Afectado:** Frontend / Lógica Financiera

### 🚀 Añadido (Added)
- **`frontend/src/utils/calculosFinancieros.js`** — Se creó una nueva utilidad centralizada con la función `calcularMontoExigible`. Este algoritmo puro (sin dependencias externas, usando JS nativo) calcula los períodos transcurridos desde la emisión del crédito según su frecuencia (Diario, Semanal, Quincenal, Mensual) y deduce matemáticamente el saldo exacto que el cliente debe pagar *hoy* para ponerse al día.
- **`frontend/src/components/HistorialPagosModal.jsx`** — Se añadió un nuevo KPI llamado **"Valor Vencido"** al grid superior. Incorpora diseño semántico: 
  - Si el monto es $0.00, muestra un badge verde "Al Día".
  - Si el cliente está atrasado, muestra el valor exigible en rojo con un ícono de advertencia (`AlertTriangle`).
- **`frontend/src/pages/Cartillas.jsx`** — Se agregó la columna **"Valor Vencido"** directamente en la tabla principal del módulo. Esto permite a los cobradores visualizar rápidamente (con badges rojos) qué clientes están en mora y exactamente cuánto deben para ponerse al día sin necesidad de abrir el historial de pagos.
- **`frontend/src/components/AbonoModal.jsx`** — Ahora, al abrir el modal para registrar un pago, el sistema detecta de forma inteligente si el cliente está atrasado. Si el "Monto Exigible" es mayor a 0, sugiere por defecto ese valor exacto para ponerse al día; en caso contrario, sugiere la cuota normal.

### 📝 Notas Técnicas / Justificación Académica
- **Métricas de Riesgo y UX:** Facilitar al cobrador el monto exacto de mora sin obligarlo a calcular mentalmente los períodos atrasados es fundamental para reducir la fricción en el recaudo (Enterprise UX). El cálculo centralizado facilita su futura reutilización en Reportes Gerenciales y Dashboards.

---

## [2026-08-03] - Resolución de Edge Case: Ajuste por Redondeo (Floating Point)
**Módulo Afectado:** Frontend

### 🐛 Corregido (Fixed)
- **Error de Centavos Pendientes:** Se abordó el caso borde donde las cartillas quedaban abiertas con saldos minúsculos (ej. $0.03) generados por inexactitudes en la división de cuotas. El input de cobro fue verificado para permitir pagos decimales exactos con `step="0.01"`.

### 🚀 Añadido (Added)
- **`frontend/src/components/AbonoModal.jsx`** — Se implementó la lógica de "Liquidación Automática". Si el saldo pendiente es mayor a $0.00 y menor o igual a $0.99, el sistema despliega un banner informativo naranja (`bg-amber-50`). 
- Dentro de este banner, un botón especial liquida automáticamente la cartilla asumiendo los centavos faltantes bajo el método de pago predefinido como **"Ajuste de Redondeo"**, enviando la petición directamente al backend y marcando el crédito como "Finalizado".

### 📝 Notas Técnicas / Justificación Académica
- **Manejo de Casos Borde en Sistemas Financieros (Floating Point / Cuadre de Caja):** En la contabilidad real, es inviable cobrar fracciones de centavos en efectivo, y un saldo abierto por $0.01 impide que el sistema cierre el crédito. Implementar un "Ajuste de Caja" o "Condonación de Redondeo" es una característica empresarial estandarizada (Enterprise Feature) que mantiene la integridad referencial y permite cerrar el flujo operativo del vendedor sin alterar los balances históricos.

---

## [2026-08-03] - Adición de Método de Pago al Registrar Abonos
**Módulo Afectado:** Backend / Frontend

### 🚀 Añadido (Added)
- **`frontend/src/components/AbonoModal.jsx`** — Se agregó un selector (`<select>`) obligatorio para "Método de Pago" al registrar un abono, con las opciones: Efectivo (por defecto) y Transferencia. Se integró al payload enviado al backend.
- **`backend/src/controllers/ventas.controller.js`** — En el controlador `registerAbono`, se capturó el campo `metodo_pago` desde el `req.body` y se incluyó en la sentencia SQL de inserción en la tabla `Abonos`.

### 📝 Notas Técnicas / Justificación Académica
- **Trazabilidad Financiera:** Registrar explícitamente el método de pago en el momento del recaudo es vital para la cuadratura de caja diaria (saber cuánto ingresó en efectivo vs. banco), mejorando sustancialmente el valor del ERP.

---

## [2026-08-03] - Visualizador de Vista Previa antes de Impresión (VisualizadorCartillaModal)
**Módulo Afectado:** Frontend

### 🚀 Añadido (Added)
- **`src/components/VisualizadorCartillaModal.jsx`** — Modal de "sala de espera" antes de la impresión física:
  - **Overlay:** `bg-gray-900/70 backdrop-blur-sm z-[60]` (por encima del modal de historial en `z-50`).
  - **Contenedor:** `max-w-4xl h-[90vh] flex flex-col bg-slate-100 rounded-xl` — estructura fija con header + cuerpo scrollable + footer.
  - **Barra de herramientas:** Título "Vista Previa de Impresión" + nombre del cliente + folio. Botón "Cancelar" (gris) y botón primario "Imprimir Documento" (`bg-indigo-600`) con ícono de impresora.
  - **Área de visualización:** Fondo gris simulando un escritorio oscuro. Hoja de papel central (`bg-white shadow-xl border border-gray-300 max-w-[760px]`) con `ImpresionCartilla` en `mode='preview'` (visible en pantalla).
  - **Nodo de impresión oculto:** Una segunda instancia de `ImpresionCartilla` en `mode='print'` (hidden) con `ref`, capturada por `useReactToPrint` con `@page { size: A5 landscape }`.
  - **Footer:** Nota "Ningún archivo es guardado en el disco" + conteo de abonos.

### 🔄 Modificado (Changed)
- **`src/components/ImpresionCartilla.jsx`** — Se añadió prop `mode: 'print' | 'preview'` (default `'print'`):
  - `mode='print'` → `className="hidden print:block"` (comportamiento original, invisble en pantalla).
  - `mode='preview'` → `className="block"` (visible en el visualizador).
- **`src/components/HistorialPagosModal.jsx`** — Refactorizado para eliminar `useReactToPrint` y la instancia directa de `ImpresionCartilla`. El botón "Imprimir Cartilla" ahora abre `VisualizadorCartillaModal` via estado `showVisualizador`, delegando toda la lógica de impresión al visualizador.

### 📝 Notas Técnicas / Justificación Académica
- **Patrón "Sala de Espera" (Print Preview):** Separar la vista previa de la acción de impresión es una práctica estándar en aplicaciones de gestión financiera y ERP empresariales. Le permite al operador verificar que los datos de la cartilla (artículo, montos, abonos) son correctos antes de gastar papel físico, reduciendo errores operativos.
- **Almacenamiento Cero:** Al utilizar la ventana de impresión nativa del navegador vía `react-to-print` (en lugar de `jsPDF` o descarga de blob), ningún archivo temporal es escrito al sistema de archivos del cliente. El documento existe únicamente en memoria RAM durante el ciclo de impresión.

---

## [2026-08-03] - Generador de Cartillas Físicas en PDF (ImpresionCartilla)
**Módulo Afectado:** Frontend / Infraestructura

### 🚀 Añadido (Added)
- **Dependencia `react-to-print`** instalada vía `npm install react-to-print --save`. Permite disparar la ventana de impresión nativa del navegador apuntando a un componente React mediante un `ref`, sin necesidad de rutas adicionales ni servidor.
- **`src/components/ImpresionCartilla.jsx`** — Componente de impresión fiel al formato físico del almacén "Créditos La Gloria de Dios":
  - **Sección A - Cabecera:** Nombre del almacén (`text-blue-900`), RUC, razón social completa, dirección y número de folio en rojo (`#dc2626`) en esquina superior derecha, alineado con `position: absolute`.
  - **Sección B - Cuerpo:** Grid de 2 columnas con líneas punteadas que replican los campos escritos a mano: Nombre, Artículo, Dirección, Zona, Fecha, Tipo de venta (CRÉDITO), Plazo, Garante, Entrada, Cuota, Total y Teléfono.
  - **Sección C - Tabla Doble de Control de Pagos:** `display: grid` con dos tablas paralelas (Fecha | Abono | Saldo). Las primeras filas se pre-rellenan con los abonos históricos y sus saldos calculados en cascada; las filas restantes (14 vacías) permiten al cobrador seguir anotando manualmente en la calle.
  - **Sección D - Pie:** Tres líneas de firma (Recaudador, F. Supervisor, F. Vendedor) y nota de generación electrónica.
  - Usa **estilos inline** para máxima compatibilidad con el engine de impresión del navegador (evita que Tailwind JIT no compile clases `print:` en producción).
  - Implementado con `forwardRef` para exponerse correctamente al hook `useReactToPrint`.

### 🔄 Modificado (Changed)
- **`src/components/HistorialPagosModal.jsx`** — Integración completa del generador de PDF:
  - Importa `useReactToPrint` y `ImpresionCartilla`.
  - Crea un `useRef` (`cartillaPrintRef`) apuntando al componente `<ImpresionCartilla>` renderizado fuera del modal (pero dentro del mismo árbol de render).
  - El hook `useReactToPrint` configura la impresión con `@page { size: A5 landscape; margin: 6mm 8mm; }` y `print-color-adjust: exact` para garantizar que los bordes azules y fondos se impriman correctamente.
  - Añade botón **"Imprimir Cartilla"** (`bg-blue-50 text-blue-700`) junto al botón de cerrar en la cabecera del modal, deshabilitado mientras se cargan los abonos.

### 📝 Notas Técnicas / Justificación Académica
- **Patrón de Impresión sin Servidor:** El uso de `react-to-print` con `@page` CSS permite generar documentos físicos directamente desde el cliente sin necesidad de librerías pesadas como `jsPDF` o `Puppeteer` en el servidor. Esto reduce la complejidad de infraestructura y aprovecha el motor de impresión nativo del navegador, que ya maneja correctamente la maquetación de tablas a través de múltiples páginas físicas.
- **Formato híbrido Digital/Físico:** El componente `ImpresionCartilla` pre-rellena los pagos históricos y deja filas en blanco, replicando el paradigma operativo real del almacén donde el cobrador lleva la cartilla física a la ruta de cobro diaria.

---

## [2026-08-02] - Columna de Artículos Adquiridos en Módulo de Cartillas
**Módulo Afectado:** Backend / Frontend

### 🔄 Modificado (Changed)
- **`backend/src/controllers/ventas.controller.js`** — `getAllVentas`: La query SQL fue enriquecida con dos subconsultas correlacionadas adicionales:
  - `articulos_detalle`: Usa `STRING_AGG` de SQL Server para concatenar, en una sola celda, todos los artículos del crédito en formato `Marca Modelo [S/N: XXX] | Marca Modelo [S/N: YYY]`. Realiza los JOINs: `Detalle_Ventas → Inventario_Series → Productos → Marcas`.
  - `cantidad_articulos`: Cuenta el número de artículos asociados al crédito mediante un `COUNT(*)` correlacionado.
- **`frontend/src/pages/Cartillas.jsx`** — Se añadió la columna **"Artículo(s) Adquirido(s)"** entre "Cliente" y "Ruta/Sector":
  - Si `articulos_detalle` tiene valor, muestra cada artículo en una fila separada con ícono `Package` de Lucide y el texto `Marca Modelo [S/N: ...]`.
  - Si hay más de 1 artículo, muestra un badge indigo con el conteo (`X artículos`).
  - Si no hay artículos asociados (contratos de importación masiva sin detalle), muestra "Sin artículos" en gris.

### 📝 Notas Técnicas / Justificación Académica
- **Uso de STRING_AGG:** La función `STRING_AGG` (disponible en SQL Server 2017+) es la forma estándar para agregar filas en una sola celda sin necesidad de cursores ni FOR XML PATH. Esto evita múltiples viajes al servidor (N+1 queries) y mantiene la respuesta de la API como un único array de objetos plano, compatible con la paginación del lado del cliente.

---

## [2026-08-02] - Sistema de Paginación Universal para Todos los Módulos
**Módulo Afectado:** Frontend

### 🚀 Añadido (Added)
- **`src/components/Pagination.jsx`** — Nuevo componente reutilizable de paginación Enterprise UI:
  - Muestra rango de páginas con elipsis inteligente (`[1] … [4] [5] [6] … [20]`) para no saturar la barra cuando hay muchas páginas.
  - Botones de primera/última página (`ChevronsLeft / ChevronsRight`) y anterior/siguiente.
  - Selector de "Filas por página" con opciones 10, 25, 50, 100.
  - Contador de registros: "Mostrando X–Y de Z registros".
  - Página activa resaltada en indigo (`bg-indigo-600 text-white`), botones deshabilitados en gris claro.

### 🔄 Modificado (Changed)
- **`src/pages/Clientes.jsx`** — Paginación integrada sobre el resultado filtrado `filtered`. Resetea a página 1 al cambiar el término de búsqueda.
- **`src/pages/Inventario.jsx`** — Paginación integrada sobre `filteredProductos`. Resetea a página 1 al cambiar búsqueda o categoría.
- **`src/pages/VentasCredito.jsx`** — Paginación integrada sobre `filteredVentas`. Resetea a página 1 al cambiar búsqueda o filtro de estado.
- **`src/pages/Cartillas.jsx`** — Paginación integrada sobre `filteredCartillas`. Resetea a página 1 al cambiar búsqueda o sector.

### 📝 Notas Técnicas / Justificación Académica
- **Patrón de Paginación del Lado del Cliente:** Con 160+ registros en BD, cargar toda la lista de una vez en el DOM es aceptable para este volumen (la respuesta de la API sigue siendo un array completo). La paginación ocurre en memoria (`Array.slice`) sobre el array ya filtrado, lo que garantiza que los filtros y la búsqueda funcionen correctamente sobre el conjunto total sin perder registros. Para escenarios con > 10 000 registros se recomienda migrar a paginación server-side con parámetros `?page=X&limit=Y` en los endpoints.

---

## [2026-08-02] - Carga Masiva de Datos de Demostración (160+ Registros)
**Módulo Afectado:** Base de Datos

### 🚀 Añadido (Added)
- Script `seed_masivo.js` ejecutado para poblar la base de datos `Cartera360` con datos de demostración realistas para la sustentación de tesis:
  - **15 productos** del catálogo de electrodomésticos (refrigeradoras, lavadoras, televisores, cocinas, aires acondicionados) con SKU, precios y stock reales.
  - **160 clientes** con cédulas ecuatorianas únicas, nombres y apellidos variados, teléfonos y direcciones distribuidas en los sectores de cobro de Milagro.
  - **160 contratos de crédito** (`Ventas_Credito`) con montos entre $350 y $1800, plazos de 6 a 36 meses y frecuencias Mensual / Quincenal / Semanal.
  - **6,216 cuotas de amortización** (`Cuotas_Amortizacion`) distribuidas con estados dinámicos: PAGADA, MORA o PENDIENTE según los períodos transcurridos desde la firma del contrato.
  - **2,772 abonos históricos** (`Abonos`) con fechas y métodos de pago variados (Efectivo/Transferencia) para demostrar el módulo de historial de pagos.

### 📝 Notas Técnicas / Justificación Académica
- **Datos Realistas para Demostración Académica:** La generación de datos masivos con estados variados (contratos al día, en mora, finalizados) permite al tribunal de tesis evaluar la integridad referencial del modelo relacional, el comportamiento del motor de cálculo de saldos y la correcta distribución de cuotas en la interfaz de Cartillas y Cobranzas bajo condiciones de carga real.

---

## [2026-08-02] - Refactorización UI/UX Avanzada - HistorialPagosModal (Data Grid Corporativo)
**Módulo Afectado:** Frontend

### 🔄 Modificado (Changed)
- **`src/components/HistorialPagosModal.jsx`** completamente rediseñado con arquitectura de layout fijo/scroll:
  - Contenedor `max-h-[90vh] flex flex-col` para que el modal nunca supere el 90% de la pantalla sin importar cuántos registros existan.
  - Zona superior fija (`shrink-0`): cabecera del modal y mini KPIs de monto, recaudado y saldo (ahora con barra de progreso de amortización animada).
  - Zona central scrollable (`flex-1 overflow-y-auto`) con scrollbar personalizado ultrafino (`w-1.5`, track transparente, thumb gris suave) vía clases arbitrarias de Tailwind.
  - Cabeceras de tabla fijas (`sticky top-0 z-10 bg-gray-50 shadow-sm`) para que el usuario siempre sepa qué columna es cuál al hacer scroll.
  - **Zebra Striping:** Filas alternas con fondo `even:bg-slate-50/50` para facilitar lectura en grandes listados.
  - **Monto en verde:** Columna de Monto Cobrado ahora en `text-emerald-600 font-medium font-mono` para dar sensación de ingreso.
  - **Columna Comprobante:** Botón de icono `FileText` por fila en gris con hover azul para reimprimir/consultar el comprobante.
  - Zona inferior fija (`shrink-0`): Footer con conteo exacto "Mostrando X registros de pago" + botón Cerrar a la derecha.

### 📝 Notas Técnicas / Justificación Académica
- **Control de Overflow y UX Escalable:** La arquitectura `flex flex-col / flex-1 overflow-y-auto` es el patrón canónico en UI corporativas para separar zonas de contenido estático (cabeceras, KPIs, footers) de zonas de datos variables. Esto garantiza que el modal sea funcional tanto con 1 como con 500 registros, un criterio de escalabilidad requerido en arquitecturas de sistemas ERP de grado profesional.

---

## [2026-08-02] - Módulo de Historial de Pagos de Cartillas (Auditoría Financiera)
**Módulo Afectado:** Backend / Frontend

### 🚀 Añadido (Added)
- Nuevo componente frontend `src/components/HistorialPagosModal.jsx` para mostrar los abonos realizados de forma auditable, con mini KPIs de Monto Financiado, Total Recaudado y Saldo Pendiente, y una rejilla de pagos históricos. En caso de no registrar cobros, despliega un estado vacío (Empty State).
- Nuevo endpoint de backend `/api/cartillas/:id/abonos` (`GET`) para recuperar el listado histórico de abonos recibidos para un contrato de venta/cartilla.
- Nueva tabla `Abonos` en base de datos SQL Server (`Cartera360`) estructurada para auditoría independiente con columnas: `id_abono`, `id_cartilla`, `monto_cobrado`, `fecha_registro` y `metodo_pago`.

### 🔄 Modificado (Changed)
- Se actualizó el controlador de pagos `registerAbono` en `backend/src/controllers/ventas.controller.js` para registrar de forma atómica y concurrente cada abono en la tabla `Abonos` dentro de la transacción de amortización.
- Se actualizó `src/pages/Cartillas.jsx` para integrar el botón "Ver Historial" en la rejilla de rutas, permitiendo consultar los abonos históricos de cualquier contrato.

### 🐛 Corregido (Fixed)
- N/A

### 📝 Notas Técnicas / Justificación Académica
- **Seguimiento e Inmutabilidad Contable (Históricos):** Amortizar saldos modificando únicamente el saldo de las cuotas pendientes degrada la trazabilidad histórica de cobros. La adición de la tabla `Abonos` en el esquema relacional actúa como un diario auxiliar contable (inmutable) que permite justificar los ingresos diarios e históricos ante auditorías del sistema y la sustentación académica de tesis.

---

## [2026-08-02] - Controlador de Importación Masiva con Upsert (Clientes/Contratos)
**Módulo Afectado:** Backend / Frontend

### 🚀 Añadido (Added)
- Nuevo endpoint de backend `/api/cartillas/bulk` (`POST`) para procesar e importar en lote registros financieros desde archivos Excel cargados por el usuario.
- Nuevo controlador `procesarImportacionMasiva` en `backend/src/controllers/cartillas.controller.js` con soporte transaccional ACID utilizando `mssql.Transaction`.
- Lógica de "Upsert" para la resolución de clientes: si la cédula del cliente del Excel ya existe, recupera su `id_cliente`; si no existe, lo crea dinámicamente dividiendo su nombre completo en `nombres` y `apellidos` y asignando un sector por defecto para satisfacer restricciones referenciales.
- Inserción automatizada de contratos de créditos en `Ventas_Credito` y desglose secuencial de cuotas de amortización en `Cuotas_Amortizacion` en base a la frecuencia y cuota del Excel.

### 🔄 Modificado (Changed)
- Se actualizó `backend/src/index.js` para registrar las rutas del importador masivo en `/api/cartillas`.
- Se modificó `frontend/src/components/ImportadorMasivo.jsx` actualizando el endpoint de Axios a `/cartillas/bulk` y adaptando la validación del lado del cliente para exportar la estructura JSON exacta (`registros: payload`) que consume el backend.

### 🐛 Corregido (Fixed)
- N/A

### 📝 Notas Técnicas / Justificación Académica
- **Operación Atómica Masiva (ACID):** El procesamiento en lote envuelve múltiples operaciones de consulta, inserción condicional de clientes e inserciones recurrentes de contratos y cuotas de pago. El uso de `sql.Transaction` garantiza atomicidad; es decir, si tan solo una fila del Excel falla al insertarse en SQL Server, toda la carga es revertida (`rollback`), evitando inconsistencias en la contabilidad y bases de datos del sistema, un criterio de diseño indispensable en tesis de grado universitarias.

---

## [2026-08-02] - Módulo de Importación Masiva por Excel (Clientes/Contratos)
**Módulo Afectado:** Frontend

### 🚀 Añadido (Added)
- Nuevo componente `src/components/ImportadorMasivo.jsx` que permite realizar la migración inicial de datos históricos en el cliente mediante la lectura de archivos `.xlsx` / `.csv` (SheetJS).
- Zona interactiva de Drag and Drop (Dropzone) con indicadores y animaciones visuales para carga de archivos.
- Rejilla de visualización de datos (tabla de vista previa de 50 registros) con barra de estado estática.
- Lógica de validación fila por fila del Excel: campos obligatorios (cédula, nombres, apellidos), tipo de dato numérico (montos) y longitud de cédula de 10 dígitos. Las filas inválidas se muestran en rojo (`bg-rose-50`) con un tooltip del listado de errores específicos.

### 🔄 Modificado (Changed)
- Se actualizó `src/App.jsx` para incluir la dependencia `xlsx` e integrar el ruteador de la aplicación hacia la pestaña `'importador'`.

### 🐛 Corregido (Fixed)
- N/A

### 📝 Notas Técnicas / Justificación Académica
- **Procesamiento de Archivos en Cliente (Client-Side Parsing):** El uso de SheetJS (`xlsx`) para procesar archivos binarios directamente en el navegador del cliente reduce el consumo de CPU y memoria del servidor Express backend, previniendo cuellos de botella y ataques de denegación de servicio (DoS) por archivos corruptos, un requerimiento clave para la justificación de arquitectura y escalabilidad en tesis de ingeniería de software.

---

## [2026-08-02] - Módulo de Cartillas y Cobranzas (Rutas y Registro de Abonos)
**Módulo Afectado:** Backend / Frontend

### 🚀 Añadido (Added)
- Nueva página `src/pages/Cartillas.jsx` para la gestión administrativa de rutas de cobro diaria, con KPI de metas y cobros reales en tiempo real, búsqueda y filtro por Sector/Ruta, listado de cartillas de amortización activas y botón de registro de abonos.
- Nuevo componente `src/components/AbonoModal.jsx` (esmerilado overlay `bg-gray-900/50 backdrop-blur-sm`) que muestra el resumen del saldo pendiente, cuota sugerida y un formulario de ingreso de monto cobrado con fecha, y botón semántico de confirmación en color verde (`bg-emerald-600 hover:bg-emerald-700`).
- Endpoint de backend `/api/ventas/abono` (`POST`) para procesar el cobro en la base de datos SQL Server:
  - Aplica de forma transaccional el monto recibido a la cuota más antigua pendiente del contrato, reduciendo su `saldo_pendiente` y marcando la cuota como `'PAGADA'` si se cubre en su totalidad. Los saldos excedentes se imputan secuencialmente a las siguientes cuotas en cascada.

### 🔄 Modificado (Changed)
- Se actualizó `src/App.jsx` para registrar la vista `'cartillas'` en el switch-case lateral.
- Se actualizó `backend/src/controllers/ventas.controller.js` modificando la consulta `getAllVentas` para devolver calculados dinámicamente `saldo_pendiente` (suma de cuotas impagas), `valor_cuota` y `nombre_sector` del cliente para habilitar búsquedas y filtros precisos de cobro.

### 🐛 Corregido (Fixed)
- N/A

### 📝 Notas Técnicas / Justificación Académica
- **Imputación de Pagos en Cascada (FIFO):** El algoritmo de abonos del backend sigue el principio "First In, First Out" (FIFO) sobre las cuotas de amortización. Esto asegura un cobro justo donde los pagos parciales o excesivos del cliente se imputan en orden cronológico, facilitando el control y auditoría del estado financiero del crédito requerido para la sustentación académica de tesis.

---

## [2026-08-02] - Módulo de Ventas a Crédito (Listado, POS y Transacciones en BD)
**Módulo Afectado:** Backend / Frontend

### 🚀 Añadido (Added)
- Nueva página `src/pages/VentasCredito.jsx` para el listado administrativo de créditos activos, con KPIs de Cartera Activa y Mora, barra de herramientas con búsqueda y filtro de estados, y acciones rápidas para ver detalle e imprimir pagaré.
- Nueva vista transaccional `src/pages/NuevaVenta.jsx` (POS) estructurada en un diseño dual responsivo: columna de ingreso (selección de cliente con calificación crediticia, carrito de artículos y condiciones de plazo/frecuencia) y barra lateral adhesiva con desglose de costos (subtotal, entrada, financiado, intereses calculados al 15% y cuota proyectada).
- Endpoints de backend `/api/ventas` con soporte completo para transacciones ACID en SQL Server:
  - `POST /api/ventas`: Registra un contrato de venta, vincula artículos con series disponibles en inventario (autogenerando de respaldo si no hay series físicas ingresadas), disminuye automáticamente el stock del electrodoméstico (`Productos.stock_actual`), y autogenera secuencialmente la cartilla de amortización (`Cuotas_Amortizacion`) con fechas de vencimiento precisas basadas en la frecuencia elegida.
  - `GET /api/ventas`: Retorna el listado de contratos, evaluando dinámicamente si el contrato está activo, pagado, o en mora en base al estado de sus cuotas.
  - `GET /api/ventas/:id`: Recupera la información del contrato junto con su detalle de artículos y cartilla de amortización completa.
- Nuevos archivos de rutas y controladores correspondientes: `ventas.routes.js` y `ventas.controller.js`.

### 🔄 Modificado (Changed)
- Se actualizó `src/App.jsx` para importar e integrar `VentasCredito` y `NuevaVenta` en la navegación y renderizado de vistas dinámicas.
- Se modificó `backend/src/index.js` para registrar el enrutador de ventas en el servidor Express.

### 🐛 Corregido (Fixed)
- Se corrigió el error que impedía agregar productos al carrito del contrato en el POS (`NuevaVenta.jsx`), el cual era causado por una comparación de tipo estricto (`===`) entre el ID del producto (devuelto como string por el driver de base de datos en Node) y el ID del selector (convertido a Number). Se estandarizaron todas las búsquedas utilizando conversión explícita a `String()`.
- Se removieron los registros mock de inicio tanto en el listado de contratos (`VentasCredito.jsx`) como en el carrito del POS (`NuevaVenta.jsx`) para que la interfaz inicie limpia por defecto.

### 📝 Notas Técnicas / Justificación Académica
- **Proyecciones Matemáticas en Tiempo Real:** El uso de efectos reactivos (`useEffect`) garantiza que los cálculos de amortización básica (financiamiento simple con tasa fija) se realicen de forma fluida y en tiempo real a medida que el usuario altera las condiciones comerciales o añade/remueve productos.
- **Enrutador Ligero Basado en Estado:** La transición fluida de vistas mediante callbacks (`onViewChange`) mantiene la arquitectura simple e independiente de paquetes de ruteo complejos, facilitando el desarrollo rápido y garantizando robustez en proyectos académicos de fin de ciclo.

---

## [2026-08-02] - Módulo de Inventario y Formulario de Productos
**Módulo Afectado:** Backend / Frontend

### 🚀 Añadido (Added)
- Nuevo componente `src/components/ProductoModal.jsx` para la creación y edición de productos, con diseño adaptativo en grid de dos columnas (`grid-cols-1 md:grid-cols-2`), inputs de paso decimal (`step="0.01"`), y un panel de descripción en ancho completo.
- Nueva página `src/pages/Inventario.jsx` con dashboard de catálogo que incluye KPI de stock, barra de búsqueda en tiempo real (SKU, modelo o marca), filtrado por categoría y listado de productos con badges de stock mínimo semánticos.
- Endpoints de backend `/api/categorias` y `/api/marcas` para consultar y agregar marcas/categorías directamente de la base de datos SQL Server.
- Nuevos archivos de rutas y controladores correspondientes: `categorias.routes.js`, `marcas.routes.js`, `categorias.controller.js` y `marcas.controller.js`.

### 🔄 Modificado (Changed)
- Se actualizó `src/App.jsx` para importar el nuevo componente `Inventario` e integrarlo en la navegación del menú lateral.
- Se actualizó `backend/src/index.js` para registrar y servir las nuevas rutas `/api/categorias` y `/api/marcas`.
- Se expandió `backend/seed.js` para poblar automáticamente las tablas `Categorias` y `Marcas` con 6 categorías y 7 marcas predeterminadas de electrodomésticos de forma limpia e idempotente (patrón UPSERT).

### 🐛 Corregido (Fixed)
- Se corrigió el error en la creación de productos en base de datos causado por claves foráneas inexistentes (`FK_Productos_Categorias` y `FK_Productos_Marcas`). Al estar vacías las tablas de categorías y marcas, cualquier producto guardado arrojaba conflicto referencial. La inserción de los registros reales mediante el seed y la provisión de endpoints oficiales resuelven este problema.

### 📝 Notas Técnicas / Justificación Académica
- **Integridad Referencial en MSSQL:** La base de datos aplica restricciones estrictas de clave externa. No se permite agregar productos con IDs de categoría/marca ficticios o temporales. Al sincronizar los catálogos en base de datos mediante el script de seed y consumirlos dinámicamente desde la API, garantizamos coherencia relacional sin omitir las restricciones de integridad declaradas.
- **Uso de Fallbacks de Red:** El consumo de catálogos en el frontend mediante `Promise.all` se diseñó con tolerancia a fallos, asegurando que si algún endpoint de catálogo no responde, la UI utiliza un fallback local estático alineado con los IDs reales de la base de datos.
- **Alertas de Stock Dinámicas:** La evaluación del stock actual respecto al stock mínimo directamente en la tabla permite identificar rápidamente anomalías en inventario, aplicando una lógica semántica basada en colores (`rose-600` para advertencias, `emerald-600` para estados normales) alineada con los requisitos de usabilidad en tesis de ingeniería de sistemas.

---

## [2026-07-31] - API de Catálogos (Cantones/Sectores) y Datos Reales
**Módulo Afectado:** Backend / Frontend

### 🚀 Añadido (Added)
- Nuevo controlador `catalogos.controller.js` con endpoints GET y POST para Cantones y Sectores.
- Endpoint `GET /api/catalogos/sectores?canton=ID` con soporte de filtrado opcional por cantón.
- Nuevo archivo de rutas `catalogos.routes.js` registrado en el servidor Express.
- Script `seed.js` reescrito con patrón UPSERT (INSERT IF NOT EXISTS / UPDATE) para poblar la BD con **8 cantones** y **26 sectores** reales de la zona de Milagro, Naranjito, Yaguachi, El Triunfo, etc.

### 🔄 Modificado (Changed)
- Se reescribió `ClienteModal.jsx` para consumir los catálogos desde la API (`/api/catalogos/cantones`, `/api/catalogos/sectores`) en lugar de usar arrays hardcoded. Los `<select>` ahora muestran datos reales de la base de datos con la zona entre paréntesis (ej. "Chobo (RURAL)").
- Se actualizó `backend/src/index.js` para registrar la ruta `/api/catalogos`.

### 🐛 Corregido (Fixed)
- Se corrigió el script `seed.js` que fallaba con error FK al intentar hacer DELETE de sectores referenciados por clientes existentes. Se reemplazó la estrategia DELETE+INSERT por UPSERT individual.

### 📝 Notas Técnicas / Justificación Académica
- **Patrón UPSERT:** Se usó `IF NOT EXISTS ... INSERT ELSE UPDATE` en lugar de `MERGE` por ser más legible y portable en SQL Server. Esto permite ejecutar el seed múltiples veces sin errores de integridad referencial (idempotencia).
- **Filtrado Query String:** El endpoint de sectores acepta un parámetro `?canton=ID` opcional, lo que permite al frontend cargar solo los sectores relevantes sin traer toda la tabla. Sin embargo, en la implementación actual del modal se prefirió cargar todos los sectores una sola vez y filtrar en el cliente para reducir las llamadas HTTP.

---

## [2026-07-31] - Corrección de Error al Actualizar Clientes
**Módulo Afectado:** Backend

### 🚀 Añadido (Added)
- N/A

### 🔄 Modificado (Changed)
- N/A

### 🐛 Corregido (Fixed)
- Se corrigió el error al actualizar clientes desde el formulario del frontend. El controlador `updateCliente` intentaba convertir los campos `latitud` y `longitud` a `sql.Decimal` pero recibía `undefined` (ya que el formulario no incluye esos campos), lo cual causaba un crash en SQL Server. Se aplicó `|| null` como valor por defecto para que la BD acepte valores nulos en esos campos opcionales.
- Se aplicó la misma protección en `createCliente` y se agregó `|| null` a `telefono_principal` y `|| 'ACTIVO'` a `estado_cliente` en el método PUT para mayor robustez.

### 📝 Notas Técnicas / Justificación Académica
- **Programación Defensiva:** Cuando un formulario frontend no envía todos los campos que espera el backend, los valores llegan como `undefined`. Pasar `undefined` a `sql.Decimal()` provoca un error de tipo en el driver ODBC. La solución canónica es aplicar un valor por defecto (`null`) para que SQL Server almacene `NULL` en la columna, respetando la integridad del esquema sin requerir campos obligatorios innecesarios.

---

## [2026-07-31] - Desarrollo del Módulo de Clientes (UI/UX y Lógica CRUD Completa)
**Módulo Afectado:** Frontend

### 🚀 Añadido (Added)
- Nuevo componente `src/components/ClienteModal.jsx` con diseño profesional:
  - Overlay de cristal esmerilado (`bg-gray-900/50 backdrop-blur-sm`) reemplazando el fondo negro sólido anterior.
  - Formulario organizado en **3 secciones** con separadores visuales: "Datos Personales", "Ubicación Geográfica" y "Detalle de Dirección".
  - Campos `<select>` para **Cantón** y **Sector/Recinto** con lógica de cascada (al seleccionar un cantón, se filtran automáticamente los sectores que le pertenecen).
  - Campo de **Referencia de Ubicación** como `<textarea>` para notas del cobrador.
  - Soporte dual: el mismo modal sirve para **Crear** y **Editar** clientes, cambiando título y método HTTP (`POST` vs `PUT`) automáticamente.
  - Indicador de carga (spinner animado `Loader2`) y mensajes de error con estilo `rose`.
- Nueva página `src/pages/Clientes.jsx` con funcionalidad completa:
  - Barra de búsqueda en tiempo real filtrando por cédula o nombre, con contador de resultados.
  - Tabla con columnas: Cédula (monospace), Cliente, Sector + Cantón, Teléfono, Estado (badge `emerald` para Activo, `gray` para Inactivo) y Acciones.
  - Botones de acción con hover semántico: Editar (`indigo`) y Eliminar (`rose`) con confirmación nativa.
  - Estado vacío ilustrado (icono `Users` + mensaje contextual).
- Catálogos hardcoded temporales (`CANTONES_MOCK`, `SECTORES_MOCK`) inyectados en el modal para demostrar la funcionalidad de los selects en cascada hasta que el backend exponga sus propios endpoints de catálogos.

### 🔄 Modificado (Changed)
- Se actualizó `App.jsx` para importar y renderizar el nuevo componente `Clientes` en lugar del anterior `ClientesPage`.

### 🐛 Corregido (Fixed)
- Se corrigió el diseño visual del modal de clientes que usaba un overlay negro sólido (`bg-black bg-opacity-50`), reemplazándolo con el estándar enterprise de cristal esmerilado (`bg-gray-900/50 backdrop-blur-sm`).

### 📝 Notas Técnicas / Justificación Académica
- **Patrón Crear/Editar Unificado:** Se implementó un único componente `ClienteModal` que detecta mediante la prop `clienteToEdit` si debe operar en modo creación (POST) o edición (PUT). Esto reduce la duplicación de código y sigue el principio DRY.
- **Select en Cascada (Dependent Dropdowns):** El filtrado dinámico de sectores según el cantón seleccionado demuestra el patrón de estado derivado usando `useEffect` con dependencia en `form.id_canton`. Este es un patrón fundamental en formularios con relaciones jerárquicas (Cantón → Sector).
- **Separación de Responsabilidades:** `Clientes.jsx` (página) maneja el estado global y las llamadas API, mientras `ClienteModal.jsx` (componente) encapsula exclusivamente la lógica del formulario. Esto facilita el testing unitario y la escalabilidad del módulo.

---

## [2026-07-31] - Rediseño Completo del Dashboard y Layout (Enterprise SaaS UI)
**Módulo Afectado:** Frontend

### 🚀 Añadido (Added)
- Nuevo layout con **Sidebar lateral blanco** (`bg-white border-r border-gray-200`) que reemplaza la barra de navegación superior con color sólido. El sidebar incluye:
  - Logo corporativo con ícono cuadrado redondeado (`bg-indigo-600 rounded-lg`).
  - Ítems de navegación con estado activo sutil (`bg-indigo-50 text-indigo-700`).
  - Sección inferior con "Configuración" y "Cerrar Sesión".
  - Comportamiento responsive: en móvil se oculta como drawer lateral con overlay y botón hamburguesa.
- Componente interno `KpiCard` reutilizable que encapsula la lógica visual de cada tarjeta métrica (ícono, valor, badge de tendencia).
- Botón "Descargar Reporte" en el header del Dashboard con estilo primario (`bg-indigo-600`).
- Badges de tendencia con lógica condicional: flechas verdes (`emerald`) para tendencias positivas y rojas (`rose`) para negativas, aplicados como `rounded-full` pills.
- Tabla de alertas con badge de conteo (`3 alertas`) y colores semánticos por severidad de mora (>40 días = `rose`, 30-40 = `amber`).

### 🔄 Modificado (Changed)
- Se reescribió completamente `App.jsx` eliminando el navbar con color sólido Índigo y reemplazándolo por un sidebar vertical minimalista.
- Se reescribió completamente `Dashboard.jsx` aplicando un design system estricto inspirado en Stripe/Linear/Vercel:
  - Fondo `bg-gray-50`, superficies `bg-white`, bordes `border-gray-200`, sombras `shadow-sm`, esquinas `rounded-xl`.
  - Tipografía con jerarquía visual: KPIs en `text-3xl font-bold`, subtítulos en `text-sm text-gray-500`.
  - Regla 60-30-10 aplicada (gris claro / blanco / índigo como acento).

### 🐛 Corregido (Fixed)
- N/A

### 📝 Notas Técnicas / Justificación Académica
- **Patrón Sidebar:** Se adoptó el patrón de navegación lateral blanco (utilizado por Stripe Dashboard, Vercel, Linear) en lugar del topbar con color sólido, ya que los estudios de UX para aplicaciones SaaS B2B demuestran que los sidebars mejoran la navegabilidad en sistemas con múltiples módulos funcionales.
- **Componentización de KPIs:** Se extrajo un sub-componente `KpiCard` dentro del mismo archivo para demostrar el principio DRY (Don't Repeat Yourself). Los datos de los KPIs se declararon como un array de objetos fuera del componente, facilitando su futura conexión con datos reales del backend.
- **Responsive Design:** El sidebar implementa un patrón "off-canvas" para dispositivos móviles mediante `transform translate-x` y un overlay semi-transparente con `backdrop-blur-sm`, garantizando usabilidad en todas las resoluciones.

---

## [2026-07-31] - Diseño UI/UX del Dashboard Principal
**Módulo Afectado:** Frontend

### 🚀 Añadido (Added)
- Se desarrolló la página `src/pages/Dashboard.jsx` actuando como pantalla principal (Resumen Gerencial).
- Se implementaron 4 tarjetas de KPIs interactivos usando iconos vectorizados (`lucide-react`) para "Cartera Activa", "Índice de Morosidad", "Recaudación de Hoy" y "Clientes Activos".
- Se crearon dos contenedores (placeholders) listos para integrar los gráficos de "Flujo de Cobranza" y "Estado de Cartera por Zona".
- Se diseñó una tabla rápida en la parte inferior llamada "Alertas de Cobranza (Cuotas Vencidas)" con 3 filas de datos simulados y badges para indicar los días de mora.
- Se implementó un sistema de navegación simple mediante un navbar en `App.jsx` para cambiar entre el Dashboard y la página de Clientes.

### 🔄 Modificado (Changed)
- Se modificó `App.jsx` para incorporar un estado reactivo (`currentView`) que actúa como enrutador ligero entre las vistas.

### 🐛 Corregido (Fixed)
- N/A

### 📝 Notas Técnicas / Justificación Académica
- **Regla de Diseño 60-30-10:** Se aplicó estrictamente la proporción de colores solicitada para aplicaciones empresariales. El fondo dominante es `bg-slate-50` (60%), las tarjetas o superficies son `bg-white` (30%) y los detalles interactivos o jerárquicos emplean la familia `indigo` (10%). 
- **Colores Semánticos y Tipografía:** Los indicadores de alerta (Morosidad) utilizan tonos rojos, mientras que los valores positivos (Recaudación) usan verde. Todo el componente fue orquestado con CSS Grid de Tailwind (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`) para garantizar completa adaptabilidad (responsive design) en pantallas móviles, tablets y escritorios.

---

## [2026-07-31] - Migración a Tailwind CSS v4 en Frontend
**Módulo Afectado:** Frontend

### 🚀 Añadido (Added)
- Instalación de `@tailwindcss/vite` para integrarse directamente con la compilación de Vite siguiendo los nuevos estándares de Tailwind v4.

### 🔄 Modificado (Changed)
- Se actualizó `vite.config.js` para incluir e invocar el plugin oficial de Tailwind en lugar de depender de PostCSS.
- Se migró la paleta de colores personalizados al bloque `@theme` dentro de `src/index.css` (`--color-corporativo`, `--color-corporativo-light`, `--color-corporativo-dark`).
- Se actualizaron las directivas de importación de CSS (de `@tailwind base` a `@import "tailwindcss"`).
- Se eliminaron los archivos obsoletos `tailwind.config.js` y `postcss.config.js`.

### 🐛 Corregido (Fixed)
- Se solucionó el error de compilación de PostCSS (`It looks like you're trying to use tailwindcss directly as a PostCSS plugin`) que impedía arrancar el servidor frontend por problemas de compatibilidad con Tailwind v4.
- Se corrigió el error `TypeError: The "config.server" property is required and must be of type string.` que ocasionó que el backend se caiga tras registrar las rutas. Esto ocurría porque los controladores (`clientes.controller.js` y `productos.controller.js`) importaban el paquete base `mssql`, lo cual sobreescribía globalmente el driver de base de datos de Express a `tedious` (el cual no soporta Autenticación de Windows) provocando fallos al interpretar el `connectionString`. Se cambió el import en ambos controladores hacia `mssql/msnodesqlv8.js`.
- Se corrigió el error `Error al guardar el cliente` en la vista de Frontend que retornaba un error 404 (Not Found) al invocar la API. Esto se debió a que los controladores y rutas originales (`/api/clientes`, `/api/productos`) no se migraron correctamente al subdirectorio `backend/src/` cuando se encapsuló el backend en su propia carpeta. Las rutas fueron movidas y registradas en `backend/src/index.js`.
- Adicionalmente (en la ejecución anterior), se resolvió el fallo de integridad referencial (Foreign Key) inyectando catálogos semilla (`seed.js`) en la tabla `Sectores`.

### 📝 Notas Técnicas / Justificación Académica
- Tailwind CSS v4 introdujo un motor reescrito desde cero enfocado en velocidad y configuraciones simplificadas directamente desde CSS nativo (CSS variables). La adopción de `@tailwindcss/vite` nos permite aprovechar este rendimiento sin el *overhead* de configurar PostCSS manualmente.

---

## [2026-07-31] - Inicialización del Frontend (React + Vite) y Vista de Clientes
**Módulo Afectado:** Frontend

### 🚀 Añadido (Added)
- Subdirectorio `frontend` con un proyecto nuevo inicializado mediante React + Vite.
- Configuración base de `Tailwind CSS`, `PostCSS` y `Autoprefixer` para el manejo de estilos utilitarios y diseño corporativo.
- Dependencias `axios` instaladas para consumo de API y `lucide-react` para iconografía vectorizada.
- Instancia centralizada de Axios en `src/services/api.js` conectada a `http://localhost:3000/api`.
- Componente `TablaClientes.jsx` que renderiza la lista de clientes con badges de estado y estilo premium.
- Componente `ModalCliente.jsx` que contiene el formulario de alta de clientes conectado al POST `/api/clientes`.
- Página principal `ClientesPage.jsx` con buscador en tiempo real por nombre/cédula y manejo de estado.
- Limpieza e inyección de la vista de clientes en `App.jsx`.

### 🔄 Modificado (Changed)
- N/A

### 🐛 Corregido (Fixed)
- N/A

### 📝 Notas Técnicas / Justificación Académica
- **Elección del Stack:** Se eligió `Vite` sobre Create React App debido a su servidor de desarrollo ultra-rápido basado en esbuild, lo cual reduce drásticamente los tiempos de compilación.
- **Arquitectura de Componentes:** Se estructuró el código bajo el patrón de `pages/` y `components/`. Las páginas (`ClientesPage`) manejan el estado global y las llamadas a la API, mientras que los componentes (`TablaClientes`, `ModalCliente`) son puramente presentacionales y modulares, garantizando alta cohesión y bajo acoplamiento (Principios SOLID).
- **Diseño de Interfaz:** Se optó por `Tailwind CSS` en lugar de CSS tradicional para crear un sistema de diseño consistente con paleta de colores corporativos (Azul/Gris). La búsqueda reactiva se implementó en el cliente mediante un `useEffect` para minimizar las llamadas innecesarias al backend.

---

## [2026-07-31] - Configuración de Autenticación de Windows para SQL Server
**Módulo Afectado:** Base de Datos / Backend

### 🚀 Añadido (Added)
- Instalación de la dependencia `msnodesqlv8` para soportar Autenticación Integrada de Windows en el driver `mssql`.

### 🔄 Modificado (Changed)
- Se actualizó el archivo `backend/src/config/db.js` para importar `mssql/msnodesqlv8.js`.
- Se reemplazó el objeto de configuración por un *Connection String* explícito: `Driver={ODBC Driver 17 for SQL Server};Server=...;Database=...;Trusted_Connection=yes;`.

### 🐛 Corregido (Fixed)
- Se solucionó el error `No se encuentra el nombre del origen de datos y no se especificó ningún controlador predeterminado` forzando al sistema a utilizar explícitamente el `ODBC Driver 17 for SQL Server` que está instalado en el equipo.
- Se corrigió un error de sintaxis en el método `sql.connect` donde la cadena de conexión se pasaba como un string directo en vez de un objeto `{ connectionString }`, lo cual provocaba que el driver ignorara la configuración.

### 📝 Notas Técnicas / Justificación Académica
- Para asegurar el cumplimiento de las políticas de seguridad en entornos corporativos locales, se transicionó de la autenticación de SQL Server a la Autenticación Integrada de Windows. Esto evita almacenar contraseñas en texto plano dentro del archivo `.env` y delega el control de acceso a los servicios de Active Directory o cuentas locales de Windows.

---

## [2026-07-31] - Inicialización del Backend y Conexión a Base de Datos
**Módulo Afectado:** Backend

### 🚀 Añadido (Added)
- Nueva carpeta `backend` en la raíz del proyecto para aislar el entorno Node.js.
- Inicialización de proyecto con `package.json` (`"type": "module"`).
- Instalación de dependencias: `express`, `cors`, `dotenv`, `mssql`, y `nodemon`.
- Archivo `src/index.js` para inicializar el servidor Express en el puerto 3000 con middlewares básicos.
- Archivo de entorno `.env` en `backend/` con credenciales base.
- Archivo `src/config/db.js` con un pool de conexiones estructurado (`mssql`) exportado.
- Script `"dev"` en `package.json` para levantar el servidor usando `nodemon`.

### 🔄 Modificado (Changed)
- N/A

### 🐛 Corregido (Fixed)
- N/A

### 📝 Notas Técnicas / Justificación Académica
- Se movió y restructuró la inicialización del backend dentro de un subdirectorio dedicado (`backend/`) para mantener la arquitectura de monorepo y evitar conflictos con posibles capas de frontend (ej. React) que se construyan a futuro.
- Se implementó un "Pool" en `db.js` que define `max: 10` conexiones simultáneas y maneja `idleTimeoutMillis`. Esto optimiza la disponibilidad y estabilidad del servidor en entornos de alta concurrencia, evitando agotar las conexiones a SQL Server por transacciones simultáneas de los usuarios del sistema.

---

## [2026-07-31] - Inicialización de Arquitectura Backend y Base de Datos Fase 1
**Módulo Afectado:** Backend / Base de Datos

### 🚀 Añadido (Added)
- Script SQL consolidado (`database.sql`) con 10 tablas interrelacionadas (Catálogos, Clientes, Productos, Ventas, Inventario, Cuotas).
- Proyecto Node.js configurado con Express y ES Modules (`"type": "module"`).
- Pool de conexiones a Microsoft SQL Server utilizando la librería nativa `mssql` (`src/config/db.js`).
- Archivo de entorno `.env` para la gestión segura de las credenciales.
- Módulo de Clientes: Controladores y Rutas para realizar operaciones CRUD básicas.
- Módulo de Productos: Controladores y Rutas para realizar operaciones CRUD básicas.
- `README.md` principal con instrucciones para correr la base de datos y levantar el proyecto.

### 🔄 Modificado (Changed)
- N/A (Implementación Inicial)

### 🐛 Corregido (Fixed)
- N/A

### 📝 Notas Técnicas / Justificación Académica
- **Arquitectura Multicapa:** Se dividió el código en `routes/` (enrutamiento) y `controllers/` (lógica de negocio). Esta separación de responsabilidades asegura un código mantenible y cumple con principios SOLID de diseño de software.
- **Rendimiento de Base de Datos:** Se omitió el uso de ORMs pesados optando por sentencias SQL crudas vía `mssql`, garantizando la mayor velocidad posible en las peticiones. Además, el uso de un Pool de Conexiones previene la sobrecarga al no abrir y cerrar conexiones por cada solicitud.
- **Optimización de Consultas:** Para los listados de Clientes y Productos, se usaron sentencias `LEFT JOIN` a los catálogos correspondientes (Sectores, Marcas, Categorías). Esto permite poblar la vista frontend con información descriptiva completa en un solo viaje a la base de datos, mitigando cuellos de botella y resolviendo el problema de las consultas N+1.










## [2026-08-07] - Configuración de Inicio para Render
**Módulo Afectado:** Backend / Infraestructura

### 🚀 Añadido (Added)
- Script de inicio `start` en `backend/package.json` para permitir el despliegue automático en Render.

### 📝 Notas Técnicas / Justificación Académica
- Se requería definir el comando de inicio en package.json (`node src/index.js`) ya que Render por defecto intenta ejecutar `node index.js` en la raíz, fallando al no encontrar el módulo de entrada.

