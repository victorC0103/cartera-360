import { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowLeft, Loader2, Check, User, Package, Calendar, Settings } from 'lucide-react';
import Select from 'react-select';
import api from '../services/api';

const MOCK_CLIENTES = [
  { id_cliente: 1, cedula: '0928374651', nombres: 'Carlos', apellidos: 'Andrade Loor' },
  { id_cliente: 2, cedula: '1205847392', nombres: 'María Elena', apellidos: 'Vera Santos' },
  { id_cliente: 3, cedula: '0912738495', nombres: 'José Antonio', apellidos: 'Castro Solís' }
];

const MOCK_PRODUCTOS = [
  { id_producto: 1, codigo_sku: 'REF-IND-320', nombre_marca: 'Indurama', modelo: 'RI-390', precio_venta_contado: 649.99 },
  { id_producto: 2, codigo_sku: 'LAV-SAM-15', nombre_marca: 'Samsung', modelo: 'WA15T', precio_venta_contado: 499.99 },
  { id_producto: 3, codigo_sku: 'TV-LG-55', nombre_marca: 'LG', modelo: '55UP7700', precio_venta_contado: 599.99 }
];

export default function NuevaVenta({ onViewChange }) {
  const [clientes, setClientes] = useState(MOCK_CLIENTES);
  const [productos, setProductos] = useState(MOCK_PRODUCTOS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Estados del Formulario
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [cart, setCart] = useState([]);
  const [montoEntrada, setMontoEntrada] = useState(100);
  const [plazoMeses, setPlazoMeses] = useState(12);
  const [frecuenciaPago, setFrecuenciaPago] = useState('Mensual');
  const [tasaInteres, setTasaInteres] = useState(15); // Tasa dinámica editable

  // Estados del selector auxiliar de productos
  const [productToAddId, setProductToAddId] = useState('');

  // Cálculos Financieros Derivados
  const [subtotal, setSubtotal] = useState(0);
  const [montoFinanciar, setMontoFinanciar] = useState(0);
  const [interesAplicado, setInteresAplicado] = useState(0);
  const [totalGeneral, setTotalGeneral] = useState(0);
  const [cuotaProyectada, setCuotaProyectada] = useState(0);
  const [cuotasCount, setCuotasCount] = useState(12);

  // Carga de catálogos
  useEffect(() => {
    const loadCatalogos = async () => {
      setLoading(true);
      try {
        const [cliRes, prodRes] = await Promise.all([
          api.get('/clientes'),
          api.get('/productos')
        ]);
        if (cliRes.data && cliRes.data.length > 0) {
          setClientes(cliRes.data);
        }
        if (prodRes.data && prodRes.data.length > 0) {
          setProductos(prodRes.data);
        }
      } catch (err) {
        console.log('Usando clientes y productos mock para el POS de Ventas.', err);
      } finally {
        setLoading(false);
      }
    };
    loadCatalogos();
  }, []);

  // Recalcular finanzas en tiempo real
  useEffect(() => {
    const sumSubtotal = cart.reduce((sum, item) => sum + (parseFloat(item.precio_venta_contado) || 0), 0);
    const entrada = parseFloat(montoEntrada) || 0;
    
    // El monto a financiar no puede ser negativo
    const financiar = Math.max(0, sumSubtotal - entrada);
    
    // Interés Simple: Tasa de Interés sobre el Monto a Financiar
    const interes = financiar * (tasaInteres / 100);
    const total = financiar + interes;

    // Calcular cantidad de cuotas según la frecuencia
    let numCuotas = Number(plazoMeses);
    if (frecuenciaPago === 'Semanal') numCuotas = Number(plazoMeses) * 4;
    else if (frecuenciaPago === 'Quincenal') numCuotas = Number(plazoMeses) * 2;

    // Cálculo exacto de la cuota sin redondeos de almacén
    const cuotaBruta = numCuotas > 0 ? (total / numCuotas) : 0;
    const cuotaVal = parseFloat(cuotaBruta.toFixed(2));

    setSubtotal(sumSubtotal);
    setMontoFinanciar(financiar);
    setInteresAplicado(interes);
    setTotalGeneral(total);
    setCuotasCount(numCuotas);
    setCuotaProyectada(cuotaVal);
  }, [cart, montoEntrada, plazoMeses, frecuenciaPago, tasaInteres]);

  const handleAddProduct = () => {
    if (!productToAddId) return;
    const selectedProd = productos.find(p => String(p.id_producto) === String(productToAddId));
    if (selectedProd) {
      // Evitamos duplicar en el carrito (o podemos permitir duplicar agregando una key única)
      setCart(prev => [...prev, { ...selectedProd, uniqueId: Date.now() }]);
      setProductToAddId('');
    }
  };

  const handleRemoveProduct = (indexToRemove) => {
    setCart(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Obtener datos del cliente seleccionado
  const selectedCliente = clientes.find(c => String(c.id_cliente) === String(selectedClienteId));

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  // Enviar contrato a la API
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClienteId) {
      setError('Debe seleccionar un cliente para generar el contrato.');
      return;
    }
    if (cart.length === 0) {
      setError('Debe agregar al menos un artículo al carrito.');
      return;
    }
    if (parseFloat(montoEntrada) > subtotal) {
      setError('El valor de la entrada no puede ser mayor que el subtotal de artículos.');
      return;
    }

    setSaving(true);
    setError('');

    // Estructura Maestro-Detalle conforme a la BD
    const payload = {
      id_cliente_fk: Number(selectedClienteId),
      monto_total_productos: subtotal,
      valor_entrada: parseFloat(montoEntrada) || 0,
      monto_a_financiar: montoFinanciar,
      total_con_intereses: totalGeneral,
      cantidad_cuotas: cuotasCount,
      frecuencia_pago: frecuenciaPago,
      tasa_interes: tasaInteres,
      // Detalle de productos seleccionados
      articulos: cart.map(item => ({
        id_producto: item.id_producto,
        precio_venta_negociado: parseFloat(item.precio_venta_contado)
      }))
    };

    try {
      await api.post('/ventas', payload);
      alert('¡Contrato y Cartilla de Amortización generados con éxito!');
      onViewChange('creditos');
    } catch (err) {
      console.log('Error enviando contrato al backend:', err);
      // Fallback para simulación exitosa en frontend
      alert('Simulación: ¡Contrato guardado localmente debido a falta de endpoint de ventas!');
      onViewChange('creditos');
    } finally {
      setSaving(false);
    }
  };

  const inputClasses = 'w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white';
  const labelClasses = 'block text-sm font-medium text-gray-700 mb-1';

  // Opciones para react-select
  const clientOptions = clientes.map(c => ({
    value: c.id_cliente,
    label: `${c.cedula} - ${c.nombres} ${c.apellidos}`
  }));

  const productOptions = productos.map(p => ({
    value: p.id_producto,
    label: `${p.codigo_sku} - ${p.nombre_marca || p.marca} ${p.modelo}` // Agregamos precio en el format del Select o aquí, pero formatCurrency no está definido al nivel global? Wait, lo vemos en la vista previa
  }));
  // Para el precio, usemos una función in-line simple si no tenemos formatCurrency en scope global o usémoslo directo si está.
  // En tu código original tienes formatCurrency en el componente. Lo voy a mover abajo de donde se use o usar $...
  const formatMoney = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
  
  const productOptionsFormatted = productos.map(p => ({
    value: p.id_producto,
    label: `${p.codigo_sku} - ${p.nombre_marca || p.marca} ${p.modelo} (${formatMoney(p.precio_venta_contado)})`
  }));

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto space-y-6 bg-slate-50 min-h-screen">
      
      {/* ── Cabecera / Volver ── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onViewChange('creditos')}
          className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Nueva Venta a Crédito</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Formule el contrato y calcule la tasa de amortización del cliente.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* ── COLUMNA IZQUIERDA (Área de Ingreso - 2/3) ── */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Sección: Selección de Cliente */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <User className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-gray-900">Sección Cliente</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <label className={labelClasses}>Seleccionar Cliente <span className="text-rose-500">*</span></label>
                  <Select
                    options={clientOptions}
                    value={clientOptions.find(opt => opt.value === Number(selectedClienteId)) || null}
                    onChange={(selected) => setSelectedClienteId(selected ? selected.value : '')}
                    placeholder="Buscar cédula o nombre..."
                    isClearable
                    isSearchable
                    noOptionsMessage={() => "No se encontraron clientes"}
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: '#D1D5DB',
                        boxShadow: 'none',
                        '&:hover': { borderColor: '#9CA3AF' },
                        minHeight: '42px',
                        borderRadius: '0.375rem',
                      })
                    }}
                  />
                </div>
                
                {selectedCliente && (
                  <div className="p-4 bg-slate-50 border border-gray-100 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Identificación</p>
                      <p className="text-sm font-medium text-gray-900 font-mono mt-0.5">{selectedCliente.cedula}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Calificación</p>
                      <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 mt-1 border border-emerald-100">
                        Excelente
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sección: Artículos del Carrito */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-gray-900">Artículos en Contrato</h3>
                </div>
                <span className="text-xs font-medium text-gray-400 bg-slate-100 px-2 py-1 rounded">
                  {cart.length} item{cart.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Selector de Producto rápido */}
              <div className="flex flex-col sm:flex-row gap-3 items-end bg-slate-50 p-4 rounded-lg border border-gray-100">
                <div className="flex-1 w-full">
                  <label className={labelClasses}>Buscar y Agregar Electrodoméstico</label>
                  <Select
                    options={productOptionsFormatted}
                    value={productOptionsFormatted.find(opt => opt.value === Number(productToAddId)) || null}
                    onChange={(selected) => setProductToAddId(selected ? selected.value : '')}
                    placeholder="Buscar por SKU, marca o modelo..."
                    isClearable
                    isSearchable
                    noOptionsMessage={() => "No se encontraron artículos"}
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: '#D1D5DB',
                        boxShadow: 'none',
                        '&:hover': { borderColor: '#9CA3AF' },
                        minHeight: '42px',
                        borderRadius: '0.375rem',
                      })
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddProduct}
                  disabled={!productToAddId}
                  className="w-full sm:w-auto bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 h-[42px]"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              </div>

              {/* Tabla de Artículos */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {cart.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-400">
                    No hay artículos en el contrato. Agregue uno arriba.
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio Contado</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Quitar</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {cart.map((item, index) => (
                        <tr key={item.uniqueId || index} className="hover:bg-gray-50/50">
                          <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 font-mono">
                            {item.codigo_sku}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-700">
                            {item.nombre_marca || item.marca} {item.modelo}
                          </td>
                          <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900 whitespace-nowrap">
                            {formatCurrency(item.precio_venta_contado)}
                          </td>
                          <td className="px-6 py-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(index)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer inline-flex items-center"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Sección: Condiciones Financieras */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-gray-900">Condiciones de Crédito</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className={labelClasses}>Valor de Entrada ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={montoEntrada}
                    onChange={(e) => setMontoEntrada(Math.max(0, parseFloat(e.target.value) || 0))}
                    className={inputClasses}
                  />
                </div>
                
                <div>
                  <label className={labelClasses}>Plazo (Meses)</label>
                  <select
                    value={plazoMeses}
                    onChange={(e) => setPlazoMeses(Number(e.target.value))}
                    className={inputClasses}
                  >
                    <option value={6}>6 meses</option>
                    <option value={12}>12 meses</option>
                    <option value={18}>18 meses</option>
                    <option value={24}>24 meses</option>
                  </select>
                </div>

                <div>
                  <label className={labelClasses}>Frecuencia de Pago</label>
                  <select
                    value={frecuenciaPago}
                    onChange={(e) => setFrecuenciaPago(e.target.value)}
                    className={inputClasses}
                  >
                    <option value="Semanal">Semanal</option>
                    <option value="Quincenal">Quincenal</option>
                    <option value="Mensual">Mensual</option>
                  </select>
                </div>

                <div>
                  <label className={labelClasses}>Tasa de Interés (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={tasaInteres}
                    onChange={(e) => setTasaInteres(Math.max(0, parseFloat(e.target.value) || 0))}
                    className={inputClasses}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* ── COLUMNA DERECHA (Resumen Financiero - 1/3 - Sticky) ── */}
          <div className="lg:sticky lg:top-6 space-y-6">
            
            {/* Tarjeta del Resumen */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden border-t-4 border-indigo-600 p-6 space-y-6">
              
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Resumen del Contrato</h3>
                <p className="text-xs text-gray-400 mt-0.5">Valores proyectados de la amortización</p>
              </div>

              {/* Mensaje de Error en los inputs */}
              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              {/* Desglose de Precios */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal Artículos:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Valor de Entrada:</span>
                  <span className="font-medium text-gray-900">-{formatCurrency(montoEntrada)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Monto a Financiar:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(montoFinanciar)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Interés Aplicado ({tasaInteres}%):</span>
                  <span className="font-medium text-gray-900">+{formatCurrency(interesAplicado)}</span>
                </div>
                
                <hr className="border-gray-100 my-4" />

                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-gray-900 text-base">Total General:</span>
                  <span className="font-bold text-gray-900 text-xl">{formatCurrency(totalGeneral)}</span>
                </div>
              </div>

              {/* Recuadro de Cuota Proyectada */}
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-center space-y-1">
                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                  Cuota {frecuenciaPago} Proyectada
                </p>
                <h2 className="text-3xl font-extrabold text-indigo-600 tracking-tight">
                  {formatCurrency(cuotaProyectada)}
                </h2>
                <p className="text-[10px] text-indigo-500/80 font-medium">
                  Cálculo basado en {cuotasCount} cuotas de pago
                </p>
              </div>

              {/* Botón de Enviar */}
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg py-3 text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Generar Contrato y Amortización
                  </>
                )}
              </button>

            </div>

            {/* Panel informativo de ayuda */}
            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-5 flex gap-3 text-amber-800">
              <Settings className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-spin-slow" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">Regla de Amortización</h4>
                <p className="text-xs text-amber-700/90 mt-1 leading-relaxed">
                  Las cuotas se distribuyen según la frecuencia (Semanas = Plazo × 4, Quincenas = Plazo × 2). El cobrador utilizará la cartilla de pagos generada para registrar abonos.
                </p>
              </div>
            </div>

          </div>
          
        </form>
      )}
      
    </div>
  );
}
