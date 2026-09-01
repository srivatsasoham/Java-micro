const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS & JSON parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// In-Memory Inspection Database & Telemetry Store
const inspectionHistory = [];
const systemStats = {
  totalInspected: 1420,
  passedCount: 1342,
  failedCount: 78,
  defectCounts: {
    'Solder Bridge': 24,
    'Surface Micro-Crack': 19,
    'Missing Component': 15,
    'Porosity Void': 11,
    'Scratches / Abrasions': 9
  },
  linePerformance: {
    'Line A (PCB SMT)': { inspected: 520, defects: 22, yield: 95.77 },
    'Line B (CNC Machining)': { inspected: 480, defects: 31, yield: 93.54 },
    'Line C (Automotive Assembly)': { inspected: 420, defects: 25, yield: 94.05 }
  }
};

// Seed initial history
const defectTypes = ['Solder Bridge', 'Surface Micro-Crack', 'Missing Component', 'Porosity Void', 'Scratches / Abrasions'];
const lines = ['Line A (PCB SMT)', 'Line B (CNC Machining)', 'Line C (Automotive Assembly)'];
const severities = ['Minor', 'Major', 'Critical'];

for (let i = 0; i < 25; i++) {
  const isDefect = Math.random() < 0.12;
  const line = lines[Math.floor(Math.random() * lines.length)];
  const timestamp = new Date(Date.now() - (25 - i) * 180000).toISOString();
  const partId = `PART-2026-${1000 + i}`;
  
  if (isDefect) {
    const defectType = defectTypes[Math.floor(Math.random() * defectTypes.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const confidence = (88 + Math.random() * 11).toFixed(1);
    
    inspectionHistory.unshift({
      id: partId,
      timestamp,
      line,
      status: 'FAILED',
      confidence: `${confidence}%`,
      defects: [
        {
          type: defectType,
          severity,
          confidence: parseFloat(confidence),
          boundingBox: { x: 30 + Math.random() * 40, y: 30 + Math.random() * 40, width: 20, height: 15 }
        }
      ],
      processingTimeMs: Math.floor(18 + Math.random() * 25),
      operatorReview: 'Pending QA'
    });
  } else {
    inspectionHistory.unshift({
      id: partId,
      timestamp,
      line,
      status: 'PASSED',
      confidence: `${(96 + Math.random() * 3.8).toFixed(1)}%`,
      defects: [],
      processingTimeMs: Math.floor(12 + Math.random() * 15),
      operatorReview: 'Auto-Approved'
    });
  }
}

// REST API Endpoints

// 1. Healthcheck Endpoint for Azure App Service & monitoring
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'AI Industrial Visual Inspection & QMS Portal',
    azureRegion: process.env.REGION_NAME || 'Central India',
    appServicePlan: 'Azure for Students (ASP-hb-bceb)',
    os: process.platform,
    nodeVersion: process.version,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    aiEngine: {
      status: 'ONLINE',
      model: 'YOLOv8-Industrial-QMS-Custom',
      precision: 'FP16',
      avgLatencyMs: 16.4
    }
  });
});

// 2. Analytics & QMS Metrics Endpoint
app.get('/api/analytics', (req, res) => {
  const total = systemStats.totalInspected;
  const passed = systemStats.passedCount;
  const failed = systemStats.failedCount;
  const yieldRate = total > 0 ? ((passed / total) * 100).toFixed(2) : 100;
  const defectRate = total > 0 ? ((failed / total) * 100).toFixed(2) : 0;
  const ppm = total > 0 ? Math.round((failed / total) * 1000000) : 0;

  // SPC Control Chart Data calculation
  const spcRuns = [];
  const meanDefectRate = parseFloat(defectRate);
  const sigma = 0.85; // Standard deviation estimate
  const ucl = (meanDefectRate + 3 * sigma).toFixed(2);
  const lcl = Math.max(0, meanDefectRate - 3 * sigma).toFixed(2);

  for (let i = 1; i <= 15; i++) {
    const sampleRate = Math.max(0.5, meanDefectRate + (Math.sin(i * 0.8) * 1.2 + (Math.random() - 0.5) * 0.8)).toFixed(2);
    spcRuns.push({
      batch: `Batch #${100 + i}`,
      rate: parseFloat(sampleRate),
      ucl: parseFloat(ucl),
      lcl: parseFloat(lcl),
      mean: meanDefectRate
    });
  }

  res.json({
    kpis: {
      totalInspected: total,
      passedCount: passed,
      failedCount: failed,
      yieldRate: parseFloat(yieldRate),
      defectRate: parseFloat(defectRate),
      ppm,
      oee: 92.4,
      mttdMs: 18.2
    },
    defectCounts: systemStats.defectCounts,
    linePerformance: systemStats.linePerformance,
    spcRuns,
    recentHistory: inspectionHistory.slice(0, 50)
  });
});

// 3. Image & Stream Inspection Endpoint
app.post('/api/inspect', (req, res) => {
  const { sampleType, line, manualImage, sensitivity = 0.85 } = req.body;
  const partId = `PART-${Date.now().toString().slice(-6)}`;
  const processingTimeMs = Math.floor(14 + Math.random() * 22);

  // Simulated CV defect inference logic based on sample profile or uploaded image
  let defects = [];
  let isFailed = false;

  const defectCatalog = {
    pcb: [
      { type: 'Solder Bridge', severity: 'Critical', desc: 'Short circuit between IC pin 4 & 5', bbox: { x: 38, y: 44, width: 14, height: 12 }, conf: 0.98 },
      { type: 'Missing Component', severity: 'Major', desc: 'C12 SMD Capacitor missing', bbox: { x: 68, y: 32, width: 12, height: 10 }, conf: 0.95 },
      { type: 'Surface Micro-Crack', severity: 'Major', desc: 'Substrate hairline crack near mounting hole', bbox: { x: 22, y: 70, width: 20, height: 8 }, conf: 0.91 }
    ],
    casting: [
      { type: 'Porosity Void', severity: 'Critical', desc: 'Subsurface gas entrapment bubble (>2.5mm)', bbox: { x: 45, y: 50, width: 16, height: 16 }, conf: 0.96 },
      { type: 'Scratches / Abrasions', severity: 'Minor', desc: 'Tooling abrasion along rim', bbox: { x: 62, y: 25, width: 22, height: 9 }, conf: 0.89 }
    ],
    weld: [
      { type: 'Porosity Void', severity: 'Critical', desc: 'Weld bead excessive porosity', bbox: { x: 50, y: 42, width: 18, height: 14 }, conf: 0.94 },
      { type: 'Surface Micro-Crack', severity: 'Critical', desc: 'Heat-affected zone longitudinal crack', bbox: { x: 30, y: 48, width: 26, height: 6 }, conf: 0.97 }
    ],
    solar: [
      { type: 'Surface Micro-Crack', severity: 'Major', desc: 'Photovoltaic wafer micro-fissure', bbox: { x: 55, y: 38, width: 28, height: 10 }, conf: 0.93 },
      { type: 'Missing Component', severity: 'Major', desc: 'Busbar silver metallization break', bbox: { x: 35, y: 15, width: 8, height: 40 }, conf: 0.96 }
    ],
    pharma: [
      { type: 'Missing Component', severity: 'Critical', desc: 'Cavity #4 tablet missing in blister pack', bbox: { x: 50, y: 55, width: 15, height: 15 }, conf: 0.99 },
      { type: 'Scratches / Abrasions', severity: 'Major', desc: 'Foil seal puncture / micro-leak', bbox: { x: 25, y: 30, width: 18, height: 12 }, conf: 0.92 }
    ]
  };

  const selectedCategory = defectCatalog[sampleType] || defectCatalog.pcb;

  // Probability of defect generation for demo
  if (Math.random() < 0.65) {
    isFailed = true;
    const numDefects = Math.random() > 0.7 ? 2 : 1;
    for (let i = 0; i < numDefects; i++) {
      const d = selectedCategory[Math.floor(Math.random() * selectedCategory.length)];
      if (!defects.some(item => item.type === d.type)) {
        defects.push({
          type: d.type,
          severity: d.severity,
          description: d.desc,
          confidence: parseFloat((d.conf * 100 - (Math.random() * 4)).toFixed(1)),
          boundingBox: {
            x: d.bbox.x + (Math.random() * 6 - 3),
            y: d.bbox.y + (Math.random() * 6 - 3),
            width: d.bbox.width,
            height: d.bbox.height
          }
        });
      }
    }
  }

  // Update telemetry
  systemStats.totalInspected++;
  if (isFailed) {
    systemStats.failedCount++;
    defects.forEach(d => {
      if (systemStats.defectCounts[d.type] !== undefined) {
        systemStats.defectCounts[d.type]++;
      } else {
        systemStats.defectCounts[d.type] = 1;
      }
    });
  } else {
    systemStats.passedCount++;
  }

  const resultRecord = {
    id: partId,
    timestamp: new Date().toISOString(),
    line: line || 'Line A (PCB SMT)',
    status: isFailed ? 'FAILED' : 'PASSED',
    confidence: isFailed 
      ? `${(defects.reduce((max, d) => Math.max(max, d.confidence), 0)).toFixed(1)}%`
      : `${(97 + Math.random() * 2.8).toFixed(1)}%`,
    defects,
    processingTimeMs,
    operatorReview: isFailed ? 'Flagged for Review' : 'Auto-Approved'
  };

  inspectionHistory.unshift(resultRecord);
  if (inspectionHistory.length > 200) inspectionHistory.pop();

  res.json({
    success: true,
    result: resultRecord,
    systemStats: {
      totalInspected: systemStats.totalInspected,
      passedCount: systemStats.passedCount,
      failedCount: systemStats.failedCount,
      yieldRate: ((systemStats.passedCount / systemStats.totalInspected) * 100).toFixed(2)
    }
  });
});

// 4. Update QA Operator Override
app.post('/api/override', (req, res) => {
  const { id, newStatus, operatorNotes, qaInspector } = req.body;
  const item = inspectionHistory.find(h => h.id === id);
  if (item) {
    item.status = newStatus;
    item.operatorReview = `Overridden by ${qaInspector || 'Operator'}: ${operatorNotes || 'Verified'}`;
    return res.json({ success: true, item });
  }
  res.status(404).json({ success: false, message: 'Item not found' });
});

// Fallback to index.html for single page application routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🏭 AI Industrial Visual Inspection & QMS Portal Running`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`☁️ Azure App Service Port: ${PORT}`);
  console.log(`=======================================================`);
});
