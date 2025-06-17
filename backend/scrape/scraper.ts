import puppeteer, { Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

interface StatuteUrl {
  code: string;
  chapter: string;
  section: string;
  url: string;
}

const SELECTED_CODES = {
  'Business Organizations Code': '32',
  'Business and Commerce Code': '4',
  'Civil Practice and Remedies Code': '6',
  'Labor Code': '18',
  'Property Code': '25',
  'Finance Code': '12',
  'Insurance Code': '17',
  'Tax Code': '28',
  'Government Code': '13',
  'Occupations Code': '22'
};

const JSON_FILE_PATH = path.join(__dirname, 'statute_urls.json');

async function saveUrl(statuteUrl: StatuteUrl) {
  let urls: StatuteUrl[] = [];
  
  // Read existing URLs if file exists
  if (fs.existsSync(JSON_FILE_PATH)) {
    const fileContent = fs.readFileSync(JSON_FILE_PATH, 'utf-8');
    urls = JSON.parse(fileContent);
  }
  
  // Add new URL
  urls.push(statuteUrl);
  
  // Save back to file
  fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(urls, null, 2));
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const mainPage = await browser.newPage();

    await mainPage.evaluateOnNewDocument(() => {
      (window as any).capturedUrls = [];
      (window as any).originalOpen = window.open;
      
      window.open = function(url: string, target?: string, features?: string) {
        console.log('Captured URL from window.open:', url);
        (window as any).capturedUrls.push(url);
        // Return a mock window object to prevent actual opening
        return {
          focus: () => {},
          close: () => {},
          closed: false,
          location: { href: url }
        } as any;
      };
    });

    // Navigate to the main page
    await mainPage.goto('https://statutes.capitol.texas.gov/', {
      waitUntil: 'networkidle0'
    });

    // For each selected code
    for (const [codeName, codeValue] of Object.entries(SELECTED_CODES)) {
      console.log(`\n=== Processing Code: ${codeName} ===`);
      
      // Select the code
      await mainPage.select('#ctl00_ContentPlaceHolder1_QSearch_cboQuickCode', codeValue);
      
      // Add 3 second delay after selecting the code
      console.log('Waiting 3 seconds after selecting code...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Wait for chapters dropdown to be enabled
      await mainPage.waitForFunction(() => {
        const chapterSelect = document.querySelector('#ctl00_ContentPlaceHolder1_QSearch_cboQuickChapter') as HTMLSelectElement;
        return !chapterSelect.disabled && chapterSelect.options.length > 1;
      }, { timeout: 5000 });

      // Get all chapters
      const chapters = await mainPage.evaluate(() => {
        const select = document.querySelector('#ctl00_ContentPlaceHolder1_QSearch_cboQuickChapter') as HTMLSelectElement;
        return Array.from(select.options)
          .map(option => ({
            value: option.value,
            text: option.text
          }))
          .filter(option => option.value !== '00');
      });

      // For each chapter
      for (const chapter of chapters) {
        console.log(`\n--- Processing Chapter: ${chapter.text} ---`);
        
        // Select the chapter
        await mainPage.select('#ctl00_ContentPlaceHolder1_QSearch_cboQuickChapter', chapter.value);
        
        // Add 3 second delay after selecting the chapter
        console.log('Waiting 3 seconds after selecting chapter...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Wait for sections dropdown to be enabled
        await mainPage.waitForFunction(() => {
          const secSelect = document.querySelector('#ctl00_ContentPlaceHolder1_QSearch_cboQuickSec') as HTMLSelectElement;
          return !secSelect.disabled && secSelect.options.length > 1;
        }, { timeout: 5000 }).catch(() => console.log('No sections available for this chapter'));

        // Get all sections
        const sections = await mainPage.evaluate(() => {
          const select = document.querySelector('#ctl00_ContentPlaceHolder1_QSearch_cboQuickSec') as HTMLSelectElement;
          if (select.disabled) return [];
          return Array.from(select.options)
            .map(option => ({
              value: option.value,
              text: option.text
            }))
            .filter(option => option.value !== '00');
        });

        // For each section
        for (const section of sections) {
          console.log(`Processing Section: ${section.text}`);
          
          // Select the section
          await mainPage.select('#ctl00_ContentPlaceHolder1_QSearch_cboQuickSec', section.value);
          
          // Wait for a moment to ensure selection is registered
          await new Promise(resolve => setTimeout(resolve, 1000));

          try {
            // Clear any previously captured URLs
            await mainPage.evaluate(() => {
              (window as any).capturedUrls = [];
            });

            // Wait for Go button to be enabled
            await mainPage.waitForFunction(() => {
              const goButton = document.querySelector('#ctl00_ContentPlaceHolder1_QSearch_btnQSGo') as HTMLInputElement;
              return goButton && !goButton.disabled;
            }, { timeout: 3000 });

            // Click the Go button
            const goButton = await mainPage.$('#ctl00_ContentPlaceHolder1_QSearch_btnQSGo');
            if (goButton) {
              await goButton.click();
              
              // Wait a moment for the onclick function to execute
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              // Get the captured URL from window.open
              const capturedUrls = await mainPage.evaluate(() => {
                return (window as any).capturedUrls || [];
              });

              if (capturedUrls.length > 0) {
                const url = capturedUrls[0]; // Get the first (and likely only) captured URL
                
                // Check if it's a valid statute URL
                if (url && (url.includes('/Docs/') || url.includes('.htm'))) {
                  console.log(`Found URL: ${url}`);

                  // Save to JSON file
                  await saveUrl({
                    code: codeName,
                    chapter: chapter.text,
                    section: section.text,
                    url: url
                  });
                } else {
                  console.log(`Invalid or empty URL: ${url}`);
                }
              } else {
                // Alternative method: Check the hidden field for the URL
                const hiddenFieldUrl = await mainPage.evaluate(() => {
                  const hiddenField = document.querySelector('#ctl00_ContentPlaceHolder1_QSearch_hfDocName') as HTMLInputElement;
                  return hiddenField ? hiddenField.value : '';
                });

                if (hiddenFieldUrl && (hiddenFieldUrl.includes('/Docs/') || hiddenFieldUrl.includes('.htm'))) {
                  console.log(`Found URL from hidden field: ${hiddenFieldUrl}`);
                  
                  // Convert relative URL to absolute if needed
                  const fullUrl = hiddenFieldUrl.startsWith('http') 
                    ? hiddenFieldUrl 
                    : `https://statutes.capitol.texas.gov${hiddenFieldUrl}`;

                  await saveUrl({
                    code: codeName,
                    chapter: chapter.text,
                    section: section.text,
                    url: fullUrl
                  });
                } else {
                  console.log('No URL captured for this section');
                }
              }
            }
          } catch (error) {
            console.error(`Error processing section ${section.text}:`, error);
          }

          // Small delay before next section
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    console.log('\nFinished processing all selected codes');

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    // Keep the browser open for 5 seconds after completion
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
  }
})();