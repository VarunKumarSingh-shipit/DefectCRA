const docx = require('docx');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, ShadingType } = docx;

async function generateWordDoc({ analysisData, fiveWhyResults }) {
  const { summary, phaseInjectionTrend, defectTypeTrend, causeCategoryPareto } = analysisData;

  const headerBorders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  };

  const createCell = (text, isHeader = false, isBold = false) => {
    return new TableCell({
      children: [new Paragraph({ 
        children: [new TextRun({ text: String(text), bold: isHeader || isBold, color: isHeader ? "FFFFFF" : "000000" })],
        alignment: AlignmentType.CENTER
      })],
      shading: {
        fill: isHeader ? "2B5797" : "FFFFFF",
        type: ShadingType.CLEAR,
        color: "auto",
      },
      borders: headerBorders,
      margins: { top: 100, bottom: 100, left: 100, right: 100 }
    });
  };

  const createTable = (headers, rows) => {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: headers.map(h => createCell(h, true)) }),
        ...rows.map(row => new TableRow({ children: row.map(r => createCell(r)) }))
      ]
    });
  };

  const sections = [];

  // Title and Date
  sections.push(new Paragraph({
    text: "Defect Root Cause Analysis Report",
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER
  }));
  sections.push(new Paragraph({
    text: `Generated Date: ${new Date().toLocaleDateString()}`,
    alignment: AlignmentType.CENTER
  }));
  sections.push(new Paragraph({ text: "" })); // spacing

  // Executive Summary
  sections.push(new Paragraph({ text: "Executive Summary", heading: HeadingLevel.HEADING_2 }));
  sections.push(new Paragraph({ 
    text: `This report analyzes a total of ${summary.totalDefects} defects over ${summary.totalSprints} sprints (from ${summary.sprintRange.from} to ${summary.sprintRange.to}).` 
  }));
  
  const summaryHeaders = ["Metric", "Value"];
  const summaryRows = [
    ["Total Defects", summary.totalDefects],
    ["Sprint Range", `${summary.sprintRange.from} to ${summary.sprintRange.to}`],
    ["Severity - Critical", summary.bySeverity?.Critical || 0],
    ["Severity - Major", summary.bySeverity?.Major || 0],
    ["Severity - Minor", summary.bySeverity?.Minor || 0]
  ];
  sections.push(createTable(summaryHeaders, summaryRows));
  sections.push(new Paragraph({ text: "" }));

  // Phase Injection Analysis
  sections.push(new Paragraph({ text: "Phase Injection Analysis", heading: HeadingLevel.HEADING_2 }));
  const phaseHeaders = ["Sprint", "Coding", "Design", "Requirements", "Configuration", "Total"];
  const phaseRows = (phaseInjectionTrend || []).map(p => [
    p.sprint, p.Coding || 0, p.Design || 0, p.Requirements || 0, p.Configuration || 0, p.total || 0
  ]);
  sections.push(createTable(phaseHeaders, phaseRows));
  sections.push(new Paragraph({ text: "" }));

  // Defect Type Analysis
  sections.push(new Paragraph({ text: "Defect Type Analysis", heading: HeadingLevel.HEADING_2 }));
  
  // Extract all unique defect types from the trend for columns
  const typeHeaders = ["Sprint"];
  const allTypes = new Set();
  (defectTypeTrend || []).forEach(t => {
    Object.keys(t).forEach(k => {
      if(k !== 'sprint' && k !== 'total') allTypes.add(k);
    });
  });
  const typeArray = Array.from(allTypes);
  typeHeaders.push(...typeArray);
  typeHeaders.push("Total");

  const typeRows = (defectTypeTrend || []).map(t => {
    const row = [t.sprint];
    typeArray.forEach(type => {
      row.push(t[type] || 0);
    });
    row.push(t.total || 0);
    return row;
  });
  sections.push(createTable(typeHeaders, typeRows));
  sections.push(new Paragraph({ text: "" }));

  // Cause Category Analysis
  sections.push(new Paragraph({ text: "Cause Category Analysis (Pareto)", heading: HeadingLevel.HEADING_2 }));
  const causeHeaders = ["Category", "Count", "Percentage", "Cumulative %"];
  const causeRows = (causeCategoryPareto || []).map(c => [
    c.category, c.count, `${c.percentage}%`, `${c.cumulativePercentage}%`
  ]);
  sections.push(createTable(causeHeaders, causeRows));
  sections.push(new Paragraph({ text: "" }));

  // 5 Why Analysis
  sections.push(new Paragraph({ text: "5 Why Analysis", heading: HeadingLevel.HEADING_2 }));
  
  if (fiveWhyResults && fiveWhyResults.length > 0) {
    fiveWhyResults.forEach(fw => {
      sections.push(new Paragraph({ text: `Category: ${fw.category}`, heading: HeadingLevel.HEADING_3 }));
      
      const fwTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [createCell("Problem Description", false, true), createCell(fw.problemDescription || "")] }),
          new TableRow({ children: [createCell("Direct Cause", false, true), createCell(fw.directCause || "")] }),
          new TableRow({ children: [createCell("Why 1", false, true), createCell(fw.result?.why1 || "")] }),
          new TableRow({ children: [createCell("Why 2", false, true), createCell(fw.result?.why2 || "")] }),
          new TableRow({ children: [createCell("Why 3", false, true), createCell(fw.result?.why3 || "")] }),
          new TableRow({ children: [createCell("Why 4", false, true), createCell(fw.result?.why4 || "")] }),
          new TableRow({ children: [createCell("Why 5", false, true), createCell(fw.result?.why5 || "")] }),
          new TableRow({ children: [createCell("Root Cause", false, true), createCell(fw.result?.rootCause || "")] }),
          new TableRow({ children: [
            createCell("Recommended Actions", false, true), 
            createCell((fw.result?.actions || []).join('\n'))
          ] })
        ]
      });
      sections.push(fwTable);
      sections.push(new Paragraph({ text: "" }));
    });
  } else {
    sections.push(new Paragraph({ text: "No 5 Why analysis data generated." }));
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: sections
    }]
  });

  return await Packer.toBuffer(doc);
}

module.exports = { generateWordDoc };
