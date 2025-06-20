import puppeteer, { Page } from 'puppeteer';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface StatuteData {
  code: string;
  chapter: string;
  section: string;
  url: string;
  content?: string;
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

export async function fetchAndExtractContent(statuteData: StatuteData): Promise<string> {

  
  try {
    console.log(`Fetching content from: ${statuteData.url}`);

    
    // Fetch the HTML document
    const response = await axios.get(statuteData.url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // Load HTML into cheerio
    const $ = cheerio.load(response.data);
    
    // Extract main content - adjust selectors based on the actual HTML structure
    let content = '';
    
    // Try different selectors to find the main statute content
    const possibleSelectors = [
      '.statute-content',
      '.content',
      '#content',
      '.main-content',
      'body',
      '.statute-text',
      '.law-text'
    ];
    
    for (const selector of possibleSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().trim();
        if (content.length > 100) { // Only use if we got substantial content
          break;
        }
      }
    }
    
    // If no specific content found, get body text but clean it up
    if (!content || content.length < 100) {
      content = $('body').text().trim();
    }
    
    // Clean up the content
    content = content
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
    
    return content;
    
  } catch (error) {
    console.error(`Error fetching content from ${statuteData.url}:`, error.message);
    return `Error fetching content: ${error.message}`;
  }
}

export async function runTexasStatuteScraper() {
  (async () => {
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });

    const results: string[] = [];
    
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

                let finalUrl = '';

                if (capturedUrls.length > 0) {
                  const url = capturedUrls[0]; // Get the first (and likely only) captured URL
                  
                  // Check if it's a valid statute URL
                  if (url && (url.includes('/Docs/') || url.includes('.htm'))) {
                    finalUrl = url;
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
                    // Convert relative URL to absolute if needed
                    finalUrl = hiddenFieldUrl.startsWith('http') 
                      ? hiddenFieldUrl 
                      : `https://statutes.capitol.texas.gov${hiddenFieldUrl}`;
                  } else {
                    console.log('No URL captured for this section');
                  }
                }

                // If we have a URL, fetch and extract content
                if (finalUrl) {
                  const statuteData: StatuteData = {
                    code: codeName,
                    chapter: chapter.text,
                    section: section.text,
                    url: finalUrl
                  };

                  // Fetch and extract content
                  const content = await fetchAndExtractContent(statuteData);
                  
                  let data  = `CODE: ${statuteData.code} : CHAPTER: ${statuteData.chapter} : SECTION: ${statuteData.section} : URL: ${statuteData.url} : Content: ${content}`;
                  results.push(data);

                  console.log(results.length);
                  // console.log('\n' + '='.repeat(80));
                  // console.log(`CODE: ${statuteData.code}`);
                  // console.log(`CHAPTER: ${statuteData.chapter}`);
                  // console.log(`SECTION: ${statuteData.section}`);
                  // console.log(`URL: ${statuteData.url}`);
                  // console.log('-'.repeat(80));
                  // console.log('CONTENT:');
                  // console.log(content);
                  // console.log('='.repeat(80) + '\n');
                }
              }
            } catch (error) {
              console.error(`Error processing section ${section.text}:`, error);
            }

            // Small delay before next section
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }

      console.log('\nFinished processing all selected codes');
      console.log('Results:', results.join('\n\n'));

    } catch (error) {
      console.error('An error occurred:', error);
    } finally {
      // Keep the browser open for 5 seconds after completion
      await new Promise(resolve => setTimeout(resolve, 5000));
      await browser.close();
    }
  })();
}