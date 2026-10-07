// Render the SuperX symbol in black on a white circular browser badge.
// Only the circle exterior is transparent; the approved paths/gaps stay intact.
// Requires sharp. Optional SUPERX_NODE_MODULES points to bundled node_modules.
// Usage: node tools/build-icons.mjs [source.svg]
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const sharp = process.env.SUPERX_NODE_MODULES
  ? createRequire(path.join(path.resolve(process.env.SUPERX_NODE_MODULES), '__renderer__.cjs'))('sharp')
  : require('sharp');
const source = path.resolve(root, process.argv[2] || 'extension/assets/superx-symbol.svg');
const {version} = JSON.parse(await readFile(path.join(root,'extension','manifest.json'),'utf8'));
const symbol = (await readFile(source, 'utf8')).trim();
if (!/<svg\b/.test(symbol) || !/viewBox="0 0 35 33"/.test(symbol) || !symbol.includes('keep-four-gaps')) {
  throw new Error('Expected the approved SuperX symbol with its four-gap mask.');
}
const glyphColor = '#000000';
const badgeColor = '#ffffff';
const circleRadius = 62;
// Keep the diagonal tips within the circle and leave a white perimeter. The
// mark keeps its original 35:33 aspect ratio and four gaps at every size.
const glyphWidth = 88;
const glyphHeight = glyphWidth * 33 / 35;
const glyphInsetX = (128 - glyphWidth) / 2;
const glyphInsetY = (128 - glyphHeight) / 2;
const insetSymbol = symbol.replace('<svg ', `<svg x="${glyphInsetX}" y="${glyphInsetY}" width="${glyphWidth}" height="${glyphHeight}" data-toolbar-glyph="true" `);
const wrapper = (includeGlyph = true) => `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><circle cx="64" cy="64" r="${circleRadius}" fill="${badgeColor}"/>${includeGlyph ? `<style>[data-toolbar-glyph] > g[mask="url(#keep-four-gaps)"] { fill: ${glyphColor}; }</style>${insetSymbol}` : ''}</svg>`;
const output = path.join(root, 'extension', 'assets');
const baselineOutput = path.join(root, 'artifacts', `SuperX-${version}-icons-circle-baseline`);
await mkdir(output, { recursive: true });
await mkdir(baselineOutput, { recursive: true });
const report = { version, source: path.relative(root, source), glyphColor, glyphBox:{x:glyphInsetX,y:glyphInsetY,width:glyphWidth,height:glyphHeight}, badgeColor, circle:{cx:64,cy:64,r:circleRadius}, background: 'white circle; transparent exterior', pathsAndMasks: 'unchanged', renderer: sharp.versions, icons: [] };
for (const size of [16, 32, 48, 128]) {
  const target = path.join(output, `icon-${size}.png`);
  const baseline = path.join(baselineOutput, `icon-${size}.png`);
  await sharp(Buffer.from(wrapper(false)), { density: 384 }).resize(size, size, { kernel: 'lanczos3' }).png().toFile(baseline);
  const previousData = await sharp(target).ensureAlpha().raw().toBuffer();
  const baselineData = await sharp(baseline).ensureAlpha().raw().toBuffer();
  const data=await sharp(Buffer.from(wrapper()),{density:384}).resize(size,size,{kernel:'lanczos3'}).ensureAlpha().raw().toBuffer();
  await sharp(data,{raw:{width:size,height:size,channels:4}}).png().toFile(target);
  const info={width:size,height:size,channels:4};
  const count = predicate => {
    let pixels = 0;
    for (let i = 0; i < data.length; i += info.channels) if (predicate(data[i], data[i + 1], data[i + 2], data[i + 3])) pixels++;
    return pixels;
  };
  const whiteBadgePixels = count((r, g, b, a) => a > 80 && r > 210 && g > 210 && b > 210);
  const blackGlyphPixels = count((r, g, b, a) => a > 80 && r < 140 && g < 140 && b < 140);
  const transparentPixels = count((_r, _g, _b, a) => a === 0);
  const partialAlphaPixels = count((_r, _g, _b, a) => a > 0 && a < 255);
  const cornerAlpha = [0,size-1,size*(size-1),size*size-1].map(pixel=>data[pixel*info.channels+3]);
  let alphaDifferences=0,previousAlphaDifferences=0;
  for(let i=3;i<data.length;i+=info.channels)if(data[i]!==baselineData[i])alphaDifferences++;
  for(let i=3;i<data.length;i+=info.channels)if(data[i]!==previousData[i])previousAlphaDifferences++;
  if (info.width !== size || info.height !== size || !whiteBadgePixels || !blackGlyphPixels || !transparentPixels || cornerAlpha.some(Boolean) || alphaDifferences) {
    throw new Error(`Invalid ${size}px dimensions, badge palette or circle alpha; the glyph must stay inside the circle.`);
  }
  report.icons.push({ file: path.relative(root, target), width: info.width, height: info.height, whiteBadgePixels, blackGlyphPixels, transparentPixels, partialAlphaPixels, cornerAlpha, alphaDifferencesFromCircleBaseline:alphaDifferences, alphaDifferencesFromPreviousIcon:previousAlphaDifferences });
}
const luminance = color => {
  const channels=color.replace('#','').match(/../g).map(value=>parseInt(value,16)/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4);
  return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
};
report.contrast={};
const panels=[];
for(const [panel,background] of ['#000000','#ffffff','#244340','#eeeeee'].entries()){
    for(const color of [glyphColor,badgeColor]){
      const key=`${color} on ${background}`,values=[luminance(color),luminance(background)].sort((a,b)=>b-a);
      report.contrast[key]=Number(((values[0]+.05)/(values[1]+.05)).toFixed(2));
    }
    let icons='';
    for(const [index,size] of [16,32,48,128].entries()){
      const file=path.join(output,`icon-${size}.png`),pixels=size===128?64:size;
      const encoded=(await readFile(file)).toString('base64'),x=30+index*65;
      icons+=`<image x="${x}" y="${65+(64-pixels)/2}" width="${pixels}" height="${pixels}" href="data:image/png;base64,${encoded}"/><text x="${x+pixels/2}" y="146" text-anchor="middle">${size}px</text>`;
    }
    const zoom=(await sharp(path.join(output,'icon-16.png')).resize(64,64,{kernel:'nearest'}).png().toBuffer()).toString('base64');
    icons+=`<image x="30" y="162" width="64" height="64" href="data:image/png;base64,${zoom}"/><text x="110" y="187">16px pixel detail at 4×</text><text x="110" y="208">Original mark / four gaps kept</text>`;
    const x=(panel%2)*300,y=Math.floor(panel/2)*244,foreground=['#000000','#244340'].includes(background)?'#fff':'#111';
    panels.push(`<g transform="translate(${x} ${y})"><rect width="300" height="244" fill="${background}"/><g fill="${foreground}" font-family="Segoe UI,sans-serif" font-size="12"><text x="18" y="26" font-size="16">${background} · Circular badge</text><text x="18" y="46">White circle / black SuperX</text>${icons}</g></g>`);
}
const comparison=path.join(root,'artifacts',`SuperX-${version}-icons-proof.png`);
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="488">${panels.join('')}</svg>`)).png().toFile(comparison);
report.comparison=path.relative(root,comparison);
await writeFile(path.join(root,'artifacts',`SuperX-${version}-icons-report.json`),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report, null, 2));
