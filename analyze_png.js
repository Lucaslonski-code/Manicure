const fs = require('fs');
const zlib = require('zlib');

function analyzePNG(filePath) {
  const buf = fs.readFileSync(filePath);
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  const bitDepth = buf[24];
  const colorType = buf[25];
  
  // Extract IDAT chunks
  let offset = 8; // skip PNG signature
  let idatData = Buffer.alloc(0);
  
  while (offset < buf.length) {
    const chunkLen = buf.readUInt32BE(offset);
    const chunkType = buf.slice(offset + 4, offset + 8).toString('ascii');
    if (chunkType === 'IDAT') {
      const chunkData = buf.slice(offset + 8, offset + 8 + chunkLen);
      idatData = Buffer.concat([idatData, chunkData]);
    }
    offset += 12 + chunkLen; // 4 len + 4 type + data + 4 crc
  }
  
  // Decompress
  const raw = zlib.inflateSync(idatData);
  
  // For colorType 6 (RGBA), each pixel is 4 bytes
  const channels = 4;
  const stride = w * channels;
  
  // Undo filtering (PNG filter types per row)
  const pixels = Buffer.alloc(h * stride);
  let rawOffset = 0;
  
  for (let y = 0; y < h; y++) {
    const filterType = raw[rawOffset++];
    const rowStart = y * stride;
    const prevRowStart = (y - 1) * stride;
    
    for (let x = 0; x < stride; x++) {
      const rawByte = raw[rawOffset++];
      const a = x >= channels ? pixels[rowStart + x - channels] : 0;
      const b = y > 0 ? pixels[prevRowStart + x] : 0;
      const c = (x >= channels && y > 0) ? pixels[prevRowStart + x - channels] : 0;
      
      let val;
      switch (filterType) {
        case 0: val = rawByte; break;
        case 1: val = rawByte + a; break;
        case 2: val = rawByte + b; break;
        case 3: val = rawByte + ((a + b) >> 1); break;
        case 4: 
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
          val = rawByte + pr;
          break;
        default: val = rawByte;
      }
      pixels[rowStart + x] = val & 0xFF;
    }
  }
  
  // Analyze pixels
  let transparentCount = 0;
  let whiteCount = 0;
  let blackCount = 0;
  let totalCount = 0;
  const colorSet = new Set();
  
  // Sample every 16th pixel for performance
  for (let y = 0; y < h; y += 16) {
    for (let x = 0; x < w; x += 16) {
      const i = y * stride + x * channels;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      totalCount++;
      
      if (a === 0) {
        transparentCount++;
      } else if (r > 240 && g > 240 && b > 240) {
        whiteCount++;
      } else if (r < 15 && g < 15 && b < 15) {
        blackCount++;
      }
      
      // Quantize colors
      const qr = Math.floor(r / 32) * 32;
      const qg = Math.floor(g / 32) * 32;
      const qb = Math.floor(b / 32) * 32;
      if (a > 128) {
        colorSet.add(`${qr},${qg},${qb}`);
      }
    }
  }
  
  // Get center region pixels to understand the shape
  const centerColors = [];
  const centerStart = Math.floor(h * 0.3);
  const centerEnd = Math.floor(h * 0.7);
  const centerLeft = Math.floor(w * 0.3);
  const centerRight = Math.floor(w * 0.7);
  
  for (let y = centerStart; y < centerEnd; y += 8) {
    for (let x = centerLeft; x < centerRight; x += 8) {
      const i = y * stride + x * channels;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      if (a > 128) {
        centerColors.push(`${r},${g},${b}`);
      }
    }
  }
  
  console.log(`File: ${filePath}`);
  console.log(`  Size: ${w}x${h}, bitDepth: ${bitDepth}, colorType: ${colorType}`);
  console.log(`  Sampled pixels: ${totalCount}`);
  console.log(`  Transparent: ${transparentCount} (${(transparentCount/totalCount*100).toFixed(1)}%)`);
  console.log(`  White pixels: ${whiteCount} (${(whiteCount/totalCount*100).toFixed(1)}%)`);
  console.log(`  Black pixels: ${blackCount} (${(blackCount/totalCount*100).toFixed(1)}%)`);
  console.log(`  Distinct color buckets (opaque): ${colorSet.size}`);
  console.log(`  Opaque center pixels: ${centerColors.length}`);
  
  // Find dominant non-white, non-black colors
  const colorCounts = {};
  for (const c of colorSet) {
    colorCounts[c] = (colorCounts[c] || 0) + 1;
  }
  const sorted = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
  console.log(`  Top colors: ${sorted.slice(0, 10).map(([c, n]) => `rgb(${c})`).join(', ')}`);
  console.log('');
}

analyzePNG('C:\\Users\\lucas\\projetos-pessoais\\AppManicure\\Aplicativo\\frontend\\assets\\icon.png');
analyzePNG('C:\\Users\\lucas\\projetos-pessoais\\AppManicure\\Aplicativo\\frontend\\assets\\android-icon-monochrome.png');
analyzePNG('C:\\Users\\lucas\\projetos-pessoais\\AppManicure\\Aplicativo\\frontend\\assets\\android-icon-foreground.png');
