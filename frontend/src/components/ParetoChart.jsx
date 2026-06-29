import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import './ParetoChart.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip glass-card">
        <p className="tooltip-label">{label}</p>
        <div className="tooltip-items">
          <div className="tooltip-item">
            <span className="name">Count:</span>
            <span className="value">{payload[0]?.value}</span>
          </div>
          {payload[1] && (
            <div className="tooltip-item">
              <span className="name">Cumulative %:</span>
              <span className="value">{payload[1]?.value}%</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const ParetoChart = ({ data, title, vitalFewCount = 3 }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="chart-container glass-card slide-up">
      <h3 className="chart-title">{title}</h3>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis 
              dataKey="category" 
              stroke="#94a3b8" 
              tick={{ fill: '#94a3b8', fontSize: 11 }} 
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              yAxisId="left"
              stroke="#94a3b8" 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#22d3ee" 
              tick={{ fill: '#22d3ee', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              label={{ value: 'Cumulative %', angle: 90, position: 'insideRight', fill: '#22d3ee' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            
            <ReferenceLine yAxisId="right" y={80} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: '80%', fill: '#ef4444', fontSize: 12 }} />

            <Bar yAxisId="left" dataKey="count" name="Defect Count" radius={[4, 4, 0, 0]} animationDuration={1500}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index < vitalFewCount ? '#6366f1' : '#475569'} />
              ))}
            </Bar>
            
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="cumulativePercentage" 
              name="Cumulative %" 
              stroke="#22d3ee" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#12122a', stroke: '#22d3ee', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#22d3ee' }}
              animationDuration={1500}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ParetoChart;
