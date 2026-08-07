import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const MoraPorSectorWidget = () => {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMoraPorSector = async () => {
      try {
        const response = await api.get('/dashboard/mora-por-sector'); 
        const formattedData = response.data.map(item => ({
          sector: item.sector || 'Otras Zonas',
          Mora: Number(item.total_mora)
        }));
        setDatos(formattedData);
      } catch (error) {
        console.error('Error al cargar la mora por sector:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMoraPorSector();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-7 flex flex-col min-h-[380px]">
        <h2 className="text-base font-bold text-slate-800 tracking-tight border-b border-slate-100 pb-3 mb-6">
          Sectores Críticos (Mayor Mora)
        </h2>
        <div className="flex-1 flex justify-center items-center">
          <span className="text-slate-400 font-medium">Cargando gráfico...</span>
        </div>
      </div>
    );
  }

  console.log("DATOS MORA:", datos);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-7 flex flex-col min-h-[380px]">
      <h2 className="text-base font-bold text-slate-800 tracking-tight border-b border-slate-100 pb-3 mb-6">
        Sectores Críticos (Mayor Mora)
      </h2>
      
      {datos.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center items-center gap-3">
            <CheckCircle2 className="w-12 h-12 text-slate-300" strokeWidth={1.5} />
            <p className="text-sm font-medium text-slate-500 text-center max-w-[200px]">
              Excelente: No se registran clientes con deuda vencida
            </p>
        </div>
      ) : (
        <div className="flex-1 w-full mt-4" style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} />
              <XAxis 
                dataKey="sector" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} 
                dy={10} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12 }} 
                tickFormatter={(value) => `$${value}`} 
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid #e2e8f0', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)',
                  fontWeight: 500,
                  color: '#1e293b'
                }}
                formatter={(value) => `$${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
              />
              <Legend 
                iconType="circle" 
                wrapperStyle={{ fontSize: '13px', paddingTop: '20px', color: '#64748b', fontWeight: 500 }} 
              />
              <Bar dataKey="Mora" radius={[6, 6, 0, 0]} barSize={32}>
                {datos.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#b91c1c' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default MoraPorSectorWidget;
