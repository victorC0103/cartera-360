import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Loader2, Package, AlertTriangle, DollarSign, CheckCircle } from 'lucide-react';
import api from '../services/api';
import ProductoModal from '../components/ProductoModal';
import Pagination from '../components/Pagination';

const MOCK_CATEGORIAS = [
  { id_categoria: 1, nombre: 'Refrigeradoras' },
  { id_categoria: 2, nombre: 'Lavadoras' },
  { id_categoria: 3, fontName: 'Televisores', nombre: 'Televisores' },
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

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState(MOCK_CATEGORIAS);
  const [marcas, setMarcas] = useState(MOCK_MARCAS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [productoToEdit, setProductoToEdit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
      console.log('Usando catálogos mock para filtros en Inventario.', err);
    }
  };

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/productos');
      setProductos(data);
    } catch (err) {
      console.error('Error cargando productos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogos();
    fetchProductos();
  }, []);

  const handleEdit = (producto) => {
    setProductoToEdit(producto);
    setModalOpen(true);
  };

  const handleNew = () => {
    setProductoToEdit(null);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este producto del inventario?')) return;
    try {
      await api.delete(`/productos/${id}`);
      fetchProductos();
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      alert('Error al eliminar el producto. Podría estar asociado a ventas existentes.');
    }
  };

  // Ayudantes para mapear nombres de categoría y marca si no vienen resueltos del backend
  const getCategoriaNombre = (prod) => {
    if (prod.nombre_categoria) return prod.nombre_categoria;
    const cat = categorias.find(c => c.id_categoria === prod.id_categoria_fk);
    return cat ? cat.nombre : 'Sin categoría';
  };

  const getMarcaNombre = (prod) => {
    if (prod.nombre_marca) return prod.nombre_marca;
    const mar = marcas.find(m => m.id_marca === prod.id_marca_fk);
    return mar ? mar.nombre : 'Sin marca';
  };

  // Filtrado de productos en memoria
  const filteredProductos = productos.filter(p => {
    const brandName = getMarcaNombre(p).toLowerCase();
    const catId = String(p.id_categoria_fk);
    const sku = (p.codigo_sku || '').toLowerCase();
    const model = (p.modelo || '').toLowerCase();
    const q = search.toLowerCase().trim();

    const matchesSearch = !q || sku.includes(q) || model.includes(q) || brandName.includes(q);
    const matchesCategoria = !selectedCategoria || catId === selectedCategoria;

    return matchesSearch && matchesCategoria;
  });

  // Resetear página al cambiar filtros
  useEffect(() => { setCurrentPage(1); }, [search, selectedCategoria]);

  // Slice paginado
  const pagedProductos = filteredProductos.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // KPIs
  const totalProductosUnicos = productos.length;
  
  const alertasStock = productos.filter(p => {
    const minStock = p.stock_minimo !== undefined ? p.stock_minimo : 5;
    return p.stock_actual <= minStock;
  }).length;

  const valorTotalInventario = productos.reduce((sum, p) => {
    const price = parseFloat(p.precio_venta_contado) || 0;
    const stock = Number(p.stock_actual) || 0;
    return sum + (price * stock);
  }, 0);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto space-y-8 bg-slate-50 min-h-screen">
      
      {/* ── Cabecera ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Catálogo de Productos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Administre el stock general, precios y marcas de los electrodomésticos en bodega.
          </p>
        </div>
        <button
          onClick={handleNew}
          className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nuevo Producto
        </button>
      </div>

      {/* ── Tarjetas de Resumen (Top KPIs) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI 1: Total Productos */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Productos</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{totalProductosUnicos}</h3>
          </div>
        </div>

        {/* KPI 2: Alertas de Stock */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 flex items-center gap-4">
          <div className={`p-3 rounded-xl shrink-0 ${alertasStock > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Alertas de Stock</p>
            <h3 className={`text-2xl font-bold mt-0.5 ${alertasStock > 0 ? 'text-rose-600' : 'text-gray-900'}`}>
              {alertasStock}
            </h3>
          </div>
        </div>

        {/* KPI 3: Valor del Inventario */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Valor del Inventario</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{formatCurrency(valorTotalInventario)}</h3>
          </div>
        </div>
      </div>

      {/* ── Barra de Búsqueda y Filtros ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-1/2 flex items-center gap-3 bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por SKU, modelo o marca..."
            className="w-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
          />
        </div>

        <div className="w-full md:w-auto flex items-center gap-3 shrink-0 self-stretch md:self-auto">
          <span className="text-xs text-gray-400 hidden sm:inline">Categoría:</span>
          <select
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(e.target.value)}
            className="w-full md:w-56 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          >
            <option value="">Todas las Categorías</option>
            {categorias.map(cat => (
              <option key={cat.id_categoria} value={cat.id_categoria}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Tabla de Datos ── */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : filteredProductos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-base font-semibold text-gray-900">No se encontraron productos</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm px-4">
              {search || selectedCategoria
                ? 'Pruebe a cambiar los criterios de búsqueda o remueva el filtro de categoría.'
                : 'Comience agregando el primer producto al inventario.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto (Marca + Modelo)</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio Contado</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {pagedProductos.map((p) => {
                  const minStock = p.stock_minimo !== undefined ? p.stock_minimo : 5;
                  const isLowStock = p.stock_actual <= minStock;
                  return (
                    <tr key={p.id_producto} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {p.codigo_sku}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {getMarcaNombre(p)}
                        </div>
                        <div className="text-sm text-gray-500 mt-0.5">
                          {p.modelo}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {getCategoriaNombre(p)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(p.precio_venta_contado)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full border border-rose-100">
                            {p.stock_actual} (Bajo)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-100">
                            {p.stock_actual}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Activo
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEdit(p)}
                            title="Editar producto"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border hover:border-indigo-100 border border-transparent transition-all cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id_producto)}
                            title="Eliminar producto"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 hover:border hover:border-rose-100 border border-transparent transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {/* ── Paginación ── */}
        {!loading && filteredProductos.length > 0 && (
          <Pagination
            totalItems={filteredProductos.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
          />
        )}
      </div>

      {/* ── Modal de Producto ── */}
      <ProductoModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setProductoToEdit(null); }}
        onSaved={fetchProductos}
        productoToEdit={productoToEdit}
      />
    </div>
  );
}
