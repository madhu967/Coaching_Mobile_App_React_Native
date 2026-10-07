import React from "react";
import { Image, View } from "react-native";

// Exact SVG polygons:
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

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

function crc32(bytes, start, end) {
  let c = 0xffffffff;
  for (let i = start; i < end; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function writeUInt32BE(arr, offset, val) {
  arr[offset] = (val >>> 24) & 0xff;
  arr[offset + 1] = (val >>> 16) & 0xff;
  arr[offset + 2] = (val >>> 8) & 0xff;
  arr[offset + 3] = val & 0xff;
}

const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function uint8ToBase64(bytes) {
  let result = "";
  const len = bytes.length;
  let i = 0;
  for (; i + 2 < len; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    result +=
      BASE64_CHARS[(n >>> 18) & 63] +
      BASE64_CHARS[(n >>> 12) & 63] +
      BASE64_CHARS[(n >>> 6) & 63] +
      BASE64_CHARS[n & 63];
  }
  if (len - i === 1) {
    const n = bytes[i] << 16;
    result +=
      BASE64_CHARS[(n >>> 18) & 63] + BASE64_CHARS[(n >>> 12) & 63] + "==";
  } else if (len - i === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    result +=
      BASE64_CHARS[(n >>> 18) & 63] +
      BASE64_CHARS[(n >>> 12) & 63] +
      BASE64_CHARS[(n >>> 6) & 63] +
      "=";
  }
  return result;
}

let cachedLogoDataUri = null;

export function getBrandLogoDataUri() {
  if (cachedLogoDataUri) return cachedLogoDataUri;

  const size = 120; // 120 * 481 = 57,720 bytes (< 65,535 single Deflate block)
  const stride = size * 4 + 1;
  const rawLen = size * stride;
  const raw = new Uint8Array(rawLen);

  const scale = (size * 0.88) / Math.max(SVG_WIDTH, SVG_HEIGHT);
  const half = size / 2;
  const subSamples = 4;
  const totalSub = subSamples * subSamples;

  for (let py = 0; py < size; py++) {
    const rowStart = py * stride;
    raw[rowStart] = 0; // filter type 0
    for (let px = 0; px < size; px++) {
      let hits = 0;
      for (let sy = 0; sy < subSamples; sy++) {
        const vy = (py + (sy + 0.5) / subSamples - half) / scale + SVG_CENTER_Y;
        for (let sx = 0; sx < subSamples; sx++) {
          const vx = (px + (sx + 0.5) / subSamples - half) / scale + SVG_CENTER_X;
          if (isInsideLogo(vx, vy)) hits++;
        }
      }
      if (hits > 0) {
        const idx = rowStart + 1 + px * 4;
        raw[idx] = 245; // #F54900 R
        raw[idx + 1] = 73; // #F54900 G
        raw[idx + 2] = 0; // #F54900 B
        raw[idx + 3] = Math.round((hits / totalSub) * 255);
      }
    }
  }

  // Adler-32 checksum of raw scanlines
  let s1 = 1;
  let s2 = 0;
  for (let i = 0; i < rawLen; i++) {
    s1 = (s1 + raw[i]) % 65521;
    s2 = (s2 + s1) % 65521;
  }
  const adler = ((s2 << 16) | s1) >>> 0;

  // Build uncompressed zlib stream: 2B header + 5B block header + rawLen + 4B adler32
  const idatLen = 2 + 5 + rawLen + 4;
  // Total PNG size: 8 (sig) + 25 (IHDR) + (12 + idatLen) (IDAT) + 12 (IEND)
  const png = new Uint8Array(8 + 25 + 12 + idatLen + 12);
  let pos = 0;

  // 1. PNG Signature
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) png[pos++] = sig[i];

  // 2. IHDR Chunk
  writeUInt32BE(png, pos, 13);
  pos += 4;
  const ihdrStart = pos;
  png[pos++] = 73; // 'I'
  png[pos++] = 72; // 'H'
  png[pos++] = 68; // 'D'
  png[pos++] = 82; // 'R'
  writeUInt32BE(png, pos, size);
  pos += 4;
  writeUInt32BE(png, pos, size);
  pos += 4;
  png[pos++] = 8; // bit depth 8
  png[pos++] = 6; // color type 6 (RGBA)
  png[pos++] = 0;
  png[pos++] = 0;
  png[pos++] = 0;
  writeUInt32BE(png, pos, crc32(png, ihdrStart, pos));
  pos += 4;

  // 3. IDAT Chunk
  writeUInt32BE(png, pos, idatLen);
  pos += 4;
  const idatStart = pos;
  png[pos++] = 73; // 'I'
  png[pos++] = 68; // 'D'
  png[pos++] = 65; // 'A'
  png[pos++] = 84; // 'T'
  // Zlib header
  png[pos++] = 0x78;
  png[pos++] = 0x01;
  // Deflate uncompressed final block header
  png[pos++] = 0x01;
  png[pos++] = rawLen & 0xff;
  png[pos++] = (rawLen >>> 8) & 0xff;
  const nlen = ~rawLen & 0xffff;
  png[pos++] = nlen & 0xff;
  png[pos++] = (nlen >>> 8) & 0xff;
  // Copy raw scanlines
  png.set(raw, pos);
  pos += rawLen;
  // Adler32
  writeUInt32BE(png, pos, adler);
  pos += 4;
  // IDAT CRC32
  writeUInt32BE(png, pos, crc32(png, idatStart, pos));
  pos += 4;

  // 4. IEND Chunk
  writeUInt32BE(png, pos, 0);
  pos += 4;
  const iendStart = pos;
  png[pos++] = 73; // 'I'
  png[pos++] = 69; // 'E'
  png[pos++] = 78; // 'N'
  png[pos++] = 68; // 'D'
  writeUInt32BE(png, pos, crc32(png, iendStart, pos));
  pos += 4;

  cachedLogoDataUri = "data:image/png;base64," + uint8ToBase64(png);
  return cachedLogoDataUri;
}

export default function BrandLogo({ size = 36, style }) {
  const uri = getBrandLogoDataUri();
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Image
        source={{ uri }}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}
