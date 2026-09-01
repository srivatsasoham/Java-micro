/**
 * Conveyor Belt & Automated High-Speed Inspection Simulator
 * Simulates real-time industrial manufacturing assembly line with optical trigger,
 * automated AI inspection, pneumatic reject divert arm, and live throughput stats.
 */

class ConveyorSimulator {
  constructor(canvasElement, onPartInspectedCallback) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.onPartInspected = onPartInspectedCallback;

    this.isRunning = false;
    this.speed = 2.8; // px per frame
    this.defectRateSetting = 0.3; // 30% defect probability
    this.items = [];
    this.itemSpacing = 240;
    this.sensorX = 460; // Optical inspection zone center
    this.rejectArmActive = false;
    this.rejectArmAngle = 0;
    this.lastSpawnX = 0;
    this.animationFrameId = null;

    this.stats = {
      conveyorTotal: 0,
      conveyorPass: 0,
      conveyorReject: 0,
      partsPerMin: 0
    };

    this.initConveyor();
  }

  initConveyor() {
    this.items = [];
    // Spawn initial items spaced out
    const initialTypes = ['pcb', 'casting', 'weld', 'solar', 'pharma'];
    for (let x = 60; x < this.canvas.width + 300; x += this.itemSpacing) {
      const type = initialTypes[Math.floor(Math.random() * initialTypes.length)];
      const hasDefect = Math.random() < this.defectRateSetting;
      this.items.push(this.createItem(x, type, hasDefect));
    }
  }

  createItem(x, type, hasDefect) {
    return {
      id: `SN-${Math.floor(10000 + Math.random() * 90000)}`,
      x: x,
      y: 110,
      width: 140,
      height: 95,
      type: type,
      hasDefect: hasDefect,
      inspected: false,
      status: 'pending', // 'pending', 'passed', 'rejected'
      diverted: false,
      divertY: 0
    };
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  setSpeed(speedVal) {
    this.speed = speedVal;
  }

  setDefectRate(rate) {
    this.defectRateSetting = rate;
  }

  loop() {
    if (!this.isRunning) return;

    this.update();
    this.draw();

    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  update() {
    const width = this.canvas.width;
    const itemTypes = ['pcb', 'casting', 'weld', 'solar', 'pharma'];

    // Move existing items
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];

      if (item.diverted) {
        // Move downwards into reject chute
        item.x += this.speed * 0.4;
        item.y += this.speed * 1.6;
      } else {
        // Move along conveyor belt
        item.x += this.speed;

        // Check if item crossed the AI Camera Optical Trigger
        if (!item.inspected && item.x + item.width / 2 >= this.sensorX) {
          item.inspected = true;
          this.stats.conveyorTotal++;

          if (item.hasDefect) {
            item.status = 'rejected';
            this.stats.conveyorReject++;
            this.triggerRejectArm();
          } else {
            item.status = 'passed';
            this.stats.conveyorPass++;
          }

          if (this.onPartInspected) {
            this.onPartInspected(item);
          }
        }

        // Check if item should divert at reject arm
        if (item.status === 'rejected' && item.x >= this.sensorX + 90 && !item.diverted) {
          item.diverted = true;
        }
      }
    }

    // Remove offscreen items
    this.items = this.items.filter(item => item.x < width + 100 && item.y < this.canvas.height + 100);

    // Spawn new item if trailing distance allows
    const leftmostItem = this.items.reduce((min, it) => it.x < min.x ? it : min, { x: 99999 });
    if (leftmostItem.x > this.itemSpacing - 60) {
      const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
      const hasDefect = Math.random() < this.defectRateSetting;
      this.items.push(this.createItem(leftmostItem.x - this.itemSpacing, type, hasDefect));
    }

    // Animate reject arm
    if (this.rejectArmActive) {
      this.rejectArmAngle = Math.min(Math.PI / 3.8, this.rejectArmAngle + 0.12);
    } else {
      this.rejectArmAngle = Math.max(0, this.rejectArmAngle - 0.08);
    }
  }

  triggerRejectArm() {
    this.rejectArmActive = true;
    setTimeout(() => {
      this.rejectArmActive = false;
    }, 1100);
  }

  draw() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const ctx = this.ctx;

    // Clear background (Industrial Factory floor)
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Factory floor grid pattern
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Conveyor Belt Base Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 160, width, 50);

    // Main Conveyor Belt Track
    ctx.fillStyle = '#1e222d';
    ctx.fillRect(0, 100, width, 110);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 100, width, 110);

    // Belt Rollers / Segments animation
    const rollerOffset = (performance.now() * 0.08 * this.speed) % 30;
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    for (let rx = -rollerOffset; rx < width; rx += 30) {
      ctx.beginPath();
      ctx.moveTo(rx, 102);
      ctx.lineTo(rx, 208);
      ctx.stroke();
    }

    // Reject Chute (Branching down)
    ctx.fillStyle = '#181b24';
    ctx.beginPath();
    ctx.moveTo(this.sensorX + 80, 208);
    ctx.lineTo(this.sensorX + 220, height);
    ctx.lineTo(this.sensorX + 110, height);
    ctx.lineTo(this.sensorX + 20, 208);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Chute label
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('REJECT BIN (DEFECTS)', this.sensorX + 70, height - 15);

    // Draw Items
    this.items.forEach(item => {
      this.drawConveyorItem(ctx, item);
    });

    // Draw Pneumatic Reject Arm
    ctx.save();
    ctx.translate(this.sensorX + 60, 104);
    ctx.rotate(this.rejectArmAngle);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, -6, 90, 12);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, -6, 90, 12);
    // Arm pivot circle
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // AI Vision Inspection Gantry & Camera Housing
    this.drawInspectionGantry(ctx, width);
  }

  drawConveyorItem(ctx, item) {
    ctx.save();
    ctx.translate(item.x, item.y);

    // Item Carrier Tray
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, item.width, item.height);
    ctx.strokeStyle = item.status === 'passed' ? '#10b981' : (item.status === 'rejected' ? '#ef4444' : '#64748b');
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, item.width, item.height);

    // Inner Mini-Component Render
    const sample = window.IndustrialDataset.samples[item.type];
    if (sample) {
      ctx.save();
      // Clip inner
      ctx.beginPath();
      ctx.rect(5, 5, item.width - 10, item.height - 10);
      ctx.clip();
      // Scale down sample render
      ctx.scale((item.width - 10) / 600, (item.height - 10) / 400);
      ctx.translate(5, 5);
      sample.render(ctx, 600, 400, item.hasDefect);
      ctx.restore();
    }

    // Status Ribbon
    if (item.inspected) {
      const isPass = item.status === 'passed';
      ctx.fillStyle = isPass ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)';
      ctx.fillRect(item.width - 60, 4, 56, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(isPass ? 'PASS' : 'REJECT', item.width - 52, 16);
    }

    // Serial Tag
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '8px monospace';
    ctx.fillText(item.id, 8, item.height - 6);

    ctx.restore();
  }

  drawInspectionGantry(ctx, width) {
    const cx = this.sensorX;

    // Gantry Struts
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - 50, 0); ctx.lineTo(cx - 50, 100);
    ctx.moveTo(cx + 50, 0); ctx.lineTo(cx + 50, 100);
    ctx.moveTo(cx - 65, 30); ctx.lineTo(cx + 65, 30);
    ctx.stroke();

    // Camera Body
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(cx - 30, 20, 60, 36);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 30, 20, 60, 36);

    // Lens
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx, 56, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    // Laser Optical Trigger Beam
    const scanPulse = (Math.sin(performance.now() * 0.008) + 1) * 0.5;
    ctx.save();
    const beamGrad = ctx.createLinearGradient(cx, 56, cx, 210);
    beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.7)');
    beamGrad.addColorStop(0.5, `rgba(56, 189, 248, ${0.15 + scanPulse * 0.2})`);
    beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0.8)');

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 8, 56);
    ctx.lineTo(cx + 8, 56);
    ctx.lineTo(cx + 70, 210);
    ctx.lineTo(cx - 70, 210);
    ctx.closePath();
    ctx.fill();

    // Laser Scan Line
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 70, 200);
    ctx.lineTo(cx + 70, 200);
    ctx.stroke();
    ctx.restore();

    // Status Indicator LED on Gantry
    ctx.fillStyle = this.isRunning ? '#10b981' : '#f59e0b';
    ctx.beginPath();
    ctx.arc(cx + 20, 30, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 10;
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 0;
  }
}

window.ConveyorSimulator = ConveyorSimulator;
