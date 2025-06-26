import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';

// Define the type for extracted content
export interface ExtractedContent {
    url: string;
    content: string;
    code : string;
    section: string;
    Title:string;
    subject_area:string;
}

export async function* scrapeCaliforniaCodes(): AsyncGenerator<ExtractedContent> {
    let browser: import('puppeteer').Browser | null = null;
    let code  
    let section 
    try {
        console.log("Starting California codes scraping...");

        // Launch browser
        browser = await puppeteer.launch({
            headless: true,
            timeout: 0,
            args: ['--start-maximized' , '--disable-http2', '--no-sandbox', '--disable-setuid-sandbox'] // Start maximized

        });

        const page = await browser.newPage();
        console.log("Navigating to California codes page...");

        await page.goto('https://leginfo.legislature.ca.gov/faces/codes.xhtml', {
            waitUntil: 'networkidle0'
        });

        // Navigate to search tab
        await page.waitForSelector('a[id="j_idt121:textsearchtab"]');
        await page.click('a[id="j_idt121:textsearchtab"]');

        // Select code categories
        console.log("Selecting code categories...");
        await page.waitForSelector('label[for="codeSearchForm:j_idt118:5:selectCode1"]');
        await page.click('label[for="codeSearchForm:j_idt118:5:selectCode1"]');
        await page.click('label[for="codeSearchForm:j_idt118:4:selectCode1"]');
        await page.click('label[for="codeSearchForm:j_idt118:2:selectCode1"]');
        await page.click('label[for="codeSearchForm:j_idt118:3:selectCode1"]');

        await page.waitForSelector('label[for="codeSearchForm:j_idt124:7:selectCode2"]');
        await page.click('label[for="codeSearchForm:j_idt124:7:selectCode2"]');
        await page.waitForSelector('label[for="codeSearchForm:j_idt124:3:selectCode2"]');
        await page.click('label[for="codeSearchForm:j_idt124:3:selectCode2"]');
        await page.click('label[for="codeSearchForm:j_idt124:6:selectCode2"]');
        await page.click('label[for="codeSearchForm:j_idt130:4:selectCode3"]');
        await page.click('label[for="codeSearchForm:j_idt118:8:selectCode1"]');
        await page.click('label[for="codeSearchForm:j_idt130:0:selectCode3"]');

        // Execute search
        console.log("Executing search...");
        await page.click('input[id="codeSearchForm:execute_search"]');
       await new Promise(resolve => setTimeout(resolve, 1000))
        await page.waitForSelector('span[title="Sections Returned"]');
        await page.waitForSelector('.table_main');

        console.log("Search completed, starting content extraction...");

        // Process pages and extract content immediately
        let pageCount = 1;
        let isDisabled = false;

        while (!isDisabled) {
            console.log(`Processing page ${pageCount}...`);

            const html = await page.content();
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
                    // console.log(`Extracted code: ${matches[0]}`);
                    // code = matches[0];
                    // section = matches[2];
                    
                    // console.log(`Extracted link: ${matches[2]}`);
                    currentPageLinks.push(link);
                }
            });

            console.log(`Found ${currentPageLinks.length} links on page ${pageCount}`);

            // Process each link immediately and yield content
            for (let i = 0; i < currentPageLinks.length; i++) {
                const link = currentPageLinks[i];
                console.log(`Processing link ${i + 1}/${currentPageLinks.length} from page ${pageCount}: ${link}`);
                code = link.split('lawCode=')[1].split('&')[0];
                    section = link.split('sectionNum=')[1].split('&')[0];
                    console.log(`Extracted code: ${code}`);
                    console.log(`Extracted section: ${section}`);
                try {
                    const response = await axios.get(link, {
                        timeout: 10000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                        }
                    });

                    const $content = cheerio.load(response.data);
                    // console.log(`cheerio results ${$content.html}`)
                   const content = $content('#lawSection').text().trim() ||
                    $content('.sectionText').text().trim() ||
                    $content('#codeLawSectionNoHead').text().trim();
                    


                        // console.log(`content of codes ${content}`)
                    const Title = $content('div[style*="float:left;text-indent: 0.5in;"] h4 ').first().text().trim();
                    if (!Title) {
                        console.warn(`⚠ No code title found for link: ${link}`);
                    }
                   

                    
                    if (!Date) {
                        console.warn(`⚠ No code title found for link: ${link}`);
                    }
                    const subject_area = $content('div[style*="display:inline;"] h5 ').first().text().trim();
                    if (!subject_area) {
                        console.warn(`⚠ No subject_area found for link: ${link}`);
                    }

                    if (content) {
                        yield { url: link, content , code , section ,Title , subject_area  };
                        console.log(`✓ Yielded content for: ${link} (${content.length} characters)`);
                    } else {
                        console.warn(`⚠ No content found for link: ${link}`);
                    }

                    // Small delay to be respectful to the server
                    await new Promise(resolve => setTimeout(resolve, 500));

                } catch (error) {
                    console.error(`✗ Error processing link ${link}:`, error.message);
                    // Continue processing other links even if one fails
                    continue;
                }
            }

            // Check if there's a next page
            const updatedHtml = await page.content();
            const $next = cheerio.load(updatedHtml);
            const nextBtn = $next('input[id="datanavform:nextTen"]');

            if (nextBtn.length && !nextBtn.attr('disabled')) {
                console.log(`Moving to page ${pageCount + 1}...`);
                await page.click('input[id="datanavform:nextTen"]');
                await page.waitForNetworkIdle();
                await page.waitForSelector('.table_main');
                pageCount++;
                isDisabled = false;
            } else {
                console.log("No more pages to process");
                isDisabled = true;
            }
        }

        console.log(`Finished processing all ${pageCount} pages`);

    } catch (error) {
        console.error("Error during scraping:", error);
        throw error;
    } finally {
        if (browser) {
            console.log("Closing browser...");
            await browser.close();
        }
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