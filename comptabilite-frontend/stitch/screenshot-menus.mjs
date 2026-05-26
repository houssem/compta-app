import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';

const OUT = 'stitch/screenshots/menus';
await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

// Inject a registered user session so auth guard passes
await page.goto('http://localhost:4200', { waitUntil: 'networkidle2' });
await page.evaluate(() => {
  localStorage.setItem('user', JSON.stringify({
    id: '1', email: 'test@example.com', name: 'Test User', role: 'user'
  }));
});

// --- CLIENTS ---
await page.goto('http://localhost:4200/customers', { waitUntil: 'networkidle2' });
await page.screenshot({ path: `${OUT}/clients-list.png` });

// Click the first action button
const clientActionBtn = await page.$('.cl-row-action');
if (clientActionBtn) {
  await clientActionBtn.click();
  await page.waitForSelector('.cl-menu', { timeout: 3000 }).catch(() => {});
  await page.screenshot({ path: `${OUT}/clients-menu-open.png`, fullPage: false });
} else {
  console.log('No client action button found');
  await page.screenshot({ path: `${OUT}/clients-debug.png`, fullPage: true });
}

// --- INVOICES ---
await page.goto('http://localhost:4200/invoices', { waitUntil: 'networkidle2' });
await page.screenshot({ path: `${OUT}/invoices-list.png` });

// Click the first action button
const invoiceActionBtn = await page.$('.inv-row-action');
if (invoiceActionBtn) {
  await invoiceActionBtn.click();
  await page.waitForSelector('.inv-menu', { timeout: 3000 }).catch(() => {});
  await page.screenshot({ path: `${OUT}/invoices-menu-open.png`, fullPage: false });
} else {
  console.log('No invoice action button found');
  await page.screenshot({ path: `${OUT}/invoices-debug.png`, fullPage: true });
}

await browser.close();
console.log('Screenshots saved to', OUT);
