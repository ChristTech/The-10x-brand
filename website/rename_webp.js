const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'images');

const renames = [
  ['ZetuPay.webp',            'portfolio_zetupay.webp'],
  ['ZetuPay_02.webp',         'portfolio_zetupay_2.webp'],
  ['GR1WARE_01.webp',         'portfolio_gr1ware.webp'],
  ['GR1WARE_02.webp',         'portfolio_gr1ware_2.webp'],
  ['vale_02.webp',            'portfolio_vale_2.webp'],
  ['portfolio_vale_1.webp',   'portfolio_vale.webp'],
  ['Artboard 1@8x-100.webp',  'hero_bg.webp'],
];

for (const [from, to] of renames) {
  const src = path.join(dir, from);
  const dst = path.join(dir, to);
  if (fs.existsSync(src)) {
    fs.renameSync(src, dst);
    console.log(`Renamed: ${from} → ${to}`);
  } else {
    console.warn(`Not found, skipping: ${from}`);
  }
}
console.log('Done.');
