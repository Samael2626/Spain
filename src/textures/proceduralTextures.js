import * as THREE from 'three';

// Ultra-High Definition 2K Procedural Textures for JIMKEG™ 3D Studio

/**
 * Photorealistic Arctic / Multi-Terrain Tactical Camouflage Texture
 * Resolution: 2048x2048
 */
export function createCamoTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // 1. Deep Volcanic Slate Base
  ctx.fillStyle = '#1c2026';
  ctx.fillRect(0, 0, 1024, 1024);

  // 2. High-Fidelity Tactical Multicam Layers
  const camoColors = [
    '#2c323c', // Slate grey
    '#444c58', // Mid wolf grey
    '#687282', // Frost arctic grey
    '#9ea8b6', // Light titanium grey
    '#16191f', // Stealth dark carbon
    '#808b9b', // Cold alpine grey
  ];

  // Geometric multi-angle polygon clusters (Military Splinter/Multicam pattern)
  camoColors.forEach((color, layerIdx) => {
    ctx.fillStyle = color;
    const numPatches = 14 + layerIdx * 4;

    for (let i = 0; i < numPatches; i++) {
      ctx.beginPath();
      let startX = (i * 68.75 + layerIdx * 105.5) % 1024;
      let startY = ((i * 194.5 + layerIdx * 270.5) % 1024);
      ctx.moveTo(startX, startY);

      const numVertices = 7 + (i % 6);
      const baseRadius = 60 + ((i * 23) % 90);

      for (let v = 0; v < numVertices; v++) {
        const angle = (v / numVertices) * Math.PI * 2;
        const radiusNoise = baseRadius * (0.6 + (((v * 31 + i * 17) % 70) / 100));
        const px = startX + Math.cos(angle) * radiusNoise;
        const py = startY + Math.sin(angle) * radiusNoise;

        if (v === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
  });

  // 3. Tactical Ripstop Grid Weave
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.lineWidth = 1.0;
  const gridSize = 16;
  for (let x = 0; x < 1024; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y < 1024; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // 4. Horizontal MOLLE Webbing Bands
  const molleBands = [240, 440, 640];
  molleBands.forEach((bandY) => {
    ctx.fillStyle = 'rgba(15, 18, 23, 0.78)';
    ctx.fillRect(0, bandY, 1024, 55);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, bandY);
    ctx.lineTo(1024, bandY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.moveTo(0, bandY + 55);
    ctx.lineTo(1024, bandY + 55);
    ctx.stroke();

    for (let x = 30; x < 1024; x += 90) {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x, bandY + 3, 4, 49);
      ctx.fillStyle = '#0a0c10';
      ctx.fillRect(x + 1, bandY + 4, 2, 47);
    }
  });

  // 5. Molded Tactical Rubber Brand Patch
  ctx.save();
  ctx.translate(512, 790);

  ctx.fillStyle = '#0d0f14';
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-180, -65, 360, 130, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#141820';
  ctx.beginPath();
  ctx.roundRect(-170, -55, 340, 110, 8);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 42px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('JIMKEG', 0, -14);

  ctx.fillStyle = '#f59e0b';
  ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('TACTICAL 2.2L • HYDRATION JUG', 0, 24);

  ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-140, 42);
  ctx.lineTo(140, 42);
  ctx.stroke();

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Stealth Obsidian Black Tactical Texture with Carbon Honeycomb Weave
 * Resolution: 1024x1024
 */
export function createBlackStealthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // 1. Deep Matte Obsidian Base
  ctx.fillStyle = '#111317';
  ctx.fillRect(0, 0, 1024, 1024);

  // 2. Micro Carbon Grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1.0;
  const step = 14;
  for (let x = 0; x < 1024; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y < 1024; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // 3. Tactical Molle Bands
  const molleBands = [240, 440, 640];
  molleBands.forEach((bandY) => {
    ctx.fillStyle = '#0c0d10';
    ctx.fillRect(0, bandY, 1024, 55);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, bandY);
    ctx.lineTo(1024, bandY);
    ctx.stroke();

    for (let x = 30; x < 1024; x += 90) {
      ctx.fillStyle = '#262a33';
      ctx.fillRect(x, bandY + 3, 4, 49);
    }
  });

  // 4. Stealth Matte Rubber Patch
  ctx.save();
  ctx.translate(512, 790);

  ctx.fillStyle = '#0a0b0e';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-180, -65, 360, 130, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#14161c';
  ctx.beginPath();
  ctx.roundRect(-170, -55, 340, 110, 8);
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 42px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('JIMKEG', 0, -14);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('OBSIDIAN SPEC • 2200 ML', 0, 24);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-140, 42);
  ctx.lineTo(140, 42);
  ctx.stroke();

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Cordura Tactical Fabric Weave Bump Texture
 * Resolution: 512x512
 */
export function createNeopreneBumpTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);

  // Woven thread pattern
  ctx.fillStyle = '#a8a8a8';
  for (let x = 0; x < 512; x += 8) {
    for (let y = 0; y < 512; y += 8) {
      if ((x + y) % 16 === 0) {
        ctx.fillRect(x, y, 4, 4);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Hydration Measurement Scale for Inner Tritan Jug
 * Resolution: 1024x2048
 */
export function createMeasurementTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 512, 1024);

  const marks = [
    { y: 180, ml: '2200 ML', oz: '74 OZ', text: '08:00 · INICIO DE JORNADA' },
    { y: 340, ml: '1750 ML', oz: '59 OZ', text: '11:00 · MANTÉN EL RITMO' },
    { y: 500, ml: '1250 ML', oz: '42 OZ', text: '14:00 · MITAD DEL DÍA' },
    { y: 660, ml: '750 ML', oz: '25 OZ', text: '17:00 · CASI LO LOGRAS' },
    { y: 820, ml: '250 ML', oz: '8 OZ', text: '20:00 · META CUMPLIDA' },
  ];

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 3;

  marks.forEach((m) => {
    // Primary tick
    ctx.beginPath();
    ctx.moveTo(30, m.y);
    ctx.lineTo(80, m.y);
    ctx.stroke();

    // Intermediate sub-ticks
    for (let offset = 30; offset < 150; offset += 30) {
      if (m.y + offset < 950) {
        ctx.beginPath();
        ctx.moveTo(30, m.y + offset);
        ctx.lineTo(55, m.y + offset);
        ctx.stroke();
      }
    }

    // Typography
    ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(m.ml, 95, m.y - 3);

    ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(m.oz, 220, m.y - 3);

    ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fillText(m.text, 95, m.y + 20);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Smartphone Active Screen Texture (Apple Watch/Garmin Fitness UI)
 * Resolution: 512x1024
 */
export function createPhoneScreenTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Phone OLED dark display
  ctx.fillStyle = '#06080b';
  ctx.fillRect(0, 0, 512, 1024);

  // Top Status Bar
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 28px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('09:41', 50, 70);

  // Circular Activity Hydration Ring
  const cx = 256;
  const cy = 380;
  const radius = 130;

  // Background ring
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Progress ring (Amber / Cyan)
  const grad = ctx.createLinearGradient(120, 240, 380, 500);
  grad.addColorStop(0, '#f59e0b');
  grad.addColorStop(1, '#10b981');
  ctx.strokeStyle = grad;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, -Math.PI / 2, Math.PI * 0.95);
  ctx.stroke();

  // Ring Center Stats
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 58px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('1.8L', cx, cy - 10);

  ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('/ 2.2L META', cx, cy + 35);

  // Training Metrics Cards
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.beginPath();
  ctx.roundRect(40, 580, 432, 110, 20);
  ctx.fill();

  ctx.fillStyle = '#f59e0b';
  ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('INTAKE RECOMENDADO', 70, 625);

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Próximo trago: 250ml a las 11:00', 70, 660);

  // Bottom Quick Action Bar
  ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
  ctx.beginPath();
  ctx.roundRect(40, 730, 432, 100, 20);
  ctx.fill();

  ctx.fillStyle = '#f59e0b';
  ctx.font = '800 26px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('+ REGISTRAR TOMA DE AGUA', 256, 790);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Woven Nylon Tactical Webbing Texture for Straps & Paracord
 */
export function createWebbingTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#181b20';
  ctx.fillRect(0, 0, 256, 256);

  // Longitudinal weave lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 2;
  for (let x = 0; x < 256; x += 6) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }

  // Cross stitch texture
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  for (let y = 0; y < 256; y += 8) {
    ctx.fillRect(0, y, 256, 3);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 32);
  texture.needsUpdate = true;
  return texture;
}
