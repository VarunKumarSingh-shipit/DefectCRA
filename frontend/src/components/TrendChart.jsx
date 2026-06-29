import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './TrendChart.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip glass-card">
        <p className="tooltip-label">{`Sprint: ${label}`}</p>
        <div className="tooltip-items">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="tooltip-item">
              <span className="color-dot" style={{ backgroundColor: entry.color }}></span>
              <span className="name">{entry.name}:</span>
              <span className="value">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const TrendChart = ({ data, dataKeys, title, xAxisKey = "sprint" }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="chart-container glass-card slide-up">
      <h3 className="chart-title">{title}</h3>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis 
              dataKey={xAxisKey} 
              stroke="#94a3b8" 
              tick={{ fill: '#94a3b8', fontSize: 12 }} 
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            />
            <YAxis 
              stroke="#94a3b8" 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            
            {dataKeys.map((dk, index) => (
              <Bar 
                key={dk.key} 
                dataKey={dk.key} 
                stackId="stack" 
                fill={dk.color} 
                name={dk.label || dk.key} 
                animationDuration={1500}
                radius={index === dataKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrendChart;
