const fs = require('fs');
const zlib = require('zlib');

function analyzePNG(filePath) {
  const buf = fs.readFileSync(filePath);
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  const bitDepth = buf[24];
  const colorType = buf[25];
  
  let offset = 8;
  let idatData = Buffer.alloc(0);
  
  while (offset < buf.length) {
    const chunkLen = buf.readUInt32BE(offset);
    const chunkType = buf.slice(offset + 4, offset + 8).toString('ascii');
    if (chunkType === 'IDAT') {
      const chunkData = buf.slice(offset + 8, offset + 8 + chunkLen);
      idatData = Buffer.concat([idatData, chunkData]);
    }
    offset += 12 + chunkLen;
  }
  
  const raw = zlib.inflateSync(idatData);
  const channels = 4;
  const stride = w * channels;
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
  
  // Analyze shape by looking at which rows/columns have opaque pixels
  let minX = w, maxX = 0, minY = h, maxY = 0;
  let opaqueCount = 0;
  
  for (let y = 0; y < h; y += 4) {
    for (let x = 0; x < w; x += 4) {
      const i = y * stride + x * channels;
      const a = pixels[i + 3];
      if (a > 128) {
        opaqueCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  // Check if it looks like a letter A by examining the top vs bottom width
  const topThirdStart = minY;
  const topThirdEnd = minY + (maxY - minY) * 0.2;
  const midThirdStart = minY + (maxY - minY) * 0.4;
  const midThirdEnd = minY + (maxY - minY) * 0.6;
  const botThirdStart = minY + (maxY - minY) * 0.8;
  const botThirdEnd = maxY;
  
  let topWidth = 0, midWidth = 0, botWidth = 0;
  let topMinX = w, topMaxX = 0, midMinX = w, midMaxX = 0, botMinX = w, botMaxX = 0;
  
  for (let y = 0; y < h; y += 4) {
    for (let x = 0; x < w; x += 4) {
      const i = y * stride + x * channels;
      const a = pixels[i + 3];
      if (a > 128) {
        if (y >= topThirdStart && y < topThirdEnd) {
          if (x < topMinX) topMinX = x;
          if (x > topMaxX) topMaxX = x;
        }
        if (y >= midThirdStart && y < midThirdEnd) {
          if (x < midMinX) midMinX = x;
          if (x > midMaxX) midMaxX = x;
        }
        if (y >= botThirdStart && y < botThirdEnd) {
          if (x < botMinX) botMinX = x;
          if (x > botMaxX) botMaxX = x;
        }
      }
    }
  }
  
  topWidth = topMaxX - topMinX;
  midWidth = midMaxX - midMinX;
  botWidth = botMaxX - botMinX;
  
  console.log(`File: ${filePath}`);
  console.log(`  Size: ${w}x${h}`);
  console.log(`  Bounding box: (${minX},${minY}) to (${maxX},${maxY})`);
  console.log(`  Shape width: ${maxX - minX}, height: ${maxY - minY}`);
  console.log(`  Top third width: ${topWidth}`);
  console.log(`  Middle third width: ${midWidth}`);
  console.log(`  Bottom third width: ${botWidth}`);
  
  // A letter A typically has: narrow top, wide middle (or narrow), wide bottom
  // A triangle (like a nail or leaf shape) has: narrow top, wide bottom
  if (topWidth < midWidth && topWidth < botWidth) {
    console.log(`  Shape analysis: Narrow at top, wider at middle/bottom - consistent with letter "A" or triangular shape`);
  } else if (topWidth > midWidth && midWidth < botWidth) {
    console.log(`  Shape analysis: Narrow at middle, wider at top and bottom - consistent with hourglass or diamond`);
  } else {
    console.log(`  Shape analysis: Other shape pattern`);
  }
  console.log('');
}

analyzePNG('C:\\Users\\lucas\\projetos-pessoais\\AppManicure\\Aplicativo\\frontend\\assets\\icon.png');
analyzePNG('C:\\Users\\lucas\\projetos-pessoais\\AppManicure\\Aplicativo\\frontend\\assets\\android-icon-monochrome.png');
analyzePNG('C:\\Users\\lucas\\projetos-pessoais\\AppManicure\\Aplicativo\\frontend\\assets\\android-icon-foreground.png');
