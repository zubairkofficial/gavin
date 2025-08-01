import puppeteer from 'puppeteer-extra';
import { Browser } from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

// Define the type for extracted content
export interface ExtractedContent {
    url: string;
    content: string;
    code: string;
    section: string;
    Title: string;
    subject_area: string;
}

export async function* scrapeCaliforniaCodes(): AsyncGenerator<ExtractedContent> {
    let browser: Browser | undefined ;
    let code: string = '';
    let section: string = '';
    
    try {
        console.log("Starting California codes scraping...");

        // Function to launch browser and setup initial page
        const setupBrowser = async (savedPageNumber?: number) => {
            if (browser) {
                await browser.close();
            }
            puppeteer.use(StealthPlugin());

            browser = await puppeteer.launch({
                headless: false,
                timeout: 0,
                args: [
                    '--start-maximized',
                    '--disable-http2',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ]
            });

            const page = await browser.newPage();
            
            // Set longer timeout and add user agent
            page.setDefaultTimeout(60000);
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            console.log("Navigating to California codes page...");

            await page.goto('https://leginfo.legislature.ca.gov/faces/codes.xhtml', {
                waitUntil: 'networkidle0',
                timeout: 60000
            });

            // Navigate to search tab

            await page.waitForSelector('#tab_panel span:nth-child(2) a', { timeout: 50000 });
            await page.click('#tab_panel span:nth-child(2) a');

            // Select code categories
            console.log("Selecting code categories...");
            await page.waitForSelector('label[for="codeSearchForm:j_idt118:5:selectCode1"]', { timeout: 30000 });
            await page.click('label[for="codeSearchForm:j_idt118:5:selectCode1"]');
            await page.click('label[for="codeSearchForm:j_idt118:2:selectCode1"]');
            await page.click('label[for="codeSearchForm:j_idt118:3:selectCode1"]');

            await page.waitForSelector('label[for="codeSearchForm:j_idt124:7:selectCode2"]', { timeout: 30000 });
            await page.click('label[for="codeSearchForm:j_idt124:7:selectCode2"]');
            await page.waitForSelector('label[for="codeSearchForm:j_idt124:3:selectCode2"]', { timeout: 30000 });
            await page.click('label[for="codeSearchForm:j_idt124:3:selectCode2"]');
            await page.click('label[for="codeSearchForm:j_idt124:6:selectCode2"]');
            await page.click('label[for="codeSearchForm:j_idt130:4:selectCode3"]');
            await page.click('label[for="codeSearchForm:j_idt118:8:selectCode1"]');
            await page.click('label[for="codeSearchForm:j_idt130:0:selectCode3"]' , { delay: 100 });

            // Execute search
            console.log("Executing search...");
            await page.click('input[id="codeSearchForm:execute_search"]');
            await new Promise(resolve => setTimeout(resolve, 2000));
            await page.waitForSelector('span[title="Sections Returned"]', { timeout: 30000 });

            return page;
        };

        // Function to navigate to a specific page number
        const navigateToPage = async (page: import('puppeteer').Page, targetPageNumber: number) => {
            console.log(`Navigating to page ${targetPageNumber}...`);
            
            try {
                // Set the page number in the input field
                await page.evaluate((pageNum) => {
                    const input = document.querySelector('input[id="datanavform:go_to_page"]') as HTMLInputElement;
                    if (input) input.value = pageNum.toString();
                }, targetPageNumber);
                
                // Click the Go button
                await page.click('input[id="datanavform:gotopage"]');
                await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });
                
                // Check for CAPTCHA
                const currentUrl = page.url();
                if (currentUrl === 'https://leginfo.legislature.ca.gov/faces/captcha.xhtml') {
                    console.log("CAPTCHA detected! Waiting 5 minutes before restarting browser...");
                    await browser?.close();
                    await new Promise(resolve => setTimeout(resolve, 3 * 60 * 1000));
                    
                    const newPage = await setupBrowser();
                    return await navigateToPage(newPage, targetPageNumber);
                }
                
                return page;
            } catch (error) {
                console.error(`Error navigating to page ${targetPageNumber}:`, error);
                throw error;
            }
        };

        // Initial browser setup
        let page = await setupBrowser();

        console.log("Search completed, starting content extraction...");

        // Track last processed page and links
        let lastProcessedPage = 1;
        let lastProcessedLinks: string[] = [];
        
        // Process pages and extract content immediately
        let pageCount = 1;
        let consecutiveEmptyPages = 0;
        const maxConsecutiveEmptyPages = 3;

        while (consecutiveEmptyPages < maxConsecutiveEmptyPages) {
            // Update tracking variables at the start of each page
            lastProcessedPage = pageCount;
            
            console.log(`Processing page ${pageCount}...`);

            // Check for CAPTCHA at the beginning of each page processing
            const currentUrl = page.url();
            if (currentUrl === 'https://leginfo.legislature.ca.gov/faces/captcha.xhtml') {
                console.log("CAPTCHA detected! Saving page number:", pageCount);
                const savedPageNumber = pageCount;
                await new Promise(resolve => setTimeout(resolve, 10000)); 
                await browser?.close();
                await new Promise(resolve => setTimeout(resolve, 20000)); 
                
                // Restart browser with saved page number
                const newPage = await setupBrowser();
                
                // Execute initial search
                await page.click('input[id="codeSearchForm:execute_search"]');
                await new Promise(resolve => setTimeout(resolve, 2000));
                await page.waitForSelector('span[title="Sections Returned"]', { timeout: 30000 });
                
                // Navigate directly to the saved page number
                console.log("Navigating back to saved page:", savedPageNumber);
                page = await navigateToPage(newPage, savedPageNumber);
                
                // Re-check the URL after navigation
                const newUrl = page.url();
                if (newUrl === 'https://leginfo.legislature.ca.gov/faces/captcha.xhtml') {
                    console.error("Still getting CAPTCHA after restart. Stopping scraper.");
                    break;
                }

                return page
            }

            // Wait for content to load and add retry mechanism
            let retryCount = 0;
            let html = '';
            
            while (retryCount < 3) {
                try {
                    await page.waitForSelector('.table_main', { timeout: 10000 });
                    html = await page.content();
                    break;
                } catch (error) {
                    console.log(`Retry ${retryCount + 1} for page ${pageCount} content loading...`);
                    retryCount++;
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    if (retryCount >= 3) {
                        console.warn(`Failed to load content for page ${pageCount} after 3 retries`);
                        html = await page.content();
                    }
                }
            }
            const $ = cheerio.load(html);
            const linkElems = $('.table_main a');

            // Extract links from current page
            const currentPageLinks: string[] = [];
            linkElems.each((i, elem) => {
                const onClickAttr = (elem && (elem as any).attribs && (elem as any).attribs['onclick'])
                    ? (elem as any).attribs['onclick'].trim()
                    : null;

                if (!onClickAttr) return;

                const regex = /'([^']*)'/g;
                const matches = [...onClickAttr.matchAll(regex)].map(match => match[1]);

                if (matches.length >= 4) {
                    const link = `https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=${matches[0]}&sectionNum=${matches[2]}&article=${matches[3]}`;
                    currentPageLinks.push(link);
                }
            });

            console.log(`Found ${currentPageLinks.length} links on page ${pageCount}`);

            // Handle empty pages
            if (currentPageLinks.length === 0) {
                consecutiveEmptyPages++;
                console.warn(`Empty page ${pageCount} (consecutive empty: ${consecutiveEmptyPages})`);
                
                // Debug: Check if we're actually on a valid page
                const pageInfo = await page.evaluate(() => {
                    const sectionsSpan = document.querySelector('span[title="Sections Returned"]');
                    const tableMain = document.querySelector('.table_main');
                    return {
                        sectionsText: sectionsSpan?.textContent || 'Not found',
                        hasTableMain: !!tableMain,
                        tableContent: tableMain?.innerHTML?.substring(0, 200) || 'No content'
                    };
                });
                console.log('Page debug info:', pageInfo);
                
            } else {
                consecutiveEmptyPages = 0;
            }

            // Process each link immediately and yield content
            for (let i = 0; i < currentPageLinks.length; i++) {
                const link = currentPageLinks[i];
                console.log(`Processing link ${i + 1}/${currentPageLinks.length} from page ${pageCount}: ${link}`);
                
                code = link.split('lawCode=')[1]?.split('&')[0] || '';
                section = link.split('sectionNum=')[1]?.split('&')[0] || '';
                console.log(`Extracted code: ${code}, section: ${section}`);
                
                try {
                    const response = await axios.get(link, {
                        timeout: 15000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        }
                    });

                    const $content = cheerio.load(response.data);
                    const content = $content('#lawSection').text().trim() ||
                        $content('.sectionText').text().trim() ||
                        $content('#codeLawSectionNoHead').text().trim();

                    const Title = $content('div[style*="float:left;text-indent: 0.5in;"] h4').first().text().trim();
                    const subject_area = $content('div[style*="display:inline;"] h5').first().text().trim();

                    if (!Title) {
                        console.warn(`⚠ No code title found for link: ${link}`);
                    }
                    if (!subject_area) {
                        console.warn(`⚠ No subject_area found for link: ${link}`);
                    }

                    if (content) {
                        yield { url: link, content, code, section, Title, subject_area };
                        console.log(`✓ Yielded content for: ${link} (${content.length} characters)`);
                    } else {
                        console.warn(`⚠ No content found for link: ${link}`);
                    }

                } catch (error) {
                    console.error(`✗ Error processing link ${link}:`, (error as Error).message);
                    continue;
                }
            }

            // Enhanced next page detection and navigation with CAPTCHA check
            let hasNextPage = false;
            
            try {
                // Check for CAPTCHA before attempting navigation
                const currentUrl = page.url();
                if (currentUrl === 'https://leginfo.legislature.ca.gov/faces/captcha.xhtml') {
                    console.log("CAPTCHA detected during navigation! Waiting 5 minutes before restarting browser...");

                    
                    const savedPageNumber = pageCount;
                    await browser?.close();
                    await new Promise(resolve => setTimeout(resolve, 3 * 60 * 1000)); // Wait 5 minutes
                    
                    // Restart browser and navigate to saved page
                    page = await setupBrowser();
                    
                    // Execute initial search
                    await page.click('input[id="codeSearchForm:execute_search"]');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await page.waitForSelector('span[title="Sections Returned"]', { timeout: 30000 });
                    
                    // Navigate directly to the saved page number
                    console.log("Navigating back to saved page:", savedPageNumber);
                    page = await navigateToPage(page, savedPageNumber + 1);
                    
                    const newUrl = page.url();
                    if (newUrl === 'https://leginfo.legislature.ca.gov/faces/captcha.xhtml') {
                        console.error("Still getting CAPTCHA after restart during navigation. Stopping scraper.");
                        break;
                    }
                    
                    hasNextPage = true;
                    pageCount++;
                    continue;
                }

                const preNavCheck = await page.evaluate(() => {
                    const sectionsSpan = document.querySelector('span[title="Sections Returned"]');
                    const tableMain = document.querySelector('.table_main');
                    const pageInput = document.querySelector('input[id="datanavform:go_to_page"]') as HTMLInputElement;
                    return {
                        hasValidPage: !!(sectionsSpan && tableMain),
                        currentUrl: window.location.href,
                        currentPageNumber: pageInput ? parseInt(pageInput.value) : 1
                    };
                });
                
                // Update lastProcessedPage with the current page number from the input
                if (preNavCheck.currentPageNumber) {
                    lastProcessedPage = preNavCheck.currentPageNumber;
                    console.log(`Updated last processed page to: ${lastProcessedPage}`);
                }
                
                console.log('Pre-navigation check:', preNavCheck);
                
                if (!preNavCheck.hasValidPage) {
                    console.error('Lost valid results page! Current URL:', preNavCheck.currentUrl);
                    break;
                }
                
                // Continue to next page if current page is valid
                if (preNavCheck.hasValidPage) {
                    console.log(`Moving to page ${pageCount + 1}...`);
                    
                    try {
                        // Set the page number in the input field
                        await page.evaluate((nextPage) => {
                            const input = document.querySelector('input[id="datanavform:go_to_page"]') as HTMLInputElement;
                            if (input) input.value = nextPage.toString();
                        }, pageCount + 1);
                        
                        // Click the Go button
                        await page.click('input[id="datanavform:gotopage"]');
                        console.log('Go button clicked for page navigation, waiting for update...');
                        
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 })
                            .catch(() => new Promise(resolve => setTimeout(resolve, 3000)));
                        
                        console.log('Network activity settled, checking for CAPTCHA...');
                        
                        // Check for CAPTCHA after navigation
                        const postNavUrl = page.url();
                        if (postNavUrl === 'https://leginfo.legislature.ca.gov/faces/captcha.xhtml') {
                            console.log(`CAPTCHA detected after navigation! Last processed page: ${lastProcessedPage}. Waiting 5 minutes before restarting browser...`);
                            await browser?.close();
                            await new Promise(resolve => setTimeout(resolve, 3 * 60 * 1000)); // Wait 5 minutes
                            
                            // Restart browser and navigate back to the last processed page
                            page = await setupBrowser();
                            console.log(`Navigating back to last processed page ${lastProcessedPage}...`);
                            page = await navigateToPage(page, lastProcessedPage);
                            
                            // After navigation, go to the page input field and set it
                            await page.evaluate((targetPage) => {
                                const input = document.querySelector('input[id="datanavform:go_to_page"]') as HTMLInputElement;
                                if (input) input.value = targetPage.toString();
                            }, pageCount + 1);
                            
                            // Click the Go button to navigate to the next page
                            await page.click('input[id="datanavform:gotopage"]');
                            await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });
                            
                            const finalUrl = page.url();
                            if (finalUrl === 'https://leginfo.legislature.ca.gov/faces/captcha.xhtml') {
                                console.error("Still getting CAPTCHA after restart post-navigation. Stopping scraper.");
                                break;
                            }
                        }
                        
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        
                        const postNavCheck = await page.evaluate(() => {
                            const sectionsSpan = document.querySelector('span[title="Sections Returned"]');
                            const tableMain = document.querySelector('.table_main');
                            const links = document.querySelectorAll('.table_main a');
                            return {
                                hasValidPage: !!(sectionsSpan && tableMain),
                                linkCount: links.length,
                                sectionsText: sectionsSpan?.textContent || 'Not found',
                                currentUrl: window.location.href
                            };
                        });
                        
                        console.log('Post-navigation check:', postNavCheck);
                        
                        if (postNavCheck.hasValidPage && postNavCheck.linkCount > 0) {
                            hasNextPage = true;
                            pageCount++;
                            console.log(`Successfully navigated to page ${pageCount}`);
                        } else if (postNavCheck.hasValidPage && postNavCheck.linkCount === 0) {
                            console.log('Valid page but no links - might be end of results');
                        } else {
                            console.error('Navigation failed - lost valid page structure');
                            break;
                        }
                        
                    } catch (navError) {
                        console.error('Navigation error:', (navError as Error).message);
                        console.log('Navigation to next page failed, stopping scraper');
                        hasNextPage = false;
                    }
                    
                } else {
                    console.log("Page navigation failed, stopping scraper");
                    hasNextPage = false;
                }
                
            } catch (error) {
                console.error(`Error during page navigation: ${(error as Error).message}`);
                hasNextPage = false;
            }
            
            if (!hasNextPage) {
                break;
            }
        }

        if (consecutiveEmptyPages >= maxConsecutiveEmptyPages) {
            console.log(`Stopped due to ${consecutiveEmptyPages} consecutive empty pages`);
        } else {
            console.log("No more pages to process");
        }
        
        console.log(`Finished processing all ${pageCount} pages`);

    } catch (error) {
        console.error("Error during scraping:", error);
        throw error;
    } finally {
   
            console.log("Closing browser...");
            await browser?.close();
        
    }
}

// Enhanced main execution with better error handling and progress tracking
// (async () => {
//     try {
//         console.log("=".repeat(60));
//         console.log("Starting California Code Scraper");
//         console.log("=".repeat(60));

//         let processedCount = 0;
//         let errorCount = 0;
//         const startTime = Date.now();

//         for await (const { url, content , code , section , Title, subject_area  } of scrapeCaliforniaCodes()) {
//             processedCount++;

//             console.log(`\n[${processedCount}] Processing California code section:`);
//             console.log(`URL: ${url}`);
//             console.log(`Content length: ${content.length} characters`);
//             console.log(`Content preview: ${content.substring(0, 100)}...`);
//             console.log(`Code: ${code}`);
//             console.log(`Section: ${section}`);
//             console.log(`source_url: scraper`);
//             console.log(`type is Statutes`);
//             console.log(`Title: ${Title}`);
//             console.log(`subject_area: ${subject_area}`);

//         }

//         const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

//         console.log("\n" + "=".repeat(60));
//         console.log("SCRAPING COMPLETED");
//         console.log("=".repeat(60));
//         console.log(`Total sections processed: ${processedCount}`);
//         console.log(`Total time: ${totalTime} seconds`);
//         console.log(`Average time per section: ${(parseFloat(totalTime) / processedCount).toFixed(2)}s`);

//     } catch (error) {
//         console.error('Error in main process:', error);
//         process.exit(1);
//     }
// })();