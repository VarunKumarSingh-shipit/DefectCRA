import React, { useState } from 'react';
import './DataTable.css';

const DataTable = ({ data, columns }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  if (!data || data.length === 0) return null;

  // Extract keys to display based on the first data object
  const displayKeys = Object.keys(data[0]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    
    if (aVal === bVal) return 0;
    
    // Handle undefined/null
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    
    if (sortConfig.direction === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  return (
    <div className="data-table-container glass-card slide-up">
      <div className="table-header-info">
        <h3>Preview Data</h3>
        <span className="row-count">{data.length} records found</span>
      </div>
      
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {displayKeys.map(key => (
                <th key={key} onClick={() => handleSort(key)}>
                  {key}
                  {sortConfig.key === key && (
                    <span className="sort-indicator">
                      {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, i) => (
              <tr key={row.defectId || i}>
                {displayKeys.map(key => (
                  <td key={`${i}-${key}`}>{row[key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
