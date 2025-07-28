import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as AdmZip from 'adm-zip';
import { IncomingMessage } from 'http';
import { parseString } from 'xml2js';
import { jsonToPlainText } from "json-to-plain-text";

interface ParsedXMLData {
    fileName: string;
    filePath: string;
    title: string;
    data: string;
    section?: string;
    citation?: string;
    error?: string;
}

interface Options {
  color: boolean;
}

const options: Options = {
  color: true,                     

}
const parseXMLString = (xmlContent: string, options: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        parseString(xmlContent, options, (err: any, result: any) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

async function downloadFile(url: string, filepath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);

        https.get(url, (response: IncomingMessage) => {
            response.pipe(file);

            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err: Error) => {
            fs.unlink(filepath, () => { }); // Delete the file on error
            reject(err);
        });
    });
}

async function extractZip(zipPath: string, extractPath: string): Promise<void> {
    try {
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);
        console.log(`Extracted zip to: ${extractPath}`);
    } catch (error) {
        console.error('Error extracting zip:', error);
        throw error;
    }
}

function getXMLFiles(dir: string): string[] {
    const xmlFiles: string[] = [];

    function traverseDirectory(currentDir: string) {
        const files = fs.readdirSync(currentDir);

        for (const file of files) {
            const fullPath = path.join(currentDir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                traverseDirectory(fullPath);
            } else if (path.extname(file).toLowerCase() === '.xml') {
                xmlFiles.push(fullPath);
            }
        }
    }

    traverseDirectory(dir);
    return xmlFiles;
}


function extractPlainText(node: any): string {
    if (typeof node === 'string') {
        return node;
    }

    if (typeof node === 'object' && node !== null) {
        let result = '';

        for (const key in node) {
            if (key === '_') {
                result += node[key] + ' ';
            } else if (Array.isArray(node[key])) {
                for (const item of node[key]) {
                    result += extractPlainText(item) + ' ';
                }
            } else if (typeof node[key] === 'object') {
                result += extractPlainText(node[key]) + ' ';
            }
        }

        return result;
    }

    return '';
}


function getAllSectionParagraphs(parsed: any): string[] {
  const result: string[] = [];
  const chapters = parsed?.main?.title?.chapter;
  if (!Array.isArray(chapters)) return result;

  chapters.forEach((chapter: any) => {
    const sections = chapter.section;
    if (!Array.isArray(sections)) return;
    sections.forEach((section: any) => {
      const content = section.content;
      if (!content) return;
      // p can be array or object
      const p = content.p;
      if (Array.isArray(p)) {
        p.forEach((pObj: any) => {
          if (pObj && typeof pObj._ === "string") {
            result.push(pObj._.trim());
          }
        });
      } else if (p && typeof p._ === "string") {
        result.push(p._.trim());
      }
    });
  });

  return result;
}

async function parseXMLFile(xmlFilePath: string , url: string): Promise<ParsedXMLData> {
    try {
        console.log(`Parsing: ${path.basename(xmlFilePath)}`);

        // Read the XML file
        const xmlContent = fs.readFileSync(xmlFilePath, 'utf8');

        const result = await parseXMLString(xmlContent, {
            explicitArray: false, // Don't create arrays for single items
            ignoreAttrs: false,   // Keep attributes
            mergeAttrs: true,     // Merge attributes with element content
            explicitRoot: false   // Don't wrap result in root element
        });

        const title = result?.main?.title?.heading || '';
        const citation =  result?.main?.title?.num.value  + result?.main?.title?.heading || '';
        const section = result?.main?.title?.chapter[0]?.section[0]?.num._;

        console.log(`Title: ${title} , Section: ${section}`);




        const cleanedData = getAllSectionParagraphs(result);
        console.log('cleaned data :', cleanedData);
        const Data = cleanedData.map((item: string) => item.trim()).filter((item: string) => item.length > 0).join('\n\n');
        return {
            fileName: path.basename(xmlFilePath),
            filePath: url,
            title: title,

            section: section,
            citation: citation,
            data: Data
        };

    } catch (error) {
        console.error(`Error parsing ${xmlFilePath}:`, error);
        return {
            fileName: path.basename(xmlFilePath),
            filePath: xmlFilePath,
            title: '',
            data: '',
            error: error.message
        };
    }
}

function deleteDirectorySync(dirPath: string) {
    try {
        require('fs').rmSync(dirPath, { recursive: true, force: true });
        console.log(`Successfully deleted: ${dirPath}`);
    } catch (error: any) {
        console.error(`Error deleting directory: ${error.message}`);
    }
}

async function* parseAllXMLFiles(extractDir: string , url :string): AsyncGenerator<ParsedXMLData> {
    try {
        console.log('Starting XML parsing process...');

        const xmlFiles = getXMLFiles(extractDir);
        console.log(`Found ${xmlFiles.length} XML files to process`);

        if (xmlFiles.length === 0) {
            console.log('No XML files found in the extracted directory');
            return;
        }

        // Parse each XML file and yield immediately
        for (let i = 0; i < xmlFiles.length; i++) {
            const xmlFile = xmlFiles[i];
            console.log(`Processing file ${i + 1}/${xmlFiles.length}: ${path.basename(xmlFile)}`);

            const parsedData = await parseXMLFile(xmlFile , url);
            
            // Add a small delay to prevent overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Yield the parsed data immediately
            yield parsedData;
        }

        console.log('\n=== PARSING COMPLETED ===');
        console.log(`Total XML files processed: ${xmlFiles.length}`);
        deleteDirectorySync(extractDir ); 
        deleteDirectorySync(path.join(__dirname, 'usc_downloads')); 
    } catch (error) {
        console.error('Error in parseAllXMLFiles:', error);
        throw error;
    }
}

export async function* openBrowser(): AsyncGenerator<ParsedXMLData> {
    let browser: Browser | null = null;

    try {
        // Create downloads directory
        const downloadsDir = path.join(__dirname, 'usc_downloads');
        const extractDir = path.join(__dirname, 'usc_extracted');

        if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir, { recursive: true });
        }

        if (!fs.existsSync(extractDir)) {
            fs.mkdirSync(extractDir, { recursive: true });
        }

        // Launch browser with visible UI
        browser = await puppeteer.launch({
            headless: true, // Set to true if you want to run without UI
            defaultViewport: null, // Use full screen
            args: ['--start-maximized' , '--disable-http2', '--no-sandbox', '--disable-setuid-sandbox'] // Start maximized
        });

        // Create a new page
        const page: Page = await browser.newPage();

        // Navigate to the US Code download page
        console.log('Navigating to US Code download page...');
        await page.goto('https://uscode.house.gov/download/download.shtml', {
            waitUntil: 'networkidle2', 
            timeout : 30000 
        });

        console.log('Page loaded successfully!');

        // Wait for the specific section to load
        console.log('Looking for the download section...');
        await page.waitForSelector('.uscitemblank .itemdownloadlinks', {
            timeout: 10000
        });

        // Find and click the XML link
        console.log('Looking for XML download link...');
        const xmlLink = await page.$('.itemdownloadlinks a[title*="XML"]');

        if (!xmlLink) {
            throw new Error('XML download link not found');
        }

        // Get the href attribute
        const xmlHref = await page.evaluate(
            (el: Element) => el.getAttribute('href'),
            xmlLink
        );

        if (!xmlHref) {
            throw new Error('Could not retrieve XML link href');
        }

        console.log('Found XML link:', xmlHref);

        // Construct full URL
        const baseUrl = 'https://uscode.house.gov/download/';
        const fullUrl = new URL(xmlHref, baseUrl).href;
        console.log('Full download URL:', fullUrl);

        // Download the zip file
        const zipFileName = path.basename(xmlHref);
        const zipFilePath = path.join(downloadsDir, zipFileName);

        console.log('Downloading zip file...');
        await downloadFile(fullUrl, zipFilePath);
        console.log(`Downloaded: ${zipFilePath}`);

        // Extract the zip file
        console.log('Extracting zip file...');
        await extractZip(zipFilePath, extractDir);

        console.log('Process completed successfully!');
        console.log(`Files extracted to: ${extractDir}`);

        // Parse all XML files and yield each result as it becomes available
        console.log('\nStarting XML to JSON conversion...');
        for await (const parsedData of parseAllXMLFiles(extractDir , fullUrl)) {
            yield parsedData;
        }

    } catch (error) {
        console.error('Error occurred:', error);
        throw error;
    } finally {
        // Ensure browser is closed even if an error occurs
        if (browser) {
            await browser.close();
        }
    }
}

// if (require.main === module) {
//     openBrowser();
// }


// Example usage (commented out since it will be used in TasksService)
// (async () => {
//     try {
//         for await (const parsedData of openBrowser()) {
//             console.log('Received parsed data:', {
//                 fileName: parsedData.fileName,
//                 title: parsedData.title,
//                 hasError: !!parsedData.error,
//                 section: parsedData.section,
//                 citation: parsedData.citation,
//                 data: parsedData.data
//             });
//             // Process each file's data as it becomes available
//         }
//     } catch (error) {
//         console.error('Error in main process:', error);
//     }
// })();