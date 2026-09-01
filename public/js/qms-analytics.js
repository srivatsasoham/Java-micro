/**
 * Quality Management System (QMS) & Six Sigma Analytics Module
 * Renders interactive Pareto charts, SPC control charts, yield trends,
 * and handles PDF/CSV quality certificate exports.
 */

class QMSAnalytics {
  constructor() {
    this.paretoChart = null;
    this.spcChart = null;
    this.lineChart = null;

    this.history = [];
    this.kpis = {
      total: 1420,
      passed: 1342,
      failed: 78,
      yieldRate: 94.51,
      defectRate: 5.49,
      ppm: 54930,
      oee: 92.4,
      mttd: 16.4
    };

    this.defectCounts = {
      'Solder Bridge': 28,
      'Surface Micro-Crack': 22,
      'Missing Component': 18,
      'Porosity Void': 14,
      'Scratches / Abrasions': 11
    };

    this.spcData = [
      { batch: 'B-101', rate: 4.8, ucl: 8.2, lcl: 2.1, mean: 5.2 },
      { batch: 'B-102', rate: 5.1, ucl: 8.2, lcl: 2.1, mean: 5.2 },
      { batch: 'B-103', rate: 4.5, ucl: 8.2, lcl: 2.1, mean: 5.2 },
      { batch: 'B-104', rate: 5.9, ucl: 8.2, lcl: 2.1, mean: 5.2 },
      { batch: 'B-105', rate: 5.4, ucl: 8.2, lcl: 2.1, mean: 5.2 },
      { batch: 'B-106', rate: 6.2, ucl: 8.2, lcl: 2.1, mean: 5.2 },
      { batch: 'B-107', rate: 4.9, ucl: 8.2, lcl: 2.1, mean: 5.2 },
      { batch: 'B-108', rate: 5.1, ucl: 8.2, lcl: 2.1, mean: 5.2 },
      { batch: 'B-109', rate: 7.1, ucl: 8.2, lcl: 2.1, mean: 5.2 },
      { batch: 'B-110', rate: 5.5, ucl: 8.2, lcl: 2.1, mean: 5.2 }
    ];
  }

  init() {
    this.initParetoChart();
    this.initSPCChart();
    this.initLineComparisonChart();
    this.updateKPIsUI();
  }

  initParetoChart() {
    const ctx = document.getElementById('paretoChartCanvas');
    if (!ctx) return;

    // Sort defect categories descending
    const sortedCategories = Object.entries(this.defectCounts)
      .sort((a, b) => b[1] - a[1]);

    const labels = sortedCategories.map(item => item[0]);
    const counts = sortedCategories.map(item => item[1]);
    const totalDefects = counts.reduce((acc, v) => acc + v, 0);

    // Calculate cumulative percentages
    let currentSum = 0;
    const cumulativePct = counts.map(c => {
      currentSum += c;
      return ((currentSum / totalDefects) * 100).toFixed(1);
    });

    if (this.paretoChart) this.paretoChart.destroy();

    this.paretoChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Defect Count',
            data: counts,
            backgroundColor: 'rgba(239, 68, 68, 0.75)',
            borderColor: '#ef4444',
            borderWidth: 1.5,
            yAxisID: 'y'
          },
          {
            label: 'Cumulative % (80/20 Rule)',
            data: cumulativePct,
            type: 'line',
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.2)',
            pointBackgroundColor: '#38bdf8',
            pointRadius: 4,
            borderWidth: 2.5,
            tension: 0.25,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#cbd5e1', font: { family: 'Inter', size: 11 } }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            ticks: { color: '#94a3b8', font: { size: 10 } },
            grid: { color: 'rgba(148, 163, 184, 0.1)' }
          },
          y: {
            type: 'linear',
            position: 'left',
            ticks: { color: '#ef4444', font: { size: 10 } },
            title: { display: true, text: 'Defect Frequency', color: '#ef4444' },
            grid: { color: 'rgba(148, 163, 184, 0.1)' }
          },
          y1: {
            type: 'linear',
            position: 'right',
            max: 100,
            min: 0,
            ticks: {
              color: '#38bdf8',
              callback: value => value + '%',
              font: { size: 10 }
            },
            title: { display: true, text: 'Cumulative %', color: '#38bdf8' },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }

  initSPCChart() {
    const ctx = document.getElementById('spcChartCanvas');
    if (!ctx) return;

    const labels = this.spcData.map(d => d.batch);
    const defectRates = this.spcData.map(d => d.rate);
    const uclData = this.spcData.map(d => d.ucl);
    const lclData = this.spcData.map(d => d.lcl);
    const meanData = this.spcData.map(d => d.mean);

    if (this.spcChart) this.spcChart.destroy();

    this.spcChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Batch Defect Rate (%)',
            data: defectRates,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.25)',
            pointBackgroundColor: defectRates.map(r => r > 8.0 ? '#ef4444' : '#f59e0b'),
            pointRadius: 5,
            borderWidth: 2,
            tension: 0.2
          },
          {
            label: 'UCL (+3σ = 8.2%)',
            data: uclData,
            borderColor: '#ef4444',
            borderDash: [5, 5],
            pointRadius: 0,
            borderWidth: 1.8
          },
          {
            label: 'Process Mean (X̄ = 5.2%)',
            data: meanData,
            borderColor: '#10b981',
            borderDash: [2, 2],
            pointRadius: 0,
            borderWidth: 1.5
          },
          {
            label: 'LCL (-3σ = 2.1%)',
            data: '#3b82f6',
            borderColor: '#3b82f6',
            borderDash: [5, 5],
            pointRadius: 0,
            borderWidth: 1.8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#cbd5e1', font: { family: 'Inter', size: 11 } }
          }
        },
        scales: {
          x: {
            ticks: { color: '#94a3b8', font: { size: 10 } },
            grid: { color: 'rgba(148, 163, 184, 0.1)' }
          },
          y: {
            ticks: {
              color: '#cbd5e1',
              callback: val => val + '%',
              font: { size: 10 }
            },
            grid: { color: 'rgba(148, 163, 184, 0.1)' }
          }
        }
      }
    });
  }

  initLineComparisonChart() {
    const ctx = document.getElementById('lineComparisonCanvas');
    if (!ctx) return;

    if (this.lineChart) this.lineChart.destroy();

    this.lineChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Line A (PCB SMT)', 'Line B (CNC Machining)', 'Line C (Auto Weld)'],
        datasets: [{
          data: [520, 480, 420],
          backgroundColor: ['#38bdf8', '#818cf8', '#34d399'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#cbd5e1', font: { size: 10 } }
          }
        }
      }
    });
  }

  recordInspection(record) {
    this.kpis.total++;
    if (record.status === 'PASSED') {
      this.kpis.passed++;
    } else {
      this.kpis.failed++;
      record.defects.forEach(d => {
        if (this.defectCounts[d.type]) {
          this.defectCounts[d.type]++;
        } else {
          this.defectCounts[d.type] = 1;
        }
      });
    }

    this.kpis.yieldRate = ((this.kpis.passed / this.kpis.total) * 100).toFixed(2);
    this.kpis.defectRate = ((this.kpis.failed / this.kpis.total) * 100).toFixed(2);
    this.kpis.ppm = Math.round((this.kpis.failed / this.kpis.total) * 1000000);

    this.updateKPIsUI();
    this.initParetoChart();
  }

  updateKPIsUI() {
    const elTotal = document.getElementById('kpi-total');
    const elYield = document.getElementById('kpi-yield');
    const elDefect = document.getElementById('kpi-defect');
    const elPpm = document.getElementById('kpi-ppm');
    const elOee = document.getElementById('kpi-oee');

    if (elTotal) elTotal.innerText = this.kpis.total.toLocaleString();
    if (elYield) elYield.innerText = `${this.kpis.yieldRate}%`;
    if (elDefect) elDefect.innerText = `${this.kpis.defectRate}%`;
    if (elPpm) elPpm.innerText = this.kpis.ppm.toLocaleString();
    if (elOee) elOee.innerText = `${this.kpis.oee}%`;
  }

  exportCSV(auditLog) {
    if (!auditLog || auditLog.length === 0) {
      alert('No inspection records to export');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Serial ID,Timestamp,Line,Status,Confidence,Defect Types,Processing (ms),Operator Review\n';

    auditLog.forEach(row => {
      const defectList = (row.defects || []).map(d => d.type).join('; ') || 'None';
      csvContent += `"${row.id}","${row.timestamp}","${row.line}","${row.status}","${row.confidence}","${defectList}","${row.processingTimeMs}","${row.operatorReview}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Industrial_Quality_Inspection_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

window.QMSAnalytics = QMSAnalytics;
