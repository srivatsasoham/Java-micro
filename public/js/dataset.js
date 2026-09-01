/**
 * Industrial Dataset & Procedural Component Generator
 * Renders crisp, realistic industrial components to HTML5 Canvas
 * with selectable defect injections for live Computer Vision inspection.
 */

const IndustrialDataset = {
  samples: {
    pcb: {
      name: 'PCB Surface-Mount Board (SMT)',
      category: 'Electronics Manufacturing',
      resolution: '4K Micro-Optical',
      nominalCycleTime: '18 ms',
      render: function(ctx, width, height, defectMode) {
        // PCB Substrate background (Industrial Emerald Green)
        ctx.fillStyle = '#064e3b';
        ctx.fillRect(0, 0, width, height);

        // Grid texture / Substrate weave
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.15;
        for (let x = 0; x < width; x += 16) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += 16) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1.0;

        // Copper Traces
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Trace paths
        ctx.moveTo(40, 80); ctx.lineTo(120, 80); ctx.lineTo(160, 120); ctx.lineTo(260, 120);
        ctx.moveTo(40, 100); ctx.lineTo(100, 100); ctx.lineTo(140, 140); ctx.lineTo(260, 140);
        ctx.moveTo(40, 280); ctx.lineTo(140, 280); ctx.lineTo(180, 240); ctx.lineTo(340, 240);
        ctx.moveTo(300, 80); ctx.lineTo(380, 80); ctx.lineTo(440, 140); ctx.lineTo(500, 140);
        ctx.moveTo(320, 320); ctx.lineTo(400, 320); ctx.lineTo(450, 270); ctx.lineTo(520, 270);
        ctx.stroke();

        // IC Chip 1 (Microcontroller)
        ctx.fillStyle = '#18181b';
        ctx.fillRect(260, 110, 110, 110);
        ctx.fillStyle = '#71717a';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('ARM CORTEX-M4', 270, 160);
        ctx.fillText('STM32F401', 280, 175);
        // Pin 1 dot
        ctx.fillStyle = '#e4e4e7';
        ctx.beginPath();
        ctx.arc(272, 122, 3, 0, Math.PI * 2);
        ctx.fill();

        // IC Pins (Gold/Solder plated)
        for (let i = 0; i < 6; i++) {
          // Left pins
          ctx.fillStyle = (defectMode && i === 3) ? '#f59e0b' : '#e2e8f0';
          ctx.fillRect(245, 120 + i * 16, 15, 8);
          // Right pins
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(370, 120 + i * 16, 15, 8);
        }

        // SMT Capacitors & Resistors
        const smdComponents = [
          { x: 100, y: 74, w: 20, h: 12, label: 'R1' },
          { x: 140, y: 194, w: 22, h: 14, label: 'C12' },
          { x: 420, y: 134, w: 20, h: 12, label: 'R4' },
          { x: 440, y: 264, w: 24, h: 14, label: 'C8' },
          { x: 180, y: 310, w: 22, h: 14, label: 'R9' }
        ];

        smdComponents.forEach((c, idx) => {
          if (defectMode && idx === 1) {
            // Defect: Missing C12 Component (Only bare solder pads)
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(c.x, c.y, 6, c.h);
            ctx.fillRect(c.x + c.w - 6, c.y, 6, c.h);
            ctx.fillStyle = '#ef4444';
            ctx.font = '9px sans-serif';
            ctx.fillText('EMPTY PAD', c.x - 4, c.y + c.h + 12);
          } else {
            // Normal SMT Component
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(c.x, c.y, c.w, c.h);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(c.x + 4, c.y, c.w - 8, c.h);
            ctx.fillStyle = '#f8fafc';
            ctx.font = '8px monospace';
            ctx.fillText(c.label, c.x + 5, c.y + c.h - 3);
          }
        });

        // Test Points / Vias
        for (let i = 0; i < 8; i++) {
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(80 + (i % 4) * 35, 230 + Math.floor(i / 4) * 35, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#064e3b';
          ctx.beginPath();
          ctx.arc(80 + (i % 4) * 35, 230 + Math.floor(i / 4) * 35, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Defect Injections if defectMode is active
        if (defectMode) {
          // 1. Solder Bridge between Pin 3 and Pin 4
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.arc(248, 172, 8, 0, Math.PI * 2);
          ctx.fill();

          // 2. Substrate Hairline Crack
          ctx.strokeStyle = '#111827';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(80, 290);
          ctx.lineTo(95, 305);
          ctx.lineTo(115, 300);
          ctx.lineTo(140, 325);
          ctx.stroke();
        }
      },
      defects: [
        {
          type: 'Solder Bridge',
          severity: 'Critical',
          description: 'Short circuit between IC Pin 3 & Pin 4',
          bbox: { x: 236, y: 160, width: 28, height: 26 },
          conf: 98.6
        },
        {
          type: 'Missing Component',
          severity: 'Major',
          description: 'C12 SMD Filter Capacitor not populated',
          bbox: { x: 132, y: 186, width: 36, height: 30 },
          conf: 96.2
        },
        {
          type: 'Surface Micro-Crack',
          severity: 'Major',
          description: 'Dielectric substrate fracture across thermal zone',
          bbox: { x: 74, y: 284, width: 72, height: 46 },
          conf: 93.8
        }
      ]
    },

    casting: {
      name: 'Precision Metal Gear (CNC)',
      category: 'Automotive Powertrain',
      resolution: 'High-Res Laser Profiler',
      nominalCycleTime: '22 ms',
      render: function(ctx, width, height, defectMode) {
        // Metallic cast background
        const grad = ctx.createRadialGradient(width/2, height/2, 20, width/2, height/2, width/2);
        grad.addColorStop(0, '#475569');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;
        const radius = 130;
        const teeth = 18;

        // Gear Outer Profile with Teeth
        ctx.save();
        ctx.translate(cx, cy);
        ctx.beginPath();
        ctx.fillStyle = '#64748b';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;

        for (let i = 0; i < teeth; i++) {
          const angle = (i * 2 * Math.PI) / teeth;
          const nextAngle = ((i + 0.5) * 2 * Math.PI) / teeth;
          const outerR = radius + 22;
          const innerR = radius;

          const x1 = Math.cos(angle) * innerR;
          const y1 = Math.sin(angle) * innerR;
          const x2 = Math.cos(angle + 0.1) * outerR;
          const y2 = Math.sin(angle + 0.1) * outerR;
          const x3 = Math.cos(nextAngle - 0.1) * outerR;
          const y3 = Math.sin(nextAngle - 0.1) * outerR;
          const x4 = Math.cos(nextAngle) * innerR;
          const y4 = Math.sin(nextAngle) * innerR;

          if (i === 0) ctx.moveTo(x1, y1);
          else ctx.lineTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x3, y3);
          ctx.lineTo(x4, y4);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner Recess Ring
        ctx.beginPath();
        ctx.arc(0, 0, 75, 0, Math.PI * 2);
        ctx.fillStyle = '#334155';
        ctx.fill();
        ctx.stroke();

        // Center Bore Hole with Keyway
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        // Keyway slot
        ctx.fillRect(-6, -38, 12, 16);

        ctx.restore();

        // Defect Injections
        if (defectMode) {
          // 1. Gas Porosity Voids
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.arc(cx - 45, cy + 35, 6, 0, Math.PI * 2);
          ctx.arc(cx - 38, cy + 42, 4, 0, Math.PI * 2);
          ctx.arc(cx - 50, cy + 48, 3, 0, Math.PI * 2);
          ctx.fill();

          // 2. Heavy Tooling Gouge / Surface Scratch
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx + 40, cy - 60);
          ctx.lineTo(cx + 85, cy - 25);
          ctx.lineTo(cx + 105, cy - 10);
          ctx.stroke();
        }
      },
      defects: [
        {
          type: 'Porosity Void',
          severity: 'Critical',
          description: 'Subsurface gas entrapment cluster (>3.2mm)',
          bbox: { x: 235, y: 220, width: 38, height: 38 },
          conf: 97.4
        },
        {
          type: 'Scratches / Abrasions',
          severity: 'Minor',
          description: 'Rotational tooling abrasion on face flange',
          bbox: { x: 330, y: 130, width: 75, height: 55 },
          conf: 91.5
        }
      ]
    },

    weld: {
      name: 'Robotic Laser Weld Seam',
      category: 'Heavy Industry & Structural',
      resolution: 'Thermal & Visible Fusion',
      nominalCycleTime: '24 ms',
      render: function(ctx, width, height, defectMode) {
        // Steel base plates
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, width, height);

        // Heat Affected Zone (HAZ)
        const hazGrad = ctx.createLinearGradient(0, height/2 - 60, 0, height/2 + 60);
        hazGrad.addColorStop(0, '#1e293b');
        hazGrad.addColorStop(0.3, '#334155');
        hazGrad.addColorStop(0.5, '#475569');
        hazGrad.addColorStop(0.7, '#334155');
        hazGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = hazGrad;
        ctx.fillRect(0, height/2 - 60, width, 120);

        // Weld Seam Ripples (Chevron bead pattern)
        for (let x = 20; x < width - 20; x += 18) {
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.ellipse(x, height/2, 14, 26, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Defect Injections
        if (defectMode) {
          // 1. Longitudinal Weld Bead Crack
          ctx.strokeStyle = '#090d16';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(140, height/2 - 4);
          ctx.lineTo(190, height/2 + 3);
          ctx.lineTo(240, height/2 - 6);
          ctx.lineTo(290, height/2 + 2);
          ctx.stroke();

          // 2. Porosity Blowhole
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.arc(380, height/2 - 12, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#f87171';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      },
      defects: [
        {
          type: 'Surface Micro-Crack',
          severity: 'Critical',
          description: 'Longitudinal solidification hot crack in weld centerline',
          bbox: { x: 130, y: 175, width: 170, height: 40 },
          conf: 98.9
        },
        {
          type: 'Porosity Void',
          severity: 'Critical',
          description: 'Surface breaking gas blowhole exceeding ASTM E390 spec',
          bbox: { x: 366, y: 170, width: 30, height: 30 },
          conf: 95.8
        }
      ]
    },

    solar: {
      name: 'Monocrystalline Solar Cell Wafer',
      category: 'Renewable Energy',
      resolution: 'Electroluminescence (EL) Sensor',
      nominalCycleTime: '15 ms',
      render: function(ctx, width, height, defectMode) {
        // Dark blue silicon wafer
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(30, 30, width - 60, height - 60);

        // Chamfered corners (monocrystalline wafer shape)
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(30, 30); ctx.lineTo(70, 30); ctx.lineTo(30, 70); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(width - 30, 30); ctx.lineTo(width - 70, 30); ctx.lineTo(width - 30, 70); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(30, height - 30); ctx.lineTo(70, height - 30); ctx.lineTo(30, height - 70); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(width - 30, height - 30); ctx.lineTo(width - 70, height - 30); ctx.lineTo(width - 30, height - 70); ctx.fill();

        // Silver Busbars (Vertical lines)
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 5;
        const busbars = [150, 300, 450];
        busbars.forEach((bx, idx) => {
          if (defectMode && idx === 1) {
            // Broken busbar defect
            ctx.beginPath();
            ctx.moveTo(bx, 40); ctx.lineTo(bx, 160);
            ctx.moveTo(bx, 200); ctx.lineTo(bx, height - 40);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(bx, 40); ctx.lineTo(bx, height - 40);
            ctx.stroke();
          }
        });

        // Fine grid fingers (horizontal)
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.4;
        for (let y = 45; y < height - 45; y += 12) {
          ctx.beginPath();
          ctx.moveTo(40, y);
          ctx.lineTo(width - 40, y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1.0;

        // Defect Injections
        if (defectMode) {
          // 1. Dendritic Micro-Crack (EL dark line)
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(320, 240);
          ctx.lineTo(360, 270);
          ctx.lineTo(410, 260);
          ctx.lineTo(440, 310);
          ctx.stroke();
        }
      },
      defects: [
        {
          type: 'Missing Component',
          severity: 'Major',
          description: 'Center silver metallization busbar interruption',
          bbox: { x: 288, y: 150, width: 25, height: 60 },
          conf: 97.2
        },
        {
          type: 'Surface Micro-Crack',
          severity: 'Critical',
          description: 'Electroluminescent micro-crack propagation across wafer active area',
          bbox: { x: 310, y: 230, width: 140, height: 90 },
          conf: 94.7
        }
      ]
    },

    pharma: {
      name: 'Pharmaceutical Tablet Blister Pack',
      category: 'Pharma & Packaging',
      resolution: 'High-Speed Vision Inspector',
      nominalCycleTime: '12 ms',
      render: function(ctx, width, height, defectMode) {
        // Silver foil blister sheet
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(40, 30, width - 80, height - 60);

        // Blister pack grid (2x5 cavities)
        const cols = 5;
        const rows = 2;
        const startX = 80;
        const startY = 90;
        const stepX = 90;
        const stepY = 140;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const px = startX + c * stepX;
            const py = startY + r * stepY;

            // Blister cavity outer ring
            ctx.fillStyle = '#94a3b8';
            ctx.beginPath();
            ctx.arc(px, py, 32, 0, Math.PI * 2);
            ctx.fill();

            // Check for missing tablet defect
            if (defectMode && r === 1 && c === 2) {
              // Missing tablet in cavity
              ctx.fillStyle = '#64748b';
              ctx.beginPath();
              ctx.arc(px, py, 26, 0, Math.PI * 2);
              ctx.fill();
            } else if (defectMode && r === 0 && c === 4) {
              // Broken / Chipped tablet
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(px, py, 24, 0, Math.PI * 1.5);
              ctx.fill();
            } else {
              // Intact Tablet (White coated capsule/tablet)
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(px, py, 24, 0, Math.PI * 2);
              ctx.fill();

              // Tablet score line
              ctx.strokeStyle = '#cbd5e1';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(px - 14, py);
              ctx.lineTo(px + 14, py);
              ctx.stroke();
            }
          }
        }
      },
      defects: [
        {
          type: 'Missing Component',
          severity: 'Critical',
          description: 'Pocket (Row 2, Col 3) completely empty - missing dosage unit',
          bbox: { x: 220, y: 190, width: 80, height: 80 },
          conf: 99.4
        },
        {
          type: 'Scratches / Abrasions',
          severity: 'Major',
          description: 'Chipped tablet geometry & defective blister perimeter seal',
          bbox: { x: 400, y: 50, width: 80, height: 80 },
          conf: 96.5
        }
      ]
    }
  }
};

window.IndustrialDataset = IndustrialDataset;
