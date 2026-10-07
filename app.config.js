const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// Exact SVG polygons from user specification:
// <svg width="63" height="59" viewBox="0 0 63 59" fill="none" xmlns="http://www.w3.org/2000/svg">
//   <path d="M27.7696 33.9423L19.6599 20.6719L9.82994 38.4886L0 56.3054H15.7279L27.7696 33.9423Z" fill="#F54900"/>
//   <path d="M29.4812 1.44167L22.3329 16.7865L46.3377 56.2469L62.666 56.2469L29.4812 1.44167Z" fill="#F54900"/>
// </svg>
const POLY_1 = [
  [27.7696, 33.9423],
  [19.6599, 20.6719],
  [9.82994, 38.4886],
  [0.0, 56.3054],
  [15.7279, 56.3054],
];

const POLY_2 = [
  [29.4812, 1.44167],
  [22.3329, 16.7865],
  [46.3377, 56.2469],
  [62.666, 56.2469],
];

const SVG_WIDTH = 62.666;
const SVG_MIN_Y = 1.44167;
const SVG_MAX_Y = 56.3054;
const SVG_HEIGHT = SVG_MAX_Y - SVG_MIN_Y;
const SVG_CENTER_X = SVG_WIDTH / 2;
const SVG_CENTER_Y = (SVG_MIN_Y + SVG_MAX_Y) / 2;

function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const yi = poly[i][1];
    const xj = poly[j][0];
    const yj = poly[j][1];
    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function isInsideLogo(vx, vy) {
  return pointInPolygon(vx, vy, POLY_1) || pointInPolygon(vx, vy, POLY_2);
}

// Precompute CRC32 table for PNG chunks
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makePngChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function renderLogoPngBuffer({
  size = 512,
  scaleFraction = 0.62,
  fgColor = [245, 73, 0, 255], // #F54900
  bgColor = [255, 255, 255, 255], // Solid white or transparent [0,0,0,0]
}) {
  const rawStride = size * 4 + 1;
  const rawData = Buffer.alloc(rawStride * size);

  const targetLogoSize = size * scaleFraction;
  const scale = targetLogoSize / Math.max(SVG_WIDTH, SVG_HEIGHT);
  const halfCanvas = size / 2;

  // Pixel bounding box of the logo on canvas
  const minPx = Math.max(0, Math.floor(halfCanvas - (SVG_WIDTH / 2) * scale - 2));
  const maxPx = Math.min(size - 1, Math.ceil(halfCanvas + (SVG_WIDTH / 2) * scale + 2));
  const minPy = Math.max(0, Math.floor(halfCanvas - (SVG_HEIGHT / 2) * scale - 2));
  const maxPy = Math.min(size - 1, Math.ceil(halfCanvas + (SVG_HEIGHT / 2) * scale + 2));

  const [bgR, bgG, bgB, bgA] = bgColor;
  const [fgR, fgG, fgB, fgA] = fgColor;

  // Fill background first
  for (let y = 0; y < size; y++) {
    const rowStart = y * rawStride;
    rawData[rowStart] = 0; // PNG filter 0
    if (bgA > 0) {
      for (let x = 0; x < size; x++) {
        const idx = rowStart + 1 + x * 4;
        rawData[idx] = bgR;
        rawData[idx + 1] = bgG;
        rawData[idx + 2] = bgB;
        rawData[idx + 3] = bgA;
      }
    }
  }

  // Render 4x4 supersampled anti-aliased polygon inside bounding box
  const subSamples = 4;
  const totalSub = subSamples * subSamples;

  for (let py = minPy; py <= maxPy; py++) {
    const rowStart = py * rawStride;
    for (let px = minPx; px <= maxPx; px++) {
      let hits = 0;
      for (let sy = 0; sy < subSamples; sy++) {
        const sampleY = py + (sy + 0.5) / subSamples;
        const vy = (sampleY - halfCanvas) / scale + SVG_CENTER_Y;
        for (let sx = 0; sx < subSamples; sx++) {
          const sampleX = px + (sx + 0.5) / subSamples;
          const vx = (sampleX - halfCanvas) / scale + SVG_CENTER_X;
          if (isInsideLogo(vx, vy)) {
            hits++;
          }
        }
      }

      if (hits > 0) {
        const cov = hits / totalSub;
        const idx = rowStart + 1 + px * 4;
        if (bgA === 0) {
          rawData[idx] = fgR;
          rawData[idx + 1] = fgG;
          rawData[idx + 2] = fgB;
          rawData[idx + 3] = Math.round(cov * fgA);
        } else {
          rawData[idx] = Math.round(fgR * cov + bgR * (1 - cov));
          rawData[idx + 1] = Math.round(fgG * cov + bgG * (1 - cov));
          rawData[idx + 2] = Math.round(fgB * cov + bgB * (1 - cov));
          rawData[idx + 3] = 255;
        }
      }
    }
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const compressed = zlib.deflateSync(rawData, { level: 6 });

  return Buffer.concat([
    signature,
    makePngChunk("IHDR", ihdr),
    makePngChunk("IDAT", compressed),
    makePngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function ensureBrandIconAssets() {
  try {
    const imagesDir = path.join(__dirname, "assets", "images");
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    // 1. App Icon (icon.png) - White background with #F54900 logo
    const iconBuf = renderLogoPngBuffer({
      size: 512,
      scaleFraction: 0.62,
      fgColor: [245, 73, 0, 255],
      bgColor: [255, 255, 255, 255],
    });
    fs.writeFileSync(path.join(imagesDir, "icon.png"), iconBuf);

    // 2. Splash Screen Icon (splash-icon.png) - Centered #F54900 logo on transparent background
    const splashBuf = renderLogoPngBuffer({
      size: 512,
      scaleFraction: 0.68,
      fgColor: [245, 73, 0, 255],
      bgColor: [0, 0, 0, 0],
    });
    fs.writeFileSync(path.join(imagesDir, "splash-icon.png"), splashBuf);

    // 3. Android Adaptive Icon Foreground (android-icon-foreground.png) - Safe-zone scaled #F54900 logo
    const adaptiveFgBuf = renderLogoPngBuffer({
      size: 512,
      scaleFraction: 0.48,
      fgColor: [245, 73, 0, 255],
      bgColor: [0, 0, 0, 0],
    });
    fs.writeFileSync(
      path.join(imagesDir, "android-icon-foreground.png"),
      adaptiveFgBuf
    );

    // 4. Android Adaptive Icon Background (android-icon-background.png) - Clean solid white
    const adaptiveBgBuf = renderLogoPngBuffer({
      size: 256,
      scaleFraction: 0,
      fgColor: [255, 255, 255, 255],
      bgColor: [255, 255, 255, 255],
    });
    fs.writeFileSync(
      path.join(imagesDir, "android-icon-background.png"),
      adaptiveBgBuf
    );

    // 5. Android Monochrome Icon (android-icon-monochrome.png)
    const monoBuf = renderLogoPngBuffer({
      size: 512,
      scaleFraction: 0.48,
      fgColor: [255, 255, 255, 255],
      bgColor: [0, 0, 0, 0],
    });
    fs.writeFileSync(
      path.join(imagesDir, "android-icon-monochrome.png"),
      monoBuf
    );

    // 6. Web Favicon (favicon.png)
    const faviconBuf = renderLogoPngBuffer({
      size: 128,
      scaleFraction: 0.72,
      fgColor: [245, 73, 0, 255],
      bgColor: [0, 0, 0, 0],
    });
    fs.writeFileSync(path.join(imagesDir, "favicon.png"), faviconBuf);
  } catch (err) {
    console.warn("Could not auto-generate brand icon assets:", err?.message);
  }
}

// Generate all PNG assets immediately when Expo / EAS loads app.config.js
ensureBrandIconAssets();

module.exports = ({ config }) => {
  return {
    ...config,
    icon: "./assets/images/icon.png",
    android: {
      ...(config.android || {}),
      package: "com.coachingguru.app",
      adaptiveIcon: {
        backgroundColor: "#FFFFFF",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 160,
          resizeMode: "contain",
          backgroundColor: "#FFFFFF",
          dark: {
            image: "./assets/images/splash-icon.png",
            backgroundColor: "#FFFFFF",
          },
        },
      ],
      "expo-font",
      "expo-image",
      "expo-web-browser",
    ],
  };
};
