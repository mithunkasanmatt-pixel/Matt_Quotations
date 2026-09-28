import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

let cachedChromePath: string | null = null;

export function getChromeExecutablePath(): string | undefined {
  if (cachedChromePath) return cachedChromePath;

  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(/* turbopackIgnore: true */ p)) {
      cachedChromePath = p;
      return p;
    }
  }

  return undefined;
}

export async function generatePdfFromHtml(html: string): Promise<Buffer> {
  const execPath = getChromeExecutablePath();
  const launchOptions: any = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
  };

  if (execPath) {
    launchOptions.executablePath = execPath;
  }

  const browser = await puppeteer.launch(launchOptions);
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
    
    await page.setContent(html, { waitUntil: ['load', 'domcontentloaded'] });

    const pdfUint8Array = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      preferCSSPageSize: true,
    });

    return Buffer.from(pdfUint8Array);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export function getLocalAssetAsBase64(filename: string): string {
  try {
    const filePath = path.join(process.cwd(), 'public', filename);
    if (fs.existsSync(/* turbopackIgnore: true */ filePath)) {
      const bitmap = fs.readFileSync(filePath);
      const ext = path.extname(filename).replace('.', '');
      const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
      return `data:${mime};base64,${bitmap.toString('base64')}`;
    }
  } catch (e) {
    console.error(`Failed to load asset ${filename} as base64:`, e);
  }
  return '';
}
