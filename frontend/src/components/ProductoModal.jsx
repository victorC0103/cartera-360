import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import api from '../services/api';

const MOCK_CATEGORIAS = [
  { id_categoria: 1, nombre: 'Refrigeradoras' },
  { id_categoria: 2, nombre: 'Lavadoras' },
  { id_categoria: 3, nombre: 'Televisores' },
  { id_categoria: 4, nombre: 'Cocinas' },
  { id_categoria: 5, nombre: 'Aires Acondicionados' },
  { id_categoria: 6, nombre: 'Pequeños Electrodomésticos' },
];

const MOCK_MARCAS = [
  { id_marca: 1, nombre: 'Samsung' },
  { id_marca: 2, nombre: 'LG' },
  { id_marca: 3, nombre: 'Indurama' },
  { id_marca: 4, nombre: 'Mabe' },
  { id_marca: 5, nombre: 'Sony' },
  { id_marca: 6, nombre: 'Whirlpool' },
  { id_marca: 7, nombre: 'Panasonic' },
];

const INITIAL_FORM = {
  codigo_sku: '',
  modelo: '',
  descripcion_corta: '',
  id_categoria: '',
  id_marca: '',
  costo_adquisicion: '',
  precio_venta_contado: '',
  stock_actual: '0',
  stock_minimo: '5',
};

export default function ProductoModal({ isOpen, onClose, onSaved, productoToEdit }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [categorias, setCategorias] = useState(MOCK_CATEGORIAS);
  const [marcas, setMarcas] = useState(MOCK_MARCAS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!productoToEdit;

  // Cargar categorías y marcas desde la API con fallback
  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const [catRes, marRes] = await Promise.all([
          api.get('/categorias'),
          api.get('/marcas'),
        ]);
        if (catRes.data && catRes.data.length > 0) {
          setCategorias(catRes.data);
        }
        if (marRes.data && marRes.data.length > 0) {
          setMarcas(marRes.data);
        }
      } catch (err) {
        console.log('Usando catálogos mock predeterminados para categorías/marcas.', err);
      }
    };
    fetchCatalogos();
  }, []);

  // Poblar formulario en modo edición
  useEffect(() => {
    if (productoToEdit) {
      setForm({
        codigo_sku: productoToEdit.codigo_sku || '',
        modelo: productoToEdit.modelo || '',
        descripcion_corta: productoToEdit.descripcion_corta || '',
        id_categoria: productoToEdit.id_categoria_fk ? String(productoToEdit.id_categoria_fk) : '',
        id_marca: productoToEdit.id_marca_fk ? String(productoToEdit.id_marca_fk) : '',
        costo_adquisicion: productoToEdit.costo_adquisicion !== undefined ? String(productoToEdit.costo_adquisicion) : '',
        precio_venta_contado: productoToEdit.precio_venta_contado !== undefined ? String(productoToEdit.precio_venta_contado) : '',
        stock_actual: productoToEdit.stock_actual !== undefined ? String(productoToEdit.stock_actual) : '0',
        stock_minimo: productoToEdit.stock_minimo !== undefined ? String(productoToEdit.stock_minimo) : '5',
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setError('');
  }, [productoToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Preparar el payload conforme a lo esperado por la API (con llaves foráneas fk)
    const payload = {
      codigo_sku: form.codigo_sku.trim(),
      id_categoria_fk: Number(form.id_categoria),
      id_marca_fk: Number(form.id_marca),
      modelo: form.modelo.trim(),
      precio_venta_contado: parseFloat(form.precio_venta_contado),
      costo_adquisicion: parseFloat(form.costo_adquisicion),
      stock_actual: Number(form.stock_actual),
      // Campos extra solicitados que enviamos al backend (y pueden persistir si se añade soporte)
      stock_minimo: Number(form.stock_minimo),
      descripcion_corta: form.descripcion_corta.trim(),
    };

    // Validaciones básicas de negocio en el cliente
    if (!payload.codigo_sku) {
      setError('El SKU es obligatorio.');
      setLoading(false);
      return;
    }
    if (!payload.id_categoria_fk) {
      setError('Debe seleccionar una categoría.');
      setLoading(false);
      return;
    }
    if (!payload.id_marca_fk) {
      setError('Debe seleccionar una marca.');
      setLoading(false);
      return;
    }
    if (isNaN(payload.costo_adquisicion) || payload.costo_adquisicion < 0) {
      setError('El costo de adquisición debe ser un número positivo.');
      setLoading(false);
      return;
    }
    if (isNaN(payload.precio_venta_contado) || payload.precio_venta_contado < 0) {
      setError('El precio de venta debe ser un número positivo.');
      setLoading(false);
      return;
    }

    try {
      if (isEditing) {
        await api.put(`/productos/${productoToEdit.id_producto}`, payload);
      } else {
        await api.post('/productos', payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Ocurrió un error al guardar el producto.');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = 'w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white';
  const disabledClasses = 'w-full border border-gray-200 rounded-md shadow-sm px-3 py-2 text-sm text-gray-400 bg-gray-50 cursor-not-allowed';
  const labelClasses = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
              {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Complete los detalles del artículo de inventario.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Sección 1: Identificación del Producto */}
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3">Identificación</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Código SKU <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  name="codigo_sku"
                  value={form.codigo_sku}
                  onChange={handleChange}
                  placeholder="Ej: REF-SAM-380"
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Modelo <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  name="modelo"
                  value={form.modelo}
                  onChange={handleChange}
                  placeholder="Ej: RT38K5930SL"
                  className={inputClasses}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClasses}>Descripción Corta</label>
                <textarea
                  name="descripcion_corta"
                  value={form.descripcion_corta}
                  onChange={handleChange}
                  placeholder="Detalles sobre el color, capacidad o especificaciones del artículo..."
                  rows={2}
                  className={inputClasses}
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Clasificación */}
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3">Clasificación</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Categoría <span className="text-rose-500">*</span></label>
                <select
                  required
                  name="id_categoria"
                  value={form.id_categoria}
                  onChange={handleChange}
                  className={inputClasses}
                >
                  <option value="">Seleccione una categoría</option>
                  {categorias.map(cat => (
                    <option key={cat.id_categoria} value={cat.id_categoria}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Marca <span className="text-rose-500">*</span></label>
                <select
                  required
                  name="id_marca"
                  value={form.id_marca}
                  onChange={handleChange}
                  className={inputClasses}
                >
                  <option value="">Seleccione una marca</option>
                  {marcas.map(m => (
                    <option key={m.id_marca} value={m.id_marca}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sección 3: Datos Financieros */}
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3">Datos Financieros</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Costo Adquisición ($) <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  name="costo_adquisicion"
                  value={form.costo_adquisicion}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Precio Venta Contado ($) <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  name="precio_venta_contado"
                  value={form.precio_venta_contado}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={inputClasses}
                />
              </div>
            </div>
          </div>

          {/* Sección 4: Control de Stock */}
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3">Control de Stock</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Stock Actual</label>
                {isEditing ? (
                  <input
                    type="number"
                    disabled
                    readOnly
                    value={form.stock_actual}
                    className={disabledClasses}
                  />
                ) : (
                  <input
                    type="number"
                    min="0"
                    name="stock_actual"
                    value={form.stock_actual}
                    onChange={handleChange}
                    className={inputClasses}
                  />
                )}
              </div>
              <div>
                <label className={labelClasses}>Stock Mínimo</label>
                <input
                  type="number"
                  min="0"
                  name="stock_minimo"
                  value={form.stock_minimo}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </div>
            </div>
          </div>
        </form>

        {/* Acciones del pie */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Producto
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
