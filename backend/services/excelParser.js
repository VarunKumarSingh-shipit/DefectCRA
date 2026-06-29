const XLSX = require('xlsx');

function parseExcel(filePath) {
  const wb = XLSX.readFile(filePath);
  
  // Try to find 'Defect Collection Sheet', otherwise use the first sheet
  const sheetName = wb.SheetNames.includes('Defect Collection Sheet') 
    ? 'Defect Collection Sheet' 
    : wb.SheetNames[0];
    
  const ws = wb.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  
  if (rawData.length === 0) {
    throw new Error("Excel file is empty");
  }

  const columns = rawData[0];
  const dataRows = rawData.slice(1);
  
  const parsedData = dataRows.map(row => {
    return {
      sprint: row[0],
      defectId: row[1],
      defectSummary: row[2],
      status: row[3],
      severity: row[4],
      phaseDetected: row[5],
      phaseInjected: row[6],
      source: row[7],
      defectType: row[8],
      othersDefectType: row[9],
      defectSubCategory: row[10],
      causeCategory: row[11],
      othersCauseCategory: row[12]
    };
  }).filter(row => row.sprint || row.defectId); // Filter out completely empty rows

  return {
    data: parsedData,
    columns: columns,
    totalRows: parsedData.length
  };
}

module.exports = { parseExcel };
