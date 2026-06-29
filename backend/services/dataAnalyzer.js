function analyzeData(defects) {
  // Sort sprints numerically
  const extractSprintNum = (sprintStr) => {
    if (!sprintStr) return 0;
    const match = String(sprintStr).match(/Sprint-(\d+)/i);
    return match ? parseInt(match[1], 10) : 0;
  };

  const getSortedSprints = (data) => {
    const sprints = new Set(data.map(d => String(d.sprint).trim()).filter(s => s));
    return Array.from(sprints).sort((a, b) => extractSprintNum(a) - extractSprintNum(b));
  };

  const sprints = getSortedSprints(defects);

  // 1. Phase Injection Trend
  const phaseInjectionTrend = sprints.map(sprint => {
    const sprintDefects = defects.filter(d => String(d.sprint).trim() === sprint);
    const trend = {
      sprint,
      Coding: 0,
      Design: 0,
      Requirements: 0,
      Configuration: 0,
      total: sprintDefects.length
    };
    
    sprintDefects.forEach(d => {
      const phase = String(d.phaseInjected).trim();
      if (trend.hasOwnProperty(phase)) {
        trend[phase]++;
      }
    });
    
    return trend;
  });

  // 2. Defect Type Trend
  // First, gather all unique defect types
  const defectTypesSet = new Set();
  defects.forEach(d => {
    if (d.defectType) defectTypesSet.add(String(d.defectType).trim());
  });
  const defectTypes = Array.from(defectTypesSet);

  const defectTypeTrend = sprints.map(sprint => {
    const sprintDefects = defects.filter(d => String(d.sprint).trim() === sprint);
    const trend = { sprint, total: sprintDefects.length };
    
    // Initialize all types to 0
    defectTypes.forEach(type => trend[type] = 0);
    
    sprintDefects.forEach(d => {
      const type = String(d.defectType).trim();
      if (type) {
        trend[type]++;
      }
    });
    
    return trend;
  });

  // 3. Cause Category Pareto
  const causeCategoryCounts = {};
  defects.forEach(d => {
    const cat = String(d.causeCategory || '').trim();
    if (cat) {
      causeCategoryCounts[cat] = (causeCategoryCounts[cat] || 0) + 1;
    }
  });

  let causeCategoryPareto = Object.entries(causeCategoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  const totalCategorizedDefects = causeCategoryPareto.reduce((sum, item) => sum + item.count, 0);
  
  let cumulativeCount = 0;
  causeCategoryPareto = causeCategoryPareto.map(item => {
    cumulativeCount += item.count;
    const percentage = totalCategorizedDefects > 0 ? (item.count / totalCategorizedDefects) * 100 : 0;
    const cumulativePercentage = totalCategorizedDefects > 0 ? (cumulativeCount / totalCategorizedDefects) * 100 : 0;
    return {
      category: item.category,
      count: item.count,
      percentage: Number(percentage.toFixed(2)),
      cumulativePercentage: Number(cumulativePercentage.toFixed(2))
    };
  });

  // 4. Summary Stats
  const bySeverity = { Critical: 0, Major: 0, Minor: 0 };
  const byStatus = { Closed: 0, Open: 0, Resolved: 0, "In Progress": 0, Invalid: 0 };
  const bySource = { Internal: 0, External: 0 };

  defects.forEach(d => {
    if (d.severity) {
      const sev = String(d.severity).trim();
      if (bySeverity.hasOwnProperty(sev)) bySeverity[sev]++;
      else bySeverity[sev] = 1; // capture others if any
    }
    if (d.status) {
      const stat = String(d.status).trim();
      if (byStatus.hasOwnProperty(stat)) byStatus[stat]++;
      else byStatus[stat] = 1;
    }
    if (d.source) {
      const src = String(d.source).trim();
      if (bySource.hasOwnProperty(src)) bySource[src]++;
      else bySource[src] = 1;
    }
  });

  const summary = {
    totalDefects: defects.length,
    bySeverity,
    byStatus,
    bySource,
    sprintRange: { 
      from: sprints.length > 0 ? sprints[0] : null, 
      to: sprints.length > 0 ? sprints[sprints.length - 1] : null 
    },
    totalSprints: sprints.length
  };

  return {
    phaseInjectionTrend,
    defectTypeTrend,
    causeCategoryPareto,
    summary
  };
}

module.exports = { analyzeData };
