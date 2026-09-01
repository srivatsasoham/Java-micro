/**
 * Main Application Controller
 * Handles UI interactions, tab switching, API integration, and coordination
 * between Vision Engine, Conveyor Simulation, and QMS Analytics.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Canvas & Engines
  const mainCanvas = document.getElementById('mainCanvas');
  const overlayCanvas = document.getElementById('overlayCanvas');
  const conveyorCanvas = document.getElementById('conveyorCanvas');

  let visionEngine = null;
  let conveyorSim = null;
  let qmsAnalytics = new window.QMSAnalytics();

  if (mainCanvas && overlayCanvas) {
    visionEngine = new window.VisionEngine(mainCanvas, overlayCanvas);
  }

  if (conveyorCanvas) {
    conveyorSim = new window.ConveyorSimulator(conveyorCanvas, (inspectedItem) => {
      handleConveyorPartInspected(inspectedItem);
    });
  }

  qmsAnalytics.init();

  // Global In-Memory Audit Log (synced with preloaded seed)
  let auditHistory = [];

  // 2. Fetch initial seed & Azure health status from backend
  fetchServerStatus();
  fetchAnalyticsData();

  // 3. Tab Switching Setup
  setupTabs();

  // 4. Inspection Controls Setup
  setupInspectionControls();

  // 5. Conveyor Controls Setup
  setupConveyorControls();

  // 6. Audit Log & Override Setup
  setupAuditLog();

  // 7. Initial Inspection Render
  if (visionEngine) {
    visionEngine.setSample('pcb', true);
    triggerInspectAction();
  }

  /* -------------------------------------------------------------
     API & Data Sync
  ------------------------------------------------------------- */
  async function fetchServerStatus() {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        const azureBadge = document.getElementById('azure-status-badge');
        const azureRegion = document.getElementById('azure-region-text');
        if (azureBadge) {
          azureBadge.innerHTML = `<span class="pulse-dot pulse-dot-green mr-2"></span> Azure Online: ${data.azureRegion || 'Central India'}`;
        }
        if (azureRegion) {
          azureRegion.innerText = `Connected: ${data.service} (${data.aiEngine.model})`;
        }
      }
    } catch (e) {
      console.log('Running in client-side standalone mode');
    }
  }

  async function fetchAnalyticsData() {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const data = await res.json();
        if (data.recentHistory) {
          auditHistory = data.recentHistory;
          renderAuditTable();
        }
      }
    } catch (e) {
      // Standalone fallback
      seedFallbackHistory();
    }
  }

  function seedFallbackHistory() {
    const types = ['Solder Bridge', 'Surface Micro-Crack', 'Missing Component', 'Porosity Void'];
    const lines = ['Line A (PCB SMT)', 'Line B (CNC Machining)', 'Line C (Automotive Assembly)'];
    
    for (let i = 0; i < 15; i++) {
      const isDefect = i % 3 === 0;
      auditHistory.push({
        id: `PART-2026-${1000 + i}`,
        timestamp: new Date(Date.now() - i * 120000).toISOString(),
        line: lines[i % lines.length],
        status: isDefect ? 'FAILED' : 'PASSED',
        confidence: isDefect ? '95.4%' : '98.9%',
        defects: isDefect ? [{ type: types[i % types.length], severity: 'Major', confidence: 95.4 }] : [],
        processingTimeMs: 16 + (i % 8),
        operatorReview: isDefect ? 'Flagged for Review' : 'Auto-Approved'
      });
    }
    renderAuditTable();
  }

  /* -------------------------------------------------------------
     Tab Navigation
  ------------------------------------------------------------- */
  function setupTabs() {
    const tabButtons = document.querySelectorAll('.nav-tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');

        tabButtons.forEach(b => {
          b.classList.remove('active', 'border-cyan-400', 'text-cyan-400', 'bg-slate-800/60');
          b.classList.add('text-slate-400');
        });

        btn.classList.add('active', 'border-cyan-400', 'text-cyan-400', 'bg-slate-800/60');
        btn.classList.remove('text-slate-400');

        tabPanes.forEach(pane => {
          pane.classList.add('hidden');
          if (pane.id === targetTab) {
            pane.classList.remove('hidden');
          }
        });

        // Trigger simulator on tab change
        if (targetTab === 'tab-conveyor') {
          if (conveyorSim) conveyorSim.start();
        } else {
          if (conveyorSim) conveyorSim.stop();
        }

        if (targetTab === 'tab-analytics') {
          qmsAnalytics.init();
        }
      });
    });
  }

  /* -------------------------------------------------------------
     Inspection Station Controls
  ------------------------------------------------------------- */
  function setupInspectionControls() {
    // 1. Sample Selector Buttons
    const sampleButtons = document.querySelectorAll('.sample-select-btn');
    sampleButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        sampleButtons.forEach(b => b.classList.remove('ring-2', 'ring-cyan-400', 'bg-slate-800'));
        btn.classList.add('ring-2', 'ring-cyan-400', 'bg-slate-800');

        const sampleKey = btn.getAttribute('data-sample');
        const hasDefect = document.getElementById('defectToggleCheckbox').checked;
        visionEngine.setSample(sampleKey, hasDefect);
        triggerInspectAction();
      });
    });

    // 2. Defect Toggle Checkbox
    const defectToggle = document.getElementById('defectToggleCheckbox');
    if (defectToggle) {
      defectToggle.addEventListener('change', () => {
        const activeSample = document.querySelector('.sample-select-btn.ring-2')?.getAttribute('data-sample') || 'pcb';
        visionEngine.setSample(activeSample, defectToggle.checked);
        triggerInspectAction();
      });
    }

    // 3. Overlay Mode Switcher
    const overlayButtons = document.querySelectorAll('.overlay-mode-btn');
    overlayButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        overlayButtons.forEach(b => b.classList.remove('bg-cyan-600', 'text-white'));
        overlayButtons.forEach(b => b.classList.add('bg-slate-800', 'text-slate-300'));
        
        btn.classList.remove('bg-slate-800', 'text-slate-300');
        btn.classList.add('bg-cyan-600', 'text-white');

        const mode = btn.getAttribute('data-mode');
        visionEngine.setOverlayMode(mode);
      });
    });

    // 4. Confidence Threshold Slider
    const confSlider = document.getElementById('confThresholdSlider');
    const confValueDisplay = document.getElementById('confThresholdValue');
    if (confSlider && confValueDisplay) {
      confSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        confValueDisplay.innerText = `${val}%`;
        visionEngine.setConfidenceThreshold(val);
      });
    }

    // 5. Trigger Single Inspection Button
    const inspectBtn = document.getElementById('runInspectBtn');
    if (inspectBtn) {
      inspectBtn.addEventListener('click', () => {
        triggerInspectAction();
      });
    }

    // 6. Custom Image Upload
    const imageUploadInput = document.getElementById('customImageUploadInput');
    const dropZone = document.getElementById('imageDropZone');

    if (imageUploadInput) {
      imageUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleImageFile(file);
      });
    }

    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-cyan-400', 'bg-cyan-950/20');
      });
      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-cyan-400', 'bg-cyan-950/20');
      });
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-cyan-400', 'bg-cyan-950/20');
        if (e.dataTransfer.files.length > 0) {
          handleImageFile(e.dataTransfer.files[0]);
        }
      });
    }
  }

  function handleImageFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        visionEngine.setCustomImage(img);
        triggerInspectAction();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  function triggerInspectAction() {
    if (!visionEngine) return;

    const line = document.getElementById('activeLineSelect')?.value || 'Line A (PCB SMT)';
    const result = visionEngine.runFullInspection({ line });

    // Update Result Panel UI
    updateInspectionResultUI(result);

    // Record into QMS & Audit Log
    const record = {
      id: result.partId,
      timestamp: result.timestamp,
      line: result.line,
      status: result.status,
      confidence: result.confidence,
      defects: result.defects,
      processingTimeMs: result.processingTimeMs,
      operatorReview: result.status === 'PASSED' ? 'Auto-Approved' : 'Flagged for Review'
    };

    auditHistory.unshift(record);
    if (auditHistory.length > 100) auditHistory.pop();

    qmsAnalytics.recordInspection(record);
    renderAuditTable();
  }

  function updateInspectionResultUI(result) {
    const statusBanner = document.getElementById('inspectionStatusBanner');
    const statusText = document.getElementById('inspectionStatusText');
    const statusIcon = document.getElementById('inspectionStatusIcon');
    const partIdDisplay = document.getElementById('currentPartIdDisplay');
    const latencyDisplay = document.getElementById('inspectionLatencyDisplay');
    const defectListContainer = document.getElementById('detectedDefectsContainer');
    const defectCountBadge = document.getElementById('defectCountBadge');

    if (partIdDisplay) partIdDisplay.innerText = result.partId;
    if (latencyDisplay) latencyDisplay.innerText = `${result.processingTimeMs} ms`;

    const isPass = result.status === 'PASSED';

    if (statusBanner && statusText && statusIcon) {
      if (isPass) {
        statusBanner.className = 'p-4 rounded-xl flex items-center justify-between border status-badge-pass';
        statusText.innerText = 'INSPECTION PASSED (NOMINAL)';
        statusIcon.className = 'fa-solid fa-circle-check text-2xl text-emerald-400';
      } else {
        statusBanner.className = 'p-4 rounded-xl flex items-center justify-between border status-badge-fail';
        statusText.innerText = 'DEFECT DETECTED (REJECT)';
        statusIcon.className = 'fa-solid fa-triangle-exclamation text-2xl text-rose-400 animate-pulse';
      }
    }

    if (defectCountBadge) {
      defectCountBadge.innerText = `${result.defectCount} Anomaly Detected`;
      defectCountBadge.className = isPass 
        ? 'px-2 py-0.5 text-xs rounded bg-emerald-950 text-emerald-300 border border-emerald-800'
        : 'px-2 py-0.5 text-xs rounded bg-rose-950 text-rose-300 border border-rose-800';
    }

    if (defectListContainer) {
      if (result.defects.length === 0) {
        defectListContainer.innerHTML = `
          <div class="text-center py-6 text-slate-500 text-sm">
            <i class="fa-solid fa-shield-halved text-3xl mb-2 text-emerald-500/50"></i>
            <p>Zero structural or surface anomalies detected.</p>
            <p class="text-xs text-slate-600 mt-1">Conforms with Six Sigma / IPC-A-610 Standard.</p>
          </div>
        `;
      } else {
        defectListContainer.innerHTML = result.defects.map(d => `
          <div class="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-start justify-between space-x-3">
            <div>
              <div class="flex items-center space-x-2">
                <span class="font-semibold text-slate-200 text-sm">${d.type}</span>
                <span class="px-1.5 py-0.5 text-[10px] font-mono rounded ${d.severity === 'Critical' ? 'bg-rose-900/60 text-rose-300 border border-rose-700' : 'bg-amber-900/60 text-amber-300 border border-amber-700'}">
                  ${d.severity}
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-1">${d.description}</p>
              <div class="text-[11px] text-slate-500 font-mono mt-1">
                BBox: [X:${d.bbox.x}, Y:${d.bbox.y}, W:${d.bbox.width}, H:${d.bbox.height}]
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm font-bold text-cyan-400 font-mono">${d.conf}%</div>
              <div class="text-[10px] text-slate-500">Confidence</div>
            </div>
          </div>
        `).join('');
      }
    }
  }

  /* -------------------------------------------------------------
     Conveyor Controls & Simulation Handler
  ------------------------------------------------------------- */
  function setupConveyorControls() {
    const playBtn = document.getElementById('conveyorPlayBtn');
    const pauseBtn = document.getElementById('conveyorPauseBtn');
    const speedSelect = document.getElementById('conveyorSpeedSelect');
    const defectRateSlider = document.getElementById('conveyorDefectRateSlider');
    const defectRateDisplay = document.getElementById('conveyorDefectRateVal');

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (conveyorSim) conveyorSim.start();
        playBtn.classList.add('bg-cyan-600', 'text-white');
        pauseBtn?.classList.remove('bg-slate-700');
      });
    }

    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        if (conveyorSim) conveyorSim.stop();
        pauseBtn.classList.add('bg-slate-700');
        playBtn?.classList.remove('bg-cyan-600');
      });
    }

    if (speedSelect) {
      speedSelect.addEventListener('change', (e) => {
        const speedMap = { slow: 1.6, medium: 2.8, turbo: 4.8 };
        if (conveyorSim) conveyorSim.setSpeed(speedMap[e.target.value] || 2.8);
      });
    }

    if (defectRateSlider && defectRateDisplay) {
      defectRateSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        defectRateDisplay.innerText = `${val}%`;
        if (conveyorSim) conveyorSim.setDefectRate(val / 100);
      });
    }
  }

  function handleConveyorPartInspected(item) {
    // Play sound cue
    if (visionEngine) {
      visionEngine.playBeep(item.status === 'passed');
    }

    // Update Conveyor Telemetry UI
    const totalEl = document.getElementById('conv-stat-total');
    const passEl = document.getElementById('conv-stat-pass');
    const rejectEl = document.getElementById('conv-stat-reject');

    if (totalEl) totalEl.innerText = conveyorSim.stats.conveyorTotal;
    if (passEl) passEl.innerText = conveyorSim.stats.conveyorPass;
    if (rejectEl) rejectEl.innerText = conveyorSim.stats.conveyorReject;

    // Log to Audit table
    const sampleDefects = window.IndustrialDataset.samples[item.type]?.defects || [];
    const record = {
      id: item.id,
      timestamp: new Date().toISOString(),
      line: 'Line A (High-Speed Conveyor)',
      status: item.status === 'passed' ? 'PASSED' : 'FAILED',
      confidence: item.status === 'passed' ? '98.5%' : '96.2%',
      defects: item.hasDefect ? sampleDefects : [],
      processingTimeMs: Math.floor(12 + Math.random() * 8),
      operatorReview: item.status === 'passed' ? 'Auto-Approved' : 'Pneumatic Diverted'
    };

    auditHistory.unshift(record);
    if (auditHistory.length > 100) auditHistory.pop();

    qmsAnalytics.recordInspection(record);
    renderAuditTable();
  }

  /* -------------------------------------------------------------
     Audit Log & QA Operator Override
  ------------------------------------------------------------- */
  function setupAuditLog() {
    const exportBtn = document.getElementById('exportCsvBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        qmsAnalytics.exportCSV(auditHistory);
      });
    }

    const certBtn = document.getElementById('openCertModalBtn');
    const certModal = document.getElementById('certificateModal');
    const closeCertBtn = document.getElementById('closeCertModalBtn');
    const printCertBtn = document.getElementById('printCertBtn');

    if (certBtn && certModal) {
      certBtn.addEventListener('click', () => {
        populateCertificateData();
        certModal.classList.remove('hidden');
      });
    }

    if (closeCertBtn && certModal) {
      closeCertBtn.addEventListener('click', () => {
        certModal.classList.add('hidden');
      });
    }

    if (printCertBtn) {
      printCertBtn.addEventListener('click', () => {
        window.print();
      });
    }

    // Filter controls
    const filterSelect = document.getElementById('auditStatusFilter');
    if (filterSelect) {
      filterSelect.addEventListener('change', () => {
        renderAuditTable(filterSelect.value);
      });
    }
  }

  function renderAuditTable(filter = 'ALL') {
    const tableBody = document.getElementById('auditTableBody');
    if (!tableBody) return;

    const filtered = auditHistory.filter(item => {
      if (filter === 'ALL') return true;
      return item.status === filter;
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-slate-500">No records found matching filter.</td></tr>`;
      return;
    }

    tableBody.innerHTML = filtered.map(row => {
      const isPass = row.status === 'PASSED';
      const badgeClass = isPass ? 'status-badge-pass' : 'status-badge-fail';
      const defectSummary = (row.defects || []).map(d => d.type).join(', ') || 'Nominal';

      return `
        <tr class="border-b border-slate-800/80 hover:bg-slate-800/40 text-xs">
          <td class="py-3 px-4 font-mono text-cyan-300 font-medium">${row.id}</td>
          <td class="py-3 px-4 text-slate-400 font-mono">${new Date(row.timestamp).toLocaleTimeString()}</td>
          <td class="py-3 px-4 text-slate-300">${row.line}</td>
          <td class="py-3 px-4">
            <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badgeClass}">
              ${row.status}
            </span>
          </td>
          <td class="py-3 px-4 text-slate-400">${defectSummary}</td>
          <td class="py-3 px-4 font-mono text-slate-300">${row.processingTimeMs} ms</td>
          <td class="py-3 px-4 text-right">
            <button onclick="window.openOverrideModal('${row.id}')" class="px-2 py-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition">
              <i class="fa-solid fa-pen-to-square"></i> Review
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function populateCertificateData() {
    const dateEl = document.getElementById('certDate');
    const totalEl = document.getElementById('certTotalInspected');
    const yieldEl = document.getElementById('certYieldRate');
    const ppmEl = document.getElementById('certPpm');
    const certIdEl = document.getElementById('certId');

    if (dateEl) dateEl.innerText = new Date().toUTCString();
    if (totalEl) totalEl.innerText = qmsAnalytics.kpis.total.toLocaleString();
    if (yieldEl) yieldEl.innerText = `${qmsAnalytics.kpis.yieldRate}%`;
    if (ppmEl) ppmEl.innerText = `${qmsAnalytics.kpis.ppm} PPM`;
    if (certIdEl) certIdEl.innerText = `CERT-QMS-${Date.now().toString().slice(-8)}`;
  }

  // Global Override Modal Handler
  window.openOverrideModal = function(partId) {
    const item = auditHistory.find(h => h.id === partId);
    if (!item) return;

    const modal = document.getElementById('overrideModal');
    const titleEl = document.getElementById('overridePartTitle');
    const statusSelect = document.getElementById('overrideStatusSelect');
    const notesInput = document.getElementById('overrideNotesInput');
    const saveBtn = document.getElementById('saveOverrideBtn');
    const cancelBtn = document.getElementById('cancelOverrideBtn');

    if (!modal) return;

    titleEl.innerText = `QA Override for Part: ${item.id}`;
    statusSelect.value = item.status;
    notesInput.value = '';

    modal.classList.remove('hidden');

    saveBtn.onclick = () => {
      item.status = statusSelect.value;
      item.operatorReview = `Overridden: ${notesInput.value || 'Verified'}`;
      modal.classList.add('hidden');
      renderAuditTable();
    };

    cancelBtn.onclick = () => {
      modal.classList.add('hidden');
    };
  };
});
