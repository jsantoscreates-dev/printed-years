import { CanvasTexture, LinearFilter } from 'three';

const TITLES = [
  'Meridian', 'Nocturne', 'Vertex', 'Solstice', 'Cascade',
  'Prism', 'Zenith', 'Flux', 'Ember', 'Drift',
  'Axiom', 'Pulse', 'Vortex', 'Horizon', 'Echo',
  'Spectra', 'Nova', 'Stratum', 'Cipher', 'Radiant',
  'Monolith', 'Fractal', 'Umbra', 'Apex', 'Lumen',
  'Orbital', 'Genesis', 'Mirage', 'Catalyst', 'Ethereal',
];

const DATES = [
  '2024', '2024', '2024', '2024', '2024',
  '2023', '2023', '2023', '2023', '2023',
  '2023', '2023', '2022', '2022', '2022',
  '2022', '2022', '2022', '2022', '2022',
  '2021', '2021', '2021', '2021', '2021',
  '2021', '2021', '2021', '2021', '2021',
];

export function generatePosterTexture(index: number): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 360;
  canvas.height = 480;
  const ctx = canvas.getContext('2d')!;

  const title = TITLES[index % TITLES.length];
  const date = DATES[index % DATES.length];

  // Base - varied greys
  const bg = 200 + (index * 7 % 40) - 20;
  ctx.fillStyle = `rgb(${bg},${bg},${bg})`;
  ctx.fillRect(0, 0, 360, 480);

  const style = index % 6;
  const fg = bg - 55 - (index % 3) * 10;

  if (style === 0) {
    // Big letter typography
    ctx.fillStyle = `rgb(${fg},${fg},${fg})`;
    ctx.font = '900 140px "Helvetica Neue", Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Aa', 180, 210);
    ctx.fillRect(110, 310, 140, 2);
    ctx.font = '300 14px "Helvetica Neue", Helvetica, sans-serif';
    ctx.fillText(title.toUpperCase(), 180, 345);
  } else if (style === 1) {
    // Concentric circles
    ctx.strokeStyle = `rgb(${fg},${fg},${fg})`;
    ctx.lineWidth = 1.5;
    for (let j = 0; j < 5; j++) {
      ctx.beginPath();
      ctx.arc(180, 220, 35 + j * 32, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = `rgb(${fg},${fg},${fg})`;
    ctx.beginPath();
    ctx.arc(180, 220, 16, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === 2) {
    // Gradient block (photo simulation)
    const gradient = ctx.createLinearGradient(0, 0, 0, 480);
    gradient.addColorStop(0, `rgb(${fg},${fg},${fg})`);
    gradient.addColorStop(0.65, `rgb(${fg + 35},${fg + 35},${fg + 35})`);
    gradient.addColorStop(1, `rgb(${bg - 10},${bg - 10},${bg - 10})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(25, 25, 310, 340);
    ctx.fillStyle = `rgb(${fg + 15},${fg + 15},${fg + 15})`;
    ctx.font = '400 13px "Helvetica Neue", Helvetica, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, 25, 405);
    ctx.font = '300 11px "Helvetica Neue", Helvetica, sans-serif';
    ctx.fillText(date, 25, 425);
  } else if (style === 3) {
    // Horizontal lines
    ctx.strokeStyle = `rgb(${fg},${fg},${fg})`;
    ctx.lineWidth = 1;
    for (let j = 0; j < 12; j++) {
      const y = 60 + j * 30;
      ctx.beginPath();
      ctx.moveTo(30 + (j * 37 % 100), y);
      ctx.lineTo(330 - (j * 23 % 80), y);
      ctx.stroke();
    }
    ctx.fillStyle = `rgb(${fg},${fg},${fg})`;
    ctx.beginPath();
    ctx.arc(180, 440, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === 4) {
    // Block grid
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 4; c++) {
        if (((r + c + index) % 3) !== 0) {
          const shade = fg + ((r * c * index) % 25);
          ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
          ctx.fillRect(25 + c * 82, 35 + r * 82, 68, 68);
        }
      }
    }
  } else {
    // Triangle
    ctx.fillStyle = `rgb(${fg},${fg},${fg})`;
    ctx.beginPath();
    ctx.moveTo(180, 60);
    ctx.lineTo(310, 320);
    ctx.lineTo(50, 320);
    ctx.closePath();
    ctx.fill();
    ctx.font = '700 26px "Helvetica Neue", Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title.toUpperCase(), 180, 395);
    ctx.fillRect(130, 410, 100, 1);
  }

  // Grain/noise overlay
  const imageData = ctx.getImageData(0, 0, 360, 480);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 14;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;

  return texture;
}
