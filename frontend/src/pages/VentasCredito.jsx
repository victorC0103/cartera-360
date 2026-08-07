import { useState, useEffect } from 'react';
import { Plus, Search, Eye, FileText, Loader2, CreditCard, AlertCircle, TrendingUp, CheckCircle } from 'lucide-react';
import api from '../services/api';
import Pagination from '../components/Pagination';

export default function VentasCredito({ onViewChange }) {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchVentas = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/ventas');
      // Si la API responde con éxito, la usamos. Si está vacía, usamos el mock.
      if (data && data.length > 0) {
        setVentas(data);
      } else {
        setVentas([]);
      }
    } catch (err) {
      console.log('Error al cargar ventas de la API:', err);
      setVentas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVentas();
  }, []);

  // Filtrado de contratos
  const filteredVentas = ventas.filter(v => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      String(v.id_venta).includes(q) ||
      v.cedula?.includes(q) ||
      `${v.nombres} ${v.apellidos}`.toLowerCase().includes(q);

    const matchesEstado = !filterEstado || v.estado === filterEstado;

    return matchesSearch && matchesEstado;
  });

  // Resetear página al filtrar
  useEffect(() => { setCurrentPage(1); }, [search, filterEstado]);

  // Slice paginado
  const pagedVentas = filteredVentas.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Cálculos de KPIs
  const totalCarteraActiva = ventas
    .filter(v => v.estado === 'Activo' || v.estado === 'Mora')
    .reduce((sum, v) => sum + (parseFloat(v.total_con_intereses) || 0), 0);

  const nuevosCreditosMes = ventas.length; // Simulamos total como créditos del mes

  const contratosMora = ventas.filter(v => v.estado === 'Mora').length;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handlePrintPagare = (venta) => {
    alert(`Generando Pagaré para el contrato #${venta.id_venta} - Cliente: ${venta.nombres} ${venta.apellidos}\nMonto: ${formatCurrency(venta.total_con_intereses)}`);
  };

  const handleVerDetalle = (venta) => {
    alert(`Detalles del Contrato #${venta.id_venta}\nCliente: ${venta.nombres} ${venta.apellidos}\nPlazo: ${venta.cantidad_cuotas} meses (${venta.frecuencia_pago})\nTotal Financiado: ${formatCurrency(venta.total_con_intereses)}\nEntrada: ${formatCurrency(venta.valor_entrada)}`);
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto space-y-8 bg-slate-50 min-h-screen">
      
      {/* ── Cabecera ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Gestión de Créditos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Administre los contratos de venta financiados y el estado de la cartera.
          </p>
        </div>
        <button
          onClick={() => onViewChange('nueva-venta')}
          className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nuevo Contrato
        </button>
      </div>

      {/* ── Tarjetas KPI (Grid de 3) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI 1: Cartera Activa */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Cartera Activa</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{formatCurrency(totalCarteraActiva)}</h3>
          </div>
        </div>

        {/* KPI 2: Nuevos Créditos (Mes) */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Nuevos Créditos (Mes)</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{nuevosCreditosMes} contratos</h3>
          </div>
        </div>

        {/* KPI 3: Contratos en Mora */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 flex items-center gap-4">
          <div className={`p-3 rounded-xl shrink-0 ${contratosMora > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Contratos en Mora</p>
            <h3 className={`text-2xl font-bold mt-0.5 ${contratosMora > 0 ? 'text-rose-600' : 'text-gray-900'}`}>
              {contratosMora}
            </h3>
          </div>
        </div>
      </div>

      {/* ── Barra de Herramientas ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-1/2 flex items-center gap-3 bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, cédula o ID contrato..."
            className="w-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
          />
        </div>

        <div className="w-full md:w-auto flex items-center gap-3 shrink-0 self-stretch md:self-auto">
          <span className="text-xs text-gray-400 hidden sm:inline">Estado:</span>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="w-full md:w-48 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          >
            <option value="">Todos los Estados</option>
            <option value="Activo">Activo</option>
            <option value="Pagado">Pagado</option>
            <option value="Mora">Mora</option>
            <option value="Anulado">Anulado</option>
          </select>
        </div>
      </div>

      {/* ── Tabla de Contratos ── */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : filteredVentas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CreditCard className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-base font-semibold text-gray-900">No se encontraron contratos</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm px-4">
              {search || filterEstado
                ? 'Intente modificar los términos de búsqueda o el filtro de estado.'
                : 'Aún no se han generado contratos de crédito.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID Contrato</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Monto Financiado</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plazo</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {pagedVentas.map((v) => {
                  return (
                    <tr key={v.id_venta} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900 font-mono">
                          #{v.id_venta}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {v.nombres} {v.apellidos}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                          C.I. {v.cedula}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(v.fecha_venta)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(v.total_con_intereses)}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Entrada: {formatCurrency(v.valor_entrada)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">
                          {v.cantidad_cuotas} meses
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Frecuencia: {v.frecuencia_pago}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {v.estado === 'Activo' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            Activo
                          </span>
                        )}
                        {v.estado === 'Pagado' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                            Pagado
                          </span>
                        )}
                        {v.estado === 'Mora' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                            Mora
                          </span>
                        )}
                        {v.estado === 'Anulado' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                            Anulado
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleVerDetalle(v)}
                            title="Ver Detalle"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent transition-all cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePrintPagare(v)}
                            title="Imprimir Pagaré"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent transition-all cursor-pointer"
                          >
                            <FileText className="w-4 h-4" />
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
        {!loading && filteredVentas.length > 0 && (
          <Pagination
            totalItems={filteredVentas.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
          />
        )}
      </div>
    </div>
  );
}
