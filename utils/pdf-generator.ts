/**
 * Lazy-loaded PDF generation utility
 * This ensures Puppeteer is only loaded when PDF generation is actually needed
 */

interface NameData {
  chinese: string;
  pinyin: string;
  characters: Array<{
    character: string;
    pinyin: string;
    meaning: string;
    explanation: string;
  }>;
  meaning: string;
  culturalNotes: string;
  personalityMatch: string;
  style: string;
}

interface UserData {
  englishName: string;
  gender: string;
}

interface PDFOptions {
  format?: 'A4' | 'Letter';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

let puppeteer: any = null;
let isPuppeteerLoading = false;
let puppeteerLoadPromise: Promise<any> | null = null;

/**
 * Dynamically import Puppeteer only when needed
 */
async function getPuppeteer() {
  if (puppeteer) {
    return puppeteer;
  }

  if (isPuppeteerLoading && puppeteerLoadPromise) {
    return puppeteerLoadPromise;
  }

  isPuppeteerLoading = true;
  puppeteerLoadPromise = import('puppeteer').then((module) => {
    puppeteer = module.default;
    isPuppeteerLoading = false;
    return puppeteer;
  }).catch((error) => {
    isPuppeteerLoading = false;
    puppeteerLoadPromise = null;
    throw new Error(`Failed to load Puppeteer: ${error.message}`);
  });

  return puppeteerLoadPromise;
}

/**
 * Generate PDF from HTML content using Puppeteer
 */
export async function generatePDF(
  htmlContent: string,
  options: PDFOptions = {}
): Promise<Buffer> {
  try {
    const puppeteer = await getPuppeteer();

    let browser;
    try {
      // Launch Puppeteer with optimized settings for server environment
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process', // Helps with Docker environments
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows',
          '--timeout=60000'
        ],
        timeout: 60000,
      });

      const page = await browser.newPage();

      // Set page content and wait for network to be idle
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Generate PDF with specified options
      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        printBackground: true,
        margin: {
          top: options.margin?.top || '0.5cm',
          right: options.margin?.right || '0.5cm',
          bottom: options.margin?.bottom || '0.5cm',
          left: options.margin?.left || '0.5cm'
        },
        timeout: 30000,
      });

      await browser.close();

      return pdfBuffer;

    } catch (puppeteerError) {
      if (browser) {
        await browser.close();
      }
      throw new Error(`Puppeteer generation failed: ${puppeteerError.message}`);
    }

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`PDF generation failed: ${error.message}`);
    }
    throw new Error('Unknown PDF generation error');
  }
}

/**
 * Generate a Chinese name certificate PDF
 */
export async function generateNameCertificate(
  nameData: NameData,
  userData: UserData
): Promise<{ buffer: Buffer; fileName: string }> {
  // Import the HTML template generator
  const { generateCertificateHTML } = await import('@/utils/pdf-templates/name-certificate');

  const htmlContent = generateCertificateHTML(nameData, userData);
  const pdfBuffer = await generatePDF(htmlContent, {
    format: 'A4',
    margin: {
      top: '0.5cm',
      right: '0.5cm',
      bottom: '0.5cm',
      left: '0.5cm'
    }
  });

  const fileName = `${nameData.chinese}_certificate.pdf`;

  return {
    buffer: pdfBuffer,
    fileName
  };
}

/**
 * Check if PDF generation is available
 */
export async function isPDFGenerationAvailable(): Promise<boolean> {
  try {
    await getPuppeteer();
    return true;
  } catch {
    return false;
  }
}