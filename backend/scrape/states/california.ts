import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';

// Define the type for extracted content
export interface ExtractedContent {
    url: string;
    content: string;
}

export async function* scrapeCaliforniaCodes(): AsyncGenerator<ExtractedContent> {
    try {
        console.log("Database connection established");
        const browser = await puppeteer.launch({
            headless: false,
            timeout: 0
        });
        const page = await browser.newPage();
        await page.goto('https://leginfo.legislature.ca.gov/faces/codes.xhtml', {
            waitUntil: 'networkidle0'
        });
        await page.waitForSelector('a[id="j_idt121:textsearchtab"]');
        await page.click('a[id="j_idt121:textsearchtab"]');
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
        await page.click('input[id="codeSearchForm:execute_search"]');
        await page.waitForSelector('span[title="Sections Returned"]');
        await page.waitForSelector('.table_main');
        const html = await page.content();
        const $nextButton = cheerio.load(html);
        let isDisabled = $nextButton('input[id="datanavform:nextTen"]').attr('disabled') === "disabled";
        const links: string[] = [];
        while (!isDisabled) {
            const html = await page.content();
            const $ = cheerio.load(html);
            const linkElems = $('.table_main a');
            linkElems.each((i, elem) => {
                const onClickAttr = (elem && (elem as any).attribs && (elem as any).attribs['onclick']) ? (elem as any).attribs['onclick'].trim() : null;
                if (!onClickAttr) return;
                const regex = /'([^']*)'/g;
                const matches = [...onClickAttr.matchAll(regex)].map(match => match[1]);
                if (matches.length >= 4) {
                    links.push(`https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=${matches[0]}&sectionNum=${matches[2]}&article=${matches[3]}`);
                }
            });
            const nextBtn = $('input[id="datanavform:nextTen"]');
            if (nextBtn.length && !nextBtn.attr('disabled')) {
                await page.click('input[id="datanavform:nextTen"]');
                await page.waitForNetworkIdle();
                await page.waitForSelector('.table_main');
                isDisabled = false;
            } else {
                isDisabled = true;
            }
        }
        console.log(`Found ${links.length} links to process`);
        await browser.close();
        console.log("Starting content extraction from links...");
        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            console.log(`Processing link ${i + 1}/${links.length}: ${link}`);
            try {
                const response = await axios.get(link, {
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                const $ = cheerio.load(response.data);
                const content = $('#codeLawSectionNoHead').text().trim();
                if (content) {
                    yield { url: link, content };
                } else {
                    console.warn(`No content found for link: ${link}`);
                }
            } catch (error) {
                console.error(`Error processing link ${link}:`, error);
            }
        }
        console.log(`Finished extracting content from all links`);
    } catch (error) {
        console.error("Error during scraping:", error);
    }
}