import puppeteer, { Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as pdfParse from 'pdf-parse';

interface DelawareCodeData {
  title: string;
  titleNumber: string;
  pdfUrl: string;
  htmlUrl: string;
  content: string;
  pages: number;
  downloadDate: string;
  fileName:string
  filePath:string
}

const BASE_URL = 'https://delcode.delaware.gov/';
const JSON_FILE_PATH = path.join(__dirname, 'delaware_code.json');
const PDF_DOWNLOAD_DIR = path.join(__dirname, 'pdfs');

// Create PDF download directory if it doesn't exist
if (!fs.existsSync(PDF_DOWNLOAD_DIR)) {
  fs.mkdirSync(PDF_DOWNLOAD_DIR, { recursive: true });
}

async function downloadPDF(url: string, filename: string): Promise<Buffer> {
  console.log(`Downloading PDF: ${filename}`);
  
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer',
      timeout: 60000, // 60 seconds timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const buffer = Buffer.from(response.data);
    
    // Save PDF to local directory for backup
    // const pdfPath = path.join(PDF_DOWNLOAD_DIR, filename);
    // fs.writeFileSync(pdfPath, buffer);
    // console.log(`PDF saved locally: ${pdfPath}`);
    
    return buffer;
  } catch (error) {
    console.error(`Error downloading PDF ${filename}:`, error);
    throw error;
  }
}

async function parsePDF(buffer: Buffer): Promise<{ text: string; pages: number }> {
  try {
    const data = await pdfParse(buffer);
    
    // Clean the text by removing special characters and normalizing whitespace
    const cleanText = data.text
      .replace(/[\n\r]+/g, ' ') // Replace multiple newlines with single space
      .replace(/\$/g, '') // Remove dollar signs
      .replace(/[^\x20-\x7E\s]/g, '') // Remove non-printable ASCII characters
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim(); // Remove leading/trailing whitespace
    
    return {
      text: cleanText,
      pages: data.numpages
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
}

async function saveData(data: DelawareCodeData) {
  let allData: DelawareCodeData[] = [];
  
  // Read existing data if file exists
  if (fs.existsSync(JSON_FILE_PATH)) {
    const fileContent = fs.readFileSync(JSON_FILE_PATH, 'utf-8');
    allData = JSON.parse(fileContent);
  }
  
  // Add new data
  allData.push(data);
  
  // Save back to file
  fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(allData, null, 2));
  console.log(`Data saved for: ${data.title}`);
}

async function scrapeTitleLinks(page: Page): Promise<Array<{ title: string; titleNumber: string; htmlUrl: string; pdfUrl: string }>> {
  console.log('Extracting title links from main page...');
  
  const titles = await page.evaluate(() => {
    const titleLinks = document.querySelectorAll('.title-links');
    
    return Array.from(titleLinks).map(linkContainer => {
      const htmlLink = linkContainer.querySelector('a[href*="title"]:not([href*=".pdf"])');
      const pdfLink = linkContainer.querySelector('a[href*=".pdf"]');
      
      if (htmlLink && pdfLink) {
        const titleText = htmlLink.textContent?.trim() || '';
        const titleNumberMatch = titleText.match(/Title\s+(\d+)/i);
        const titleNumber = titleNumberMatch ? titleNumberMatch[1] : '';
        
        return {
          title: titleText,
          titleNumber: titleNumber,
          htmlUrl: (htmlLink as HTMLAnchorElement).href,
          pdfUrl: (pdfLink as HTMLAnchorElement).href
        };
      }
      return null;
    }).filter(item => item !== null);
  });

  // Also handle the Constitution
  const constitutionLinks = await page.evaluate(() => {
    const constitutionContainer = document.querySelector('.title-links a[href*="constitution"]');
    const constitutionPdfLink = document.querySelector('.title-links a[href*="constitution.pdf"]');
    
    if (constitutionContainer && constitutionPdfLink) {
      return {
        title: 'The Delaware Constitution',
        titleNumber: 'Constitution',
        htmlUrl: (constitutionContainer as HTMLAnchorElement).href,
        pdfUrl: (constitutionPdfLink as HTMLAnchorElement).href
      };
    }
    return null;
  });

  if (constitutionLinks) {
    titles.unshift(constitutionLinks);
  }

  console.log(`Found ${titles.length} titles to process`);
  return titles;
}

export async function* runDelawareCodeScraper(): AsyncGenerator<DelawareCodeData> {
  const browser = await puppeteer.launch({
    headless: true, // Set to true for production
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox' , '--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    console.log('Navigating to Delaware Code website...');
    await page.goto(BASE_URL, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    await new Promise(resolve => setTimeout(resolve, 3000));

    const titles = await scrapeTitleLinks(page);
    console.log(`\n=== Starting to process ${titles.length} titles ===\n`);

    for (let i = 0; i < titles.length; i++) {
      const title = titles[i];
      console.log(`\n--- Processing ${i + 1}/${titles.length}: ${title.title} ---`);
      try {
        const safeFilename = `${title.titleNumber}_${title.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}.pdf`;
        const pdfBuffer = await downloadPDF(title.pdfUrl, safeFilename);
        console.log('Parsing PDF content...');
        const parsedData = await parsePDF(pdfBuffer);

        const codeData: DelawareCodeData = {
          title: title.title,
          titleNumber: title.titleNumber,
          pdfUrl: title.pdfUrl,
          filePath : title.pdfUrl,
          htmlUrl: title.htmlUrl,
          fileName:safeFilename,
          content: parsedData.text,
          pages: parsedData.pages,
          downloadDate: new Date().toISOString()
        };

        console.log(`✅ Successfully processed: ${title.title} (${parsedData.pages} pages)`);
        yield codeData;

        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Error processing ${title.title}:`, error);
        continue;
      }
    }

    console.log('\n=== Scraping completed ===');

  } catch (error) {
    console.error('Main execution error:', error);
  } finally {
    console.log('Closing browser...');
    await browser.close();
  }
}