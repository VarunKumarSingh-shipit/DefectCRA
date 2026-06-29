const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Sample Defect Data Analysis Sheet - Template.xlsx');
const wb = XLSX.readFile(filePath);

// Defect Collection Sheet - full header analysis
const ws = wb.Sheets['Defect Collection Sheet'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

console.log('=== ALL HEADERS (Defect Collection Sheet) ===');
data[0].forEach((h, i) => {
  if (h !== '') console.log(`  Col ${i} (${String.fromCharCode(65 + i)}): "${h}"`);
});

console.log('\n=== TOTAL COLUMNS:', data[0].length);
console.log('=== TOTAL ROWS:', data.length);

// Unique values for key analysis columns
const headers = data[0];
const keyCols = {
  'Sprint': 0,
  'Status': 3,
  'Severity': 4,
  'Phase Detected': 5,
  'Phase Injected': 6,
  'Source': 7,
  'Defect Type': 8,
  'Defect Sub-category': 10,
  'Cause Category': 11
};

Object.entries(keyCols).forEach(([name, idx]) => {
  const values = data.slice(1).map(r => r[idx]).filter(v => v !== '');
  const unique = [...new Set(values)];
  console.log(`\n"${name}" (col ${idx}):`);
  console.log(`  Count: ${values.length}, Unique: ${unique.length}`);
  console.log(`  Values: ${unique.join(' | ')}`);
});

// Show the last few data rows to see where data ends
console.log('\n=== LAST 5 DATA ROWS ===');
for (let i = Math.max(1, data.length - 5); i < data.length; i++) {
  const nonEmpty = data[i].filter(v => v !== '');
  if (nonEmpty.length > 0) {
    console.log(`Row ${i + 1}: ${JSON.stringify(data[i].slice(0, 13))}`);
  }
}

// Causal Analysis sheet structure
console.log('\n\n=== CAUSAL ANALYSIS SHEET STRUCTURE ===');
const caWs = wb.Sheets['Causal Analysis'];
const caData = XLSX.utils.sheet_to_json(caWs, { header: 1, defval: '' });
console.log('Row 1:', JSON.stringify(caData[0].filter(v => v !== '')));
console.log('Row 2:', JSON.stringify(caData[1].filter(v => v !== '')));
console.log('Row 3:', JSON.stringify(caData[2].filter(v => v !== '')));
console.log('Row 4 (sample):', JSON.stringify(caData[3].filter(v => v !== '').slice(0, 10)));
