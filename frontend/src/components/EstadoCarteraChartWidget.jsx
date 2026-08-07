import React, { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../services/api';

// Paleta estricta: Tonos índigo/slate profundos y el último color gris para "Otras Zonas"
const COLORS = ['#1e293b', '#334155', '#475569', '#64748b', '#e2e8f0'];

const EstadoCarteraChartWidget = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/dashboard/estado-cartera-zona');
        const formattedData = response.data.map(item => ({
          name: item.zona,
          value: item.total_cartera
        }));
        
        // Limita a 4 segmentos principales + 1 "Otras Zonas"
        if (formattedData.length > 5) {
           const top4 = formattedData.slice(0, 4);
           const others = formattedData.slice(4).reduce((acc, curr) => acc + curr.value, 0);
           top4.push({ name: 'Otras Zonas', value: others });
           setData(top4);
        } else {
           setData(formattedData);
        }
      } catch (error) {
        console.error('Error al cargar estado de cartera:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center min-h-[300px]"><span className="text-slate-400 font-medium">Construyendo gráfica...</span></div>;
  }

  if (data.length === 0) {
      return <div className="flex-1 flex items-center justify-center min-h-[300px]"><span className="text-slate-400 font-medium">Sin datos en cartera</span></div>;
  }

  return (
    <div className="flex-1 w-full h-full min-h-[280px] mt-2 relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={4}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.name === 'Otras Zonas' ? '#e2e8f0' : COLORS[index % (COLORS.length - 1)]} 
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => `$${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
            contentStyle={{ 
              borderRadius: '12px', 
              border: '1px solid #e2e8f0', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)',
              fontWeight: 500,
              color: '#1e293b'
            }}
          />
          <Legend 
            layout="vertical" 
            verticalAlign="middle" 
            align="right" 
            iconType="circle" 
            wrapperStyle={{ fontSize: '13px', textTransform: 'capitalize', color: '#475569', fontWeight: 500 }} 
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EstadoCarteraChartWidget;
