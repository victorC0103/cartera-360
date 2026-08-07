import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../services/api';

const IngresosChartWidget = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/dashboard/ingresos-semana');
        const formattedData = response.data.map(item => ({
          name: new Date(item.fecha).toLocaleDateString('es-ES', { weekday: 'short', timeZone: 'UTC' }),
          Ingresos: item.total_ingresos,
          Proyección: item.total_ingresos > 0 ? item.total_ingresos * 1.2 : 500 
        }));
        
        if (formattedData.length === 0) {
            for(let i=6; i>=0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                formattedData.push({
                    name: d.toLocaleDateString('es-ES', { weekday: 'short' }),
                    Ingresos: 0,
                    Proyección: 200 + Math.random() * 500
                });
            }
        }
        
        setData(formattedData);
      } catch (error) {
        console.error('Error al cargar ingresos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center min-h-[300px]"><span className="text-slate-400 font-medium">Cargando métricas...</span></div>;
  }

  return (
    <div className="flex-1 w-full h-full min-h-[280px] mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }} barGap={2}>
          {/* Ocultamos líneas de cuadrícula para aspecto minimalista */}
          <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} />
          
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500, textTransform: 'capitalize' }} 
            dy={10} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
            tickFormatter={(value) => `$${value}`} 
          />
          <Tooltip 
            cursor={{ fill: '#f1f5f9' }}
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
          
          {/* Barras más gruesas con bordes redondeados y colores Fintech (Slate y Emerald) */}
          <Bar dataKey="Proyección" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={40} />
          <Bar dataKey="Ingresos" fill="#1e293b" radius={[6, 6, 0, 0]} barSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IngresosChartWidget;
