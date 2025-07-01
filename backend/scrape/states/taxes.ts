import puppeteer, { Page } from 'puppeteer';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface StatuteData {
  code: string;
  chapter: string;
  section: string;
  url: string;
  content?: string;
  fileName:string
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

export async function* runTexasStatuteScraper(): AsyncGenerator<StatuteData> {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: ['--start-maximized' , '--disable-http2', '--no-sandbox', '--disable-setuid-sandbox'] // Start maximized

  });

  try {
    const mainPage = await browser.newPage();

    await mainPage.evaluateOnNewDocument(() => {
      (window as any).capturedUrls = [];
      (window as any).originalOpen = window.open;
      window.open = function(url: string, target?: string, features?: string) {
        (window as any).capturedUrls.push(url);
        return {
          focus: () => {},
          close: () => {},
          closed: false,
          location: { href: url }
        } as any;
      };
    });

    await mainPage.goto('https://statutes.capitol.texas.gov/', {
      waitUntil: 'networkidle0'
    });

    for (const [codeName, codeValue] of Object.entries(SELECTED_CODES)) {
      await mainPage.select('#ctl00_ContentPlaceHolder1_QSearch_cboQuickCode', codeValue);
      await new Promise(resolve => setTimeout(resolve, 3000));
      await mainPage.waitForFunction(() => {
        const chapterSelect = document.querySelector('#ctl00_ContentPlaceHolder1_QSearch_cboQuickChapter') as HTMLSelectElement;
        return !chapterSelect.disabled && chapterSelect.options.length > 1;
      }, { timeout: 5000 });

      const chapters = await mainPage.evaluate(() => {
        const select = document.querySelector('#ctl00_ContentPlaceHolder1_QSearch_cboQuickChapter') as HTMLSelectElement;
        return Array.from(select.options)
          .map(option => ({
            value: option.value,
            text: option.text
          }))
          .filter(option => option.value !== '00');
      });

      for (const chapter of chapters) {
        await mainPage.select('#ctl00_ContentPlaceHolder1_QSearch_cboQuickChapter', chapter.value);
        await new Promise(resolve => setTimeout(resolve, 5000));
        await mainPage.waitForFunction(() => {
          const secSelect = document.querySelector('#ctl00_ContentPlaceHolder1_QSearch_cboQuickSec') as HTMLSelectElement;
          return !secSelect.disabled && secSelect.options.length > 1;
        }, { timeout: 5000 }).catch(() => {});

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

        for (const section of sections) {
          await mainPage.select('#ctl00_ContentPlaceHolder1_QSearch_cboQuickSec', section.value);
          await new Promise(resolve => setTimeout(resolve, 1000));

          try {
            await mainPage.evaluate(() => {
              (window as any).capturedUrls = [];
            });

            await mainPage.waitForFunction(() => {
              const goButton = document.querySelector('#ctl00_ContentPlaceHolder1_QSearch_btnQSGo') as HTMLInputElement;
              return goButton && !goButton.disabled;
            }, { timeout: 3000 });

            const goButton = await mainPage.$('#ctl00_ContentPlaceHolder1_QSearch_btnQSGo');
            if (goButton) {
              await goButton.click();
              await new Promise(resolve => setTimeout(resolve, 1500));
              const capturedUrls = await mainPage.evaluate(() => {
                return (window as any).capturedUrls || [];
              });

              let finalUrl = '';
            
              if (capturedUrls.length > 0) {
                const url = capturedUrls[0];
                if (url && (url.includes('/Docs/') || url.includes('.htm'))) {
                  finalUrl = url;
                }
              } else {
                const hiddenFieldUrl = await mainPage.evaluate(() => {
                  const hiddenField = document.querySelector('#ctl00_ContentPlaceHolder1_QSearch_hfDocName') as HTMLInputElement;
                  return hiddenField ? hiddenField.value : '';
                });
                if (hiddenFieldUrl && (hiddenFieldUrl.includes('/Docs/') || hiddenFieldUrl.includes('.htm'))) {
                  finalUrl = hiddenFieldUrl.startsWith('http') 
                    ? hiddenFieldUrl 
                    : `https://statutes.capitol.texas.gov${hiddenFieldUrl}`;
                }
              }

              const hiddenUrl = finalUrl.split('Docs')[1]

              if (finalUrl) {
                const statuteData: StatuteData = {
                  code: codeName,
                  chapter: chapter.text,
                  section: section.text,
                  url: finalUrl,
                  fileName : hiddenUrl,
                };
                const content = await fetchAndExtractContent(statuteData);
                statuteData.content = content;
                console.log(`Fetched content for ${statuteData.code} - Chapter ${statuteData.chapter}, Section ${statuteData.section}`);
                yield statuteData;
              }
            }
          } catch (error) {
            // Handle error if needed
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
  }
}