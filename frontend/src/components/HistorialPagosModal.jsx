import { useState, useEffect } from 'react';
import { X, Calendar, Loader2, Info, FileText, Printer, AlertTriangle, Image } from 'lucide-react';
import api from '../services/api';
import VisualizadorCartillaModal from './VisualizadorCartillaModal';
import { calcularMontoExigible } from '../utils/calculosFinancieros';

export default function HistorialPagosModal({ isOpen, id_cartilla, onClose, cartilla }) {
  const [abonos, setAbonos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Estado para abrir/cerrar el visualizador de pre-impresión
  const [showVisualizador, setShowVisualizador] = useState(false);

  useEffect(() => {
    const fetchAbonos = async () => {
      if (!id_cartilla) return;
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/cartillas/${id_cartilla}/abonos`);
        setAbonos(data || []);
      } catch (err) {
        console.error('Error al cargar historial de abonos:', err);
        setError('No se pudo recuperar el historial de pagos de la base de datos.');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && id_cartilla) {
      fetchAbonos();
    }
  }, [isOpen, id_cartilla]);

  if (!isOpen) return null;

  // Cálculos financieros para mini KPIs
  const montoOriginal = cartilla
    ? parseFloat(cartilla.total_con_intereses || cartilla.monto_a_financiar || 0)
    : 0;
  const saldoPendiente = cartilla ? (parseFloat(cartilla.saldo_pendiente) || 0) : 0;
  const totalPagado = Math.max(0, montoOriginal - saldoPendiente);

  const montoExigible = cartilla 
    ? calcularMontoExigible(cartilla.fecha_venta, cartilla.frecuencia_pago, parseFloat(cartilla.valor_cuota), totalPagado, saldoPendiente)
    : 0;

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('es-EC', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handlePrintReceipt = (abono) => {
    alert(`Comprobante #REC-${abono.id_abono}\nFecha: ${formatDate(abono.fecha_registro)}\nMonto: ${formatCurrency(abono.monto_cobrado)}`);
  };

  return (
    <>
      {/* ── Visualizador de pre-impresión (z-60, por encima del historial) ── */}
      <VisualizadorCartillaModal
        isOpen={showVisualizador}
        onClose={() => setShowVisualizador(false)}
        cartilla={cartilla}
        abonos={abonos}
      />

      {/* ── Overlay del Historial ── */}
      <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        {/*
          ── Contenedor principal: flex col + max-h para controlar overflow
        */}
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">

          {/* ── ZONA FIJA SUPERIOR: Cabecera + KPIs ── */}
          <div className="shrink-0">
            {/* Cabecera */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
                  Historial de Pagos — Cartilla #{id_cartilla}
                </h2>
                {cartilla && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {cartilla.nombres} {cartilla.apellidos} &bull; C.I.{' '}
                    <span className="font-mono">{cartilla.cedula}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Botón "Vista Previa + Imprimir" → abre el visualizador */}
                <button
                  onClick={() => setShowVisualizador(true)}
                  disabled={loading}
                  title="Ver Vista Previa e Imprimir Cartilla Física (A5)"
                  className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir Cartilla
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-md hover:bg-gray-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mini KPIs (Sticky Top) */}
            <div className="bg-slate-50 px-6 py-4 border-b border-gray-200 grid grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-1">
                  Monto Financiado
                </p>
                <p className="text-lg font-bold text-gray-900 font-mono leading-none">
                  {formatCurrency(montoOriginal)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-1">
                  Total Recaudado
                </p>
                <p className="text-lg font-bold text-emerald-600 font-mono leading-none">
                  {formatCurrency(totalPagado)}
                </p>
                {montoOriginal > 0 && (
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (totalPagado / montoOriginal) * 100).toFixed(1)}%` }}
                    />
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-1">
                  Saldo Pendiente
                </p>
                <p className="text-lg font-bold text-rose-600 font-mono leading-none">
                  {formatCurrency(saldoPendiente)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-1">
                  Valor Vencido
                </p>
                {montoExigible > 0 ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <p className="text-lg font-black text-rose-600 font-mono leading-none">
                      {formatCurrency(montoExigible)}
                    </p>
                  </div>
                ) : (
                  <span className="inline-block mt-0.5 px-3 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-full">
                    Al Día
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── ZONA SCROLLABLE: Cuerpo / Tabla de Abonos ── */}
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
            <div className="p-6">
              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 mb-4">
                  <Info className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[200px] space-y-3">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-xs text-gray-400 font-medium">Cargando historial de pagos...</p>
                </div>
              ) : abonos.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[200px] text-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50 p-8">
                  <div className="p-3 bg-gray-100 text-gray-400 rounded-full mb-3">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">No hay pagos registrados aún</h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">
                    Este plan de financiamiento no registra ningún abono o recaudo asentado en el sistema.
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* ── Data Grid ── */}
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr>
                        <th className="sticky top-0 bg-gray-50 z-10 shadow-sm px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                          Fecha de Pago
                        </th>
                        <th className="sticky top-0 bg-gray-50 z-10 shadow-sm px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                          Recibo
                        </th>
                        <th className="sticky top-0 bg-gray-50 z-10 shadow-sm px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                          Método
                        </th>
                        <th className="sticky top-0 bg-gray-50 z-10 shadow-sm px-5 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                          Monto Cobrado
                        </th>
                        <th className="sticky top-0 bg-gray-50 z-10 shadow-sm px-5 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                          Comprobante
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {abonos.map((ab) => (
                        <tr
                          key={ab.id_abono}
                          className="even:bg-slate-50/50 hover:bg-indigo-50/30 transition-colors"
                        >
                          <td className="px-5 py-3 whitespace-nowrap text-xs text-gray-700 font-medium">
                            {formatDate(ab.fecha_registro)}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span className="text-xs font-bold text-gray-900 font-mono">
                              #REC-{ab.id_abono}
                            </span>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span className="inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {ab.metodo_pago || 'Efectivo'}
                            </span>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap text-right">
                            <span className="text-sm font-medium text-emerald-600 font-mono">
                              {formatCurrency(ab.monto_cobrado)}
                            </span>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              {ab.comprobante_url && (
                                <a
                                  href={`http://localhost:3000${ab.comprobante_url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Ver Comprobante Adjunto"
                                  className="inline-flex items-center justify-center p-1.5 rounded-md text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                >
                                  <Image className="w-4 h-4" />
                                </a>
                              )}
                              <button
                                onClick={() => handlePrintReceipt(ab)}
                                title="Ver / Reimprimir Recibo del Sistema"
                                className="inline-flex items-center justify-center p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ── ZONA FIJA INFERIOR: Footer ── */}
          <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-3 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {loading
                ? 'Cargando registros...'
                : `Mostrando ${abonos.length} registro${abonos.length !== 1 ? 's' : ''} de pago`}
            </p>
            <button
              onClick={onClose}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              Cerrar Historial
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
