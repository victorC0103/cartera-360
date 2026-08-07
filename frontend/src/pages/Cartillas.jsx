import { useState, useEffect } from 'react';
import { Search, CreditCard, CheckCircle, Loader2, DollarSign, Target, UserCheck, Package, History, Plus, MessageCircle } from 'lucide-react';
import api from '../services/api';
import AbonoModal from '../components/AbonoModal';
import HistorialPagosModal from '../components/HistorialPagosModal';
import NotificacionMoraModal from '../components/NotificacionMoraModal';
import Pagination from '../components/Pagination';
import { calcularMontoExigible } from '../utils/calculosFinancieros';

const MOCK_SECTORES = [
  { id_sector: 1, nombre: 'Centro de Milagro' },
  { id_sector: 2, nombre: 'Cdla. Las Piñas' },
  { id_sector: 3, nombre: 'Cdla. Los Helechos' },
  { id_sector: 4, nombre: 'Roberto Astudillo' },
  { id_sector: 5, nombre: 'Chobo' }
];

export default function Cartillas() {
  const [cartillas, setCartillas] = useState([]);
  const [sectores, setSectores] = useState(MOCK_SECTORES);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  
  // Abonos
  const [selectedCartilla, setSelectedCartilla] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [recaudadoHoy, setRecaudadoHoy] = useState(0);

  // Historial de Pagos
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyCartillaId, setHistoryCartillaId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Notificación WhatsApp
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [whatsappCartilla, setWhatsappCartilla] = useState(null);
  const [whatsappExigible, setWhatsappExigible] = useState(0);
  const [whatsappAbonos, setWhatsappAbonos] = useState([]);

  const handleOpenWhatsApp = async (cartilla, exigible) => {
    setWhatsappCartilla(cartilla);
    setWhatsappExigible(exigible);
    // Cargar abonos para la captura de la cartilla
    try {
      const { data } = await api.get(`/cartillas/${cartilla.id_venta}/abonos`);
      setWhatsappAbonos(data || []);
    } catch (err) {
      console.error('Error cargando abonos para WhatsApp:', err);
      setWhatsappAbonos([]);
    }
    setWhatsappModalOpen(true);
  };

  const handleOpenHistory = (cartilla) => {
    setSelectedCartilla(cartilla);
    setHistoryCartillaId(cartilla.id_venta);
    setHistoryModalOpen(true);
  };

  const fetchSectores = async () => {
    try {
      const { data } = await api.get('/catalogos/sectores');
      if (data && data.length > 0) {
        setSectores(data);
      }
    } catch (err) {
      console.log('Usando sectores mock para filtros en Cartillas.', err);
    }
  };

  const fetchCartillas = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/ventas');
      setCartillas(data || []);
    } catch (err) {
      console.error('Error cargando cartillas:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecaudadoHoy = async () => {
    try {
      const { data } = await api.get('/ventas/recaudado-hoy');
      setRecaudadoHoy(data.total || 0);
    } catch (err) {
      console.error('Error cargando recaudado hoy:', err);
    }
  };

  useEffect(() => {
    fetchSectores();
    fetchCartillas();
    fetchRecaudadoHoy();
  }, []);

  const handleOpenAbono = (cartilla) => {
    setSelectedCartilla(cartilla);
    setModalOpen(true);
  };

  const handleAbonoConfirmation = (montoCobrado) => {
    // Si se pasa un monto (desde el fallback de simulación), lo sumamos a lo recaudado hoy
    if (montoCobrado && !isNaN(montoCobrado)) {
      const valorAbonado = parseFloat(montoCobrado);
      setRecaudadoHoy(prev => prev + valorAbonado);
      
      // Actualizar localmente el saldo pendiente de la cartilla
      setCartillas(prev => prev.map(c => {
        if (c.id_venta === selectedCartilla.id_venta) {
          const nuevoSaldo = Math.max(0, parseFloat(c.saldo_pendiente) - valorAbonado);
          return {
            ...c,
            saldo_pendiente: nuevoSaldo
          };
        }
        return c;
      }));
    } else {
      // Si la API tuvo éxito, sumamos el valor de la cuota sugerida como aproximado y refrescamos
      const sugerido = Math.min(
        parseFloat(selectedCartilla.valor_cuota || 0),
        parseFloat(selectedCartilla.saldo_pendiente || 0)
      );
      setRecaudadoHoy(prev => prev + sugerido);
    }
    // Refrescar desde base de datos
    fetchCartillas();
    fetchRecaudadoHoy();
  };

  // Filtrado de cartillas
  const filteredCartillas = cartillas.filter(c => {
    const q = search.toLowerCase().trim();
    const clienteName = `${c.nombres} ${c.apellidos}`.toLowerCase();
    const matchesSearch =
      !q || String(c.id_venta).includes(q) || clienteName.includes(q) || c.cedula?.includes(q);

    const matchesSector = !selectedSector || c.nombre_sector === selectedSector;

    return matchesSearch && matchesSector;
  });

  // Resetear página al filtrar
  useEffect(() => { setCurrentPage(1); }, [search, selectedSector]);

  // Slice paginado
  const pagedCartillas = filteredCartillas.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // KPIs
  let metaRecaudacion = 0;
  cartillas.forEach(c => {
    if (parseFloat(c.saldo_pendiente) > 0) {
      const cuota = parseFloat(c.valor_cuota || 0);
      const freq = c.frecuencia_pago?.toLowerCase() || '';
      if (freq === 'diario') {
        metaRecaudacion += cuota;
      } else if (freq === 'semanal') {
        metaRecaudacion += cuota / 7;
      } else if (freq === 'quincenal') {
        metaRecaudacion += cuota / 15;
      } else if (freq === 'mensual') {
        metaRecaudacion += cuota / 30;
      } else {
        metaRecaudacion += cuota;
      }
    }
  });
  
  const cartillasPendientes = cartillas.filter(c => parseFloat(c.saldo_pendiente) > 0).length;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto space-y-8 bg-slate-50 min-h-screen">
      
      {/* ── Cabecera ── */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Control de Cartillas</h1>
        <p className="text-sm text-gray-500 mt-1">
          Registre los abonos diarios de los clientes y controle el estado financiero de cada plan de pagos.
        </p>
      </div>

      {/* ── Tarjetas KPI (Grid de 3) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI 1: Meta Recaudación */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Meta de Recaudación (Día)</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{formatCurrency(metaRecaudacion)}</h3>
          </div>
        </div>

        {/* KPI 2: Total Recaudado Hoy */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Recaudado Hoy</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-0.5">{formatCurrency(recaudadoHoy)}</h3>
          </div>
        </div>

        {/* KPI 3: Cartillas Pendientes */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Cartillas Pendientes (Día)</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{cartillasPendientes} clientes</h3>
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
            placeholder="Buscar por cliente, cédula o ID cartilla..."
            className="w-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
          />
        </div>

        <div className="w-full md:w-auto flex items-center gap-3 shrink-0 self-stretch md:self-auto">
          <span className="text-xs text-gray-400 hidden sm:inline">Ruta / Sector:</span>
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="w-full md:w-56 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          >
            <option value="">Todos los Sectores</option>
            {sectores.map(sec => (
              <option key={sec.id_sector} value={sec.nombre}>
                {sec.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Tabla de Cartillas ── */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : filteredCartillas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CreditCard className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-base font-semibold text-gray-900">No hay cartillas vigentes</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm px-4">
              {search || selectedSector
                ? 'Pruebe a cambiar los parámetros de búsqueda o remueva el filtro de sector.'
                : 'Aún no existen ventas financiadas registradas.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID Cartilla</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Artículo(s) Adquirido(s)</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ruta / Sector</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor Cuota</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor Vencido</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Saldo Pendiente</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {pagedCartillas.map((c) => {
                  const saldo = parseFloat(c.saldo_pendiente) || 0;
                  const montoOriginal = parseFloat(c.total_con_intereses || c.monto_a_financiar || 0);
                  const totalPagado = Math.max(0, montoOriginal - saldo);
                  const exigible = calcularMontoExigible(c.fecha_venta, c.frecuencia_pago, parseFloat(c.valor_cuota), totalPagado, saldo);
                  
                  const isFinished = saldo <= 0;
                  return (
                    <tr key={c.id_venta} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900 font-mono">
                          #{c.id_venta}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {c.nombres} {c.apellidos}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                          C.I. {c.cedula}
                        </div>
                      </td>
                      {/* ── Artículos Adquiridos ── */}
                      <td className="px-6 py-4 max-w-[240px]">
                        {c.articulos_detalle ? (
                          <div className="space-y-1">
                            {c.articulos_detalle.split(' | ').map((art, idx) => (
                              <div key={idx} className="flex items-start gap-1.5">
                                <Package className="w-3 h-3 text-indigo-400 mt-0.5 shrink-0" />
                                <span className="text-xs text-gray-700 leading-snug">{art}</span>
                              </div>
                            ))}
                            {c.cantidad_articulos > 1 && (
                              <span className="inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                                {c.cantidad_articulos} artículos
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                            <Package className="w-3 h-3" />
                            Sin artículos
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {c.nombre_sector || 'Centro de Milagro'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-medium text-gray-900 font-mono">
                          {formatCurrency(c.valor_cuota)}
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          {c.frecuencia_pago}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {isFinished ? (
                           <span className="text-sm font-bold font-mono text-gray-400">$0.00</span>
                        ) : exigible > 0 ? (
                          <span className="inline-flex items-center gap-1 text-sm font-bold font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                            {formatCurrency(exigible)}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            Al día
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`text-sm font-bold font-mono ${isFinished ? 'text-gray-400' : 'text-indigo-600'}`}>
                          {formatCurrency(saldo)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenHistory(c)}
                            title="Ver Historial de Pagos"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent transition-all cursor-pointer"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          {exigible > 0 && (
                            <button
                              onClick={() => handleOpenWhatsApp(c, exigible)}
                              title="Notificar por WhatsApp"
                              className="p-1.5 rounded-lg text-green-500 hover:text-green-700 hover:bg-green-50 border border-transparent transition-all cursor-pointer"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}
                          {!isFinished ? (
                            <button
                              onClick={() => handleOpenAbono(c)}
                              title="Registrar Pago"
                              className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent transition-all cursor-pointer"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          ) : (
                            <span className="p-1.5 text-gray-300 cursor-not-allowed inline-flex" title="Completado">
                              <CheckCircle className="w-5 h-5" />
                            </span>
                          )}
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
        {!loading && filteredCartillas.length > 0 && (
          <Pagination
            totalItems={filteredCartillas.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
          />
        )}
      </div>

      {/* ── Modal de Registro de Abono ── */}
      <AbonoModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedCartilla(null); }}
        onSaved={handleAbonoConfirmation}
        cartilla={selectedCartilla}
      />

      {/* ── Modal de Historial de Pagos ── */}
      <HistorialPagosModal
        isOpen={historyModalOpen}
        onClose={() => { setHistoryModalOpen(false); setHistoryCartillaId(null); setSelectedCartilla(null); }}
        id_cartilla={historyCartillaId}
        cartilla={selectedCartilla}
      />

      {/* ── Modal de Notificación WhatsApp ── */}
      <NotificacionMoraModal
        isOpen={whatsappModalOpen}
        onClose={() => { setWhatsappModalOpen(false); setWhatsappCartilla(null); setWhatsappAbonos([]); }}
        cartilla={whatsappCartilla}
        abonos={whatsappAbonos}
        valorVencido={whatsappExigible}
      />
      
    </div>
  );
}
