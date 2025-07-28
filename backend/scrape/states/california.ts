import puppeteer , {Browser } from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';

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
        const setupBrowser = async () => {
            if (browser) {
                await browser.close();
            }

            browser = await puppeteer.launch({
                headless: true,
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
            await page.waitForSelector('a[id="j_idt121:textsearchtab"]', { timeout: 30000 });
            await page.click('a[id="j_idt121:textsearchtab"]');

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
            
            // Navigate through pages to reach the target page
            let currentPage = 1;
            while (currentPage < targetPageNumber) {
                // Check for CAPTCHA before clicking next
                const currentUrl = page.url();
                if (currentUrl === 'https://leginfo.legislature.ca.gov/faces/captcha.xhtml') {
                    console.log("CAPTCHA detected! Restarting browser...");
                    await browser?.close();
                    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                    
                    // Restart browser and navigate back to target page
                    const newPage = await setupBrowser();
                    const newUrl = page.url();
                    if (newUrl === 'https://leginfo.legislature.ca.gov/faces/captcha.xhtml') {
                        console.error("Still getting CAPTCHA after restart. Stopping scraper.");
                        break;
                    }
                    return  page = await navigateToPage(newPage, targetPageNumber);
                }

                const preNavCheck = await page.evaluate(() => {
                    const nextBtn = document.querySelector('input[id="datanavform:nextTen"]');
                    return {
                        hasNextBtn: !!nextBtn,
                        nextBtnDisabled: nextBtn ? nextBtn.hasAttribute('disabled') : true
                    };
                });

                if (!preNavCheck.hasNextBtn || preNavCheck.nextBtnDisabled) {
                    console.log(`Cannot navigate to page ${targetPageNumber}, reached end at page ${currentPage}`);
                    break;
                }

                await page.click('input[id="datanavform:nextTen"]');
                await new Promise(resolve => setTimeout(resolve, 1000));
                await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 })
                    .catch(() => new Promise(resolve => setTimeout(resolve, 3000)));
                await new Promise(resolve => setTimeout(resolve, 3000));

                currentPage++;
            }

            return page;
        };

        // Initial browser setup
        let page = await setupBrowser();

        console.log("Search completed, starting content extraction...");

        // Process pages and extract content immediately
        let pageCount = 1;
        let consecutiveEmptyPages = 0;
        const maxConsecutiveEmptyPages = 3;

        while (consecutiveEmptyPages < maxConsecutiveEmptyPages) {
            console.log(`Processing page ${pageCount}...`);

            // Check for CAPTCHA at the beginning of each page processing
            const currentUrl = page.url();
            if (currentUrl === 'https://leginfo.legislature.ca.gov/faces/captcha.xhtml') {
                console.log("CAPTCHA detected! Restarting browser and resuming from page", pageCount);
                await browser?.close();
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                
                // Restart browser and navigate back to current page
               const  newPage = await setupBrowser();
                page = await navigateToPage(page, pageCount);
                
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

                    await new Promise(resolve => setTimeout(resolve, 800));

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
                    console.log("CAPTCHA detected during navigation! Restarting browser...");

                    
                    await browser?.close();
                    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                    
                    // Restart browser and navigate to next page
                    page = await setupBrowser();
                    page = await navigateToPage(page, pageCount + 1);
                    
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
                    const nextBtn = document.querySelector('input[id="datanavform:nextTen"]');
                    return {
                        hasValidPage: !!(sectionsSpan && tableMain),
                        hasNextBtn: !!nextBtn,
                        nextBtnDisabled: nextBtn ? nextBtn.hasAttribute('disabled') : true,
                        currentUrl: window.location.href
                    };
                });
                
                console.log('Pre-navigation check:', preNavCheck);
                
                if (!preNavCheck.hasValidPage) {
                    console.error('Lost valid results page! Current URL:', preNavCheck.currentUrl);
                    break;
                }
                
                if (preNavCheck.hasNextBtn && !preNavCheck.nextBtnDisabled) {
                    console.log(`Moving to page ${pageCount + 1}...`);
                    
                    try {
                        await page.click('input[id="datanavform:nextTen"]');
                        console.log('Next button clicked, waiting for page update...');
                        
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 })
                            .catch(() => new Promise(resolve => setTimeout(resolve, 3000)));
                        
                        console.log('Network activity settled, checking for CAPTCHA...');
                        
                        // Check for CAPTCHA after navigation
                        const postNavUrl = page.url();
                        if (postNavUrl === 'https://leginfo.legislature.ca.gov/faces/captcha.xhtml') {
                            console.log("CAPTCHA detected after navigation! Restarting browser...");
                            await browser?.close();
                            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                            
                            // Restart browser and navigate to next page
                            page = await setupBrowser();
                            page = await navigateToPage(page, pageCount + 1);
                            
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
                        
                        const recoveryCheck = await page.evaluate(() => {
                            return {
                                url: window.location.href,
                                title: document.title,
                                hasForm: !!document.querySelector('form')
                            };
                        });
                        
                        console.log('Recovery check:', recoveryCheck);
                        
                        if (recoveryCheck.url.includes('codes_displaySection') || 
                            recoveryCheck.url.includes('codes.xhtml')) {
                            console.log('Page seems to have redirected, stopping scraper');
                            break;
                        }
                        
                        hasNextPage = false;
                    }
                    
                } else {
                    console.log("No enabled next page button found");
                    
                    const finalPageInfo = await page.evaluate(() => {
                        const buttons = Array.from(document.querySelectorAll('input[type="submit"], input[type="button"]'));
                        const sectionsSpan = document.querySelector('span[title="Sections Returned"]');
                        return {
                            buttons: buttons.map(btn => ({
                                id: btn.id,
                                value: btn.getAttribute('value'),
                                disabled: btn.hasAttribute('disabled'),
                                title: btn.getAttribute('title')
                            })),
                            sectionsText: sectionsSpan?.textContent || 'Not found',
                            currentUrl: window.location.href,
                            pageTitle: document.title
                        };
                    });
                    console.log('Final page diagnostic:', finalPageInfo);
                    
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