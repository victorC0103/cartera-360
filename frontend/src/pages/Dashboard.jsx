import { useState, useEffect } from 'react';
import { 
  DollarSign, AlertTriangle, TrendingUp, Users, Calendar, 
  Download, ArrowUpRight, ArrowDownRight, FolderOpen, Loader2
} from 'lucide-react';
import api from '../services/api';
import MoraPorSectorWidget from '../components/MoraPorSectorWidget';
import IngresosChartWidget from '../components/IngresosChartWidget';
import EstadoCarteraChartWidget from '../components/EstadoCarteraChartWidget';

function KpiCard({ data }) {
  const Icon = data.icon;
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-7 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className={`${data.iconBg} ${data.iconColor} p-2.5 rounded-xl`}>
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>
        <span className="text-sm text-slate-500 font-semibold uppercase tracking-wider">{data.title}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-black text-slate-800 tracking-tight">{data.value}</span>
        <span className="text-lg font-bold text-slate-400">{data.decimals}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`
          inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md
          ${data.trendUp 
            ? 'bg-emerald-50/80 text-emerald-700' 
            : 'bg-rose-50/80 text-rose-700'
          }
        `}>
          {data.trendUp 
            ? <ArrowUpRight className="w-3.5 h-3.5" /> 
            : <ArrowDownRight className="w-3.5 h-3.5" />
          }
          {data.trend}
        </span>
        <span className="text-xs font-medium text-slate-400">{data.trendLabel}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [currentDate, setCurrentDate] = useState('');
  const [kpis, setKpis] = useState(null);
  const [alertasData, setAlertasData] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Paginación de alertas
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('es-ES', options));

    const fetchDashboardStats = async () => {
      try {
        const [kpisRes, alertasRes] = await Promise.all([
          api.get('/dashboard/kpis'),
          api.get('/dashboard/alertas')
        ]);
        setKpis(kpisRes.data);
        setAlertasData(alertasRes.data);
      } catch (error) {
        console.error("Error al cargar KPIs o alertas:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const dynamicKpiData = kpis ? [
    {
      title: 'Cartera Activa',
      value: '$' + Number(kpis.carteraActiva).toLocaleString('es-PE', { maximumFractionDigits: 0 }),
      decimals: '',
      trend: 'Total', trendLabel: 'Monto a financiar global', trendUp: true,
      icon: DollarSign, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600',
    },
    {
      title: 'Índice de Morosidad',
      value: Number(kpis.indiceMorosidad).toFixed(1),
      decimals: '%',
      trend: 'Riesgo', trendLabel: 'De la cartera activa', trendUp: false,
      icon: AlertTriangle, iconBg: 'bg-rose-50', iconColor: 'text-rose-600',
    },
    {
      title: 'Recaudación de Hoy',
      value: '$' + Number(kpis.recaudacionHoy).toLocaleString('es-PE', { maximumFractionDigits: 0 }),
      decimals: '',
      trend: 'Diario', trendLabel: 'En abonos procesados', trendUp: true,
      icon: TrendingUp, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600',
    },
    {
      title: 'Clientes Activos',
      value: kpis.clientesActivos,
      decimals: '',
      trend: 'Global', trendLabel: 'Con deuda vigente', trendUp: true,
      icon: Users, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600',
    }
  ] : [];

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-8 bg-slate-50/50 min-h-screen font-sans">

      {/* ── A. Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Resumen Gerencial</h1>
          <p className="text-sm font-medium text-slate-500 mt-1.5 flex items-center gap-2 capitalize">
            <Calendar className="w-4 h-4 text-slate-400" />
            {currentDate}
          </p>
        </div>
        <button className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition-all flex items-center gap-2">
          <Download className="w-4 h-4" />
          Descargar Reporte
        </button>
      </div>

      {/* ── B. KPI Grid ── */}
      {loadingStats ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {dynamicKpiData.map((kpi, i) => (
            <KpiCard key={i} data={kpi} />
          ))}
        </div>
      )}

      {/* ── C. Gráficos (Widgets) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico 1: Ingresos (2 columnas de ancho en pantallas grandes si quisieras, pero lo mantenemos en 1 de 3) */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-7 flex flex-col min-h-[380px] lg:col-span-1">
          <h2 className="text-base font-bold text-slate-800 tracking-tight border-b border-slate-100 pb-3 mb-6">
            Ingresos vs Proyección
            <span className="text-slate-400 font-medium text-xs ml-2 uppercase">(Últimos 7 días)</span>
          </h2>
          <IngresosChartWidget />
        </div>
        
        {/* Gráfico 2: Cartera */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-7 flex flex-col min-h-[380px] lg:col-span-1">
          <h2 className="text-base font-bold text-slate-800 tracking-tight border-b border-slate-100 pb-3 mb-6">
            Distribución de Cartera
            <span className="text-slate-400 font-medium text-xs ml-2 uppercase">(Por Zona)</span>
          </h2>
          <EstadoCarteraChartWidget />
        </div>
        
        {/* Gráfico 3: Mora */}
        <div className="lg:col-span-1 h-full">
          <MoraPorSectorWidget />
        </div>
      </div>

      {/* ── D. Tabla de Alertas ── */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden mt-8">
        <div className="px-7 py-5 flex items-center justify-between border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight">Rutas Prioritarias de Cobranza</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Clientes con mora mayor a 30 días</p>
          </div>
          <span className="bg-rose-100/50 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            {alertasData.length} alertas activas
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-7 py-4 font-semibold text-slate-500 uppercase tracking-wider text-xs">Cliente</th>
                <th className="px-7 py-4 font-semibold text-slate-500 uppercase tracking-wider text-xs">Zona / Ruta</th>
                <th className="px-7 py-4 font-semibold text-slate-500 uppercase tracking-wider text-xs">Estado de Mora</th>
                <th className="px-7 py-4 font-semibold text-slate-500 uppercase tracking-wider text-xs text-right">Saldo Vencido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alertasData.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-7 py-10 text-center">
                    <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
                    <p className="text-slate-500 font-medium">No hay registros críticos de cobranza.</p>
                  </td>
                </tr>
              ) : (
                alertasData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-7 py-4">
                      <div className="font-bold text-slate-800">{row.cliente}</div>
                      <div className="text-xs font-medium text-slate-400 mt-1">CI: {row.cedula}</div>
                    </td>
                    <td className="px-7 py-4 font-medium text-slate-600">{row.zona}</td>
                    <td className="px-7 py-4">
                      <span className={`
                        inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-md
                        ${row.dias >= 60 ? 'bg-rose-100 text-rose-800' : row.dias >= 40 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}
                      `}>
                        {row.dias} días de atraso
                      </span>
                    </td>
                    <td className="px-7 py-4 font-black text-slate-800 text-right">
                      ${row.monto.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Controles de Paginación */}
        {alertasData.length > 0 && (
          <div className="px-7 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
            <span className="text-sm text-slate-500 font-medium">
              Mostrando <span className="font-bold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, alertasData.length)}</span> de <span className="font-bold text-slate-700">{alertasData.length}</span> alertas
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(alertasData.length / itemsPerPage)))}
                disabled={currentPage === Math.ceil(alertasData.length / itemsPerPage)}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
