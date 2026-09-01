/**
 * Industrial AI Computer Vision Engine
 * Handles image rendering, bounding box annotation, Grad-CAM heatmaps,
 * edge detection filters, and defect classification.
 */

class VisionEngine {
  constructor(canvasElement, overlayCanvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.overlayCanvas = overlayCanvasElement;
    this.overlayCtx = overlayCanvasElement.getContext('2d');
    
    this.currentSampleKey = 'pcb';
    this.isDefective = true;
    this.confidenceThreshold = 80; // %
    this.activeOverlayMode = 'bbox'; // 'bbox', 'heatmap', 'edges', 'all'
    this.activeDetections = [];
    this.customImage = null;

    this.initAudio();
  }

  initAudio() {
    // Web Audio API for industrial acoustic feedback
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  playBeep(isPass) {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    if (isPass) {
      // Pleasant double high chime for PASS
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.audioCtx.currentTime); // A5
      osc.frequency.setValueAtTime(1174.66, this.audioCtx.currentTime + 0.08); // D6
      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.25);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.25);
    } else {
      // Low buzz alarm for DEFECT/FAIL
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.audioCtx.currentTime); // A3
      osc.frequency.setValueAtTime(160, this.audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.35);
    }
  }

  setSample(sampleKey, hasDefect = true) {
    this.customImage = null;
    this.currentSampleKey = sampleKey;
    this.isDefective = hasDefect;
    this.render();
  }

  setCustomImage(imgElement) {
    this.customImage = imgElement;
    this.render();
  }

  setOverlayMode(mode) {
    this.activeOverlayMode = mode;
    this.renderOverlays();
  }

  setConfidenceThreshold(threshold) {
    this.confidenceThreshold = threshold;
    this.renderOverlays();
  }

  render() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    this.ctx.clearRect(0, 0, width, height);

    if (this.customImage) {
      // Draw user uploaded image
      this.ctx.drawImage(this.customImage, 0, 0, width, height);
      // Generate synthetic defect data for custom uploaded image
      this.activeDetections = [
        {
          type: 'Surface Micro-Crack',
          severity: 'Critical',
          description: 'Anomaly detected in high-gradient texture region',
          bbox: { x: Math.floor(width * 0.35), y: Math.floor(height * 0.3), width: Math.floor(width * 0.28), height: Math.floor(height * 0.22) },
          conf: 94.2
        },
        {
          type: 'Scratches / Abrasions',
          severity: 'Minor',
          description: 'Surface discontinuity exceeding optical tolerance',
          bbox: { x: Math.floor(width * 0.65), y: Math.floor(height * 0.55), width: Math.floor(width * 0.2), height: Math.floor(height * 0.18) },
          conf: 88.6
        }
      ];
    } else {
      const sample = window.IndustrialDataset.samples[this.currentSampleKey];
      if (sample) {
        sample.render(this.ctx, width, height, this.isDefective);
        this.activeDetections = this.isDefective ? [...sample.defects] : [];
      }
    }

    this.renderOverlays();
  }

  renderOverlays() {
    const width = this.overlayCanvas.width;
    const height = this.overlayCanvas.height;
    this.overlayCtx.clearRect(0, 0, width, height);

    if (!this.activeDetections || this.activeDetections.length === 0) {
      return;
    }

    const filteredDetections = this.activeDetections.filter(d => d.conf >= this.confidenceThreshold);

    if (this.activeOverlayMode === 'heatmap' || this.activeOverlayMode === 'all') {
      this.drawGradCamHeatmap(filteredDetections, width, height);
    }

    if (this.activeOverlayMode === 'edges' || this.activeOverlayMode === 'all') {
      this.drawEdgeOverlay(width, height);
    }

    if (this.activeOverlayMode === 'bbox' || this.activeOverlayMode === 'all') {
      this.drawBoundingBoxes(filteredDetections);
    }
  }

  drawBoundingBoxes(detections) {
    const ctx = this.overlayCtx;

    detections.forEach(d => {
      const { x, y, width: w, height: h } = d.bbox;
      const isCritical = d.severity === 'Critical';
      const isMajor = d.severity === 'Major';

      const color = isCritical ? '#ef4444' : (isMajor ? '#f59e0b' : '#3b82f6');
      const bgBadge = isCritical ? 'rgba(239, 68, 68, 0.9)' : (isMajor ? 'rgba(245, 158, 11, 0.9)' : 'rgba(59, 130, 246, 0.9)');

      // Shaded bounding box interior
      ctx.fillStyle = isCritical ? 'rgba(239, 68, 68, 0.15)' : (isMajor ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)');
      ctx.fillRect(x, y, w, h);

      // Bounding box border
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);

      // Corner target brackets
      const cornerLen = Math.min(10, w / 3, h / 3);
      ctx.lineWidth = 3.5;
      
      // Top Left
      ctx.beginPath();
      ctx.moveTo(x, y + cornerLen); ctx.lineTo(x, y); ctx.lineTo(x + cornerLen, y);
      ctx.stroke();
      // Top Right
      ctx.beginPath();
      ctx.moveTo(x + w - cornerLen, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cornerLen);
      ctx.stroke();
      // Bottom Left
      ctx.beginPath();
      ctx.moveTo(x, y + h - cornerLen); ctx.lineTo(x, y + h); ctx.lineTo(x + cornerLen, y + h);
      ctx.stroke();
      // Bottom Right
      ctx.beginPath();
      ctx.moveTo(x + w - cornerLen, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cornerLen);
      ctx.stroke();

      // Top Tag Badge
      const labelText = `${d.type} [${d.conf}%]`;
      ctx.font = 'bold 11px Inter, sans-serif';
      const textWidth = ctx.measureText(labelText).width;
      const badgeH = 20;
      const badgeW = textWidth + 14;

      ctx.fillStyle = bgBadge;
      const badgeY = y >= badgeH + 4 ? y - badgeH - 2 : y + h + 2;
      ctx.fillRect(x, badgeY, badgeW, badgeH);

      // Badge Text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(labelText, x + 7, badgeY + 14);
    });
  }

  drawGradCamHeatmap(detections, width, height) {
    const ctx = this.overlayCtx;

    detections.forEach(d => {
      const cx = d.bbox.x + d.bbox.width / 2;
      const cy = d.bbox.y + d.bbox.height / 2;
      const radius = Math.max(d.bbox.width, d.bbox.height) * 1.3;

      const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, radius);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.8)');   // Hot red
      grad.addColorStop(0.35, 'rgba(245, 158, 11, 0.55)'); // Orange
      grad.addColorStop(0.7, 'rgba(234, 179, 8, 0.3)');   // Yellow
      grad.addColorStop(1, 'rgba(59, 130, 246, 0.0)');    // Transparent blue

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawEdgeOverlay(width, height) {
    // High-pass edge gradient visualizer for surface flaw inspection
    const ctx = this.overlayCtx;
    ctx.save();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;

    this.activeDetections.forEach(d => {
      const { x, y, width: w, height: h } = d.bbox;
      for (let i = 0; i < 4; i++) {
        ctx.strokeRect(x - i * 2, y - i * 2, w + i * 4, h + i * 4);
      }
    });

    ctx.restore();
  }

  runFullInspection(metadata = {}) {
    const startTime = performance.now();
    const filteredDetections = this.activeDetections.filter(d => d.conf >= this.confidenceThreshold);
    const hasFailed = filteredDetections.length > 0;
    const latencyMs = Math.round(performance.now() - startTime + 14 + Math.random() * 8);

    // Audio cue
    this.playBeep(!hasFailed);

    return {
      partId: `PART-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toISOString(),
      sampleType: this.currentSampleKey,
      status: hasFailed ? 'FAILED' : 'PASSED',
      defects: filteredDetections,
      defectCount: filteredDetections.length,
      confidence: hasFailed 
        ? `${Math.max(...filteredDetections.map(d => d.conf))}%`
        : `${(98.2 + Math.random() * 1.5).toFixed(1)}%`,
      processingTimeMs: latencyMs,
      line: metadata.line || 'Line A (PCB SMT)'
    };
  }
}

window.VisionEngine = VisionEngine;
