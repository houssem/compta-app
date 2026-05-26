import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';

const OUT = 'stitch/screenshots/register';
await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage();

// Desktop: step 1
await page.setViewport({ width: 1280, height: 800 });
await page.goto('http://localhost:4200/register', { waitUntil: 'networkidle2' });
await page.screenshot({ path: `${OUT}/step1-desktop.png`, fullPage: true });

// Fill step 1 and advance to step 2
await page.type('input[placeholder="Jean Dupont"]', 'Test User');
await page.type('input[placeholder="nom@entreprise.com"]', 'test@example.com');
const pwds = await page.$$('input[type="password"]');
await pwds[0].type('password123');
await pwds[1].type('password123');
await page.click('button.rg-btn--primary');
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: `${OUT}/step2-desktop.png`, fullPage: true });

// Fill step 2 minimally and advance to step 3
const selects = await page.$$('select');
await selects[0].select('Technologie');
await page.type('input[placeholder="Acme Corp SAS"]', 'Acme SAS');
await page.type('input[placeholder="Rue de la Paix"]', 'Rue de la Paix');
await page.type('input[placeholder="Paris"]', 'Paris');
await page.type('input[placeholder="75001"]', '75001');
await selects[1].select('France');
await page.click('button.rg-btn--primary');
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: `${OUT}/step3-desktop.png`, fullPage: true });

// Fill step 3 and submit
const step3Inputs = await page.$$('input.rg-input:not([type="password"])');
// Fill account holder, bank name, IBAN, SWIFT
await step3Inputs[0].type('Test User');
await step3Inputs[1].type('BNP Paribas');
await step3Inputs[2].type('FR76 3000 6000 0112 3456 7890 189');
await step3Inputs[3].type('BNPAFRPPXXX');
await page.click('button.rg-btn--primary');
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: `${OUT}/step4-desktop.png`, fullPage: true });

// Mobile: step 1
await page.setViewport({ width: 375, height: 812 });
await page.goto('http://localhost:4200/register', { waitUntil: 'networkidle2' });
await page.screenshot({ path: `${OUT}/step1-mobile.png`, fullPage: true });

await browser.close();
console.log(`Screenshots saved to ${OUT}/`);
