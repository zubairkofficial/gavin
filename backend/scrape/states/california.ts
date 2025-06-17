import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';


async function main() {
    try {
        console.log("Database connection established");
        // Launch browser
        const browser = await puppeteer.launch({
            headless: false, // Set to true for headless mode
            timeout: 0
        });

        // Create new page
        const page = await browser.newPage();

        // Navigate to the website
        await page.goto('https://leginfo.legislature.ca.gov/faces/codes.xhtml', {
            waitUntil: 'networkidle0'
        });

        // Wait for the "Text Search" link to be available and click it
        await page.waitForSelector('a[id="j_idt121\:textsearchtab"]');

        await page.click('a[id="j_idt121\:textsearchtab"]')

        await page.waitForSelector('label[for="codeSearchForm\:j_idt118\:5\:selectCode1"]');  // Corporations Code - CORP
        await page.click('label[for="codeSearchForm\:j_idt118\:5\:selectCode1"]');  // Corporations Code - CORP
        await page.click('label[for="codeSearchForm\:j_idt118\:4\:selectCode1"]');  // Commercial Code - COM
        await page.click('label[for="codeSearchForm\:j_idt118\:2\:selectCode1"]');  // Civil Code - CIV
        await page.click('label[for="codeSearchForm\:j_idt118\:3\:selectCode1"]');  // Code of Civil Procedure - CCP
        await page.waitForSelector('label[for="codeSearchForm\:j_idt124\:7\:selectCode2"]');  // Labor Code - LAB
        await page.click('label[for="codeSearchForm\:j_idt124\:7\:selectCode2"]');  // Labor Code - LAB
        await page.waitForSelector('label[for="codeSearchForm\:j_idt124\:3\:selectCode2"]');  // Government Code - GOV
        await page.click('label[for="codeSearchForm\:j_idt124\:3\:selectCode2"]');  // Government Code - GOV
        await page.click('label[for="codeSearchForm\:j_idt124\:6\:selectCode2"]');  // Insurance Code - INS
        await page.click('label[for="codeSearchForm\:j_idt130\:4\:selectCode3"]');  // Revenue and Taxation Code - RTC
        await page.click('label[for="codeSearchForm\:j_idt118\:8\:selectCode1"]');  // Evidence Code - EVID
        await page.click('label[for="codeSearchForm\:j_idt130\:0\:selectCode3"]');  // Probate Code - PROB

        await page.click('input[id="codeSearchForm\:execute_search"]');
        // Wait for navigation
        await page.waitForSelector('span[title="Sections Returned"]');
        await page.waitForSelector('.table_main');

        const html = await page.content();
        const $nextButton = cheerio.load(html);
        let isDisabled = $nextButton('input[id="datanavform\:nextTen"]').attr('disabled') === "disabled";
        const links: string[] = [];
        
        while (!isDisabled) {
            const html = await page.content();
            const $ = cheerio.load(html);
            const linkElems = $('.table_main a');
            // Find all anchor tags in the table and extract their text content
            linkElems.each((i, elem) => {
                // const link = ($(elem) as unknown as any).attr('href').trim();
                const onClickAttr = ($(elem) as unknown as any).attr('onclick').trim();
                const regex = /'([^']*)'/g; 
                const matches = [...onClickAttr.matchAll(regex)].map(match => match[1]);
                links.push(`https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=${matches[0]}&sectionNum=${matches[2]}&article=${matches[3]}`);
            });
            await page.click('input[id="datanavform\:nextTen"]');
            await page.waitForNetworkIdle();
            // wait
            await page.waitForSelector('.table_main');

            isDisabled = $nextButton('input[id="datanavform\:nextTen"]').attr('disabled') === "disabled";
        }

        // Print all the extracted links
        console.log(links);

        console.log("scrape")
        // Keep the browser open for demonstration (remove in production)
        // await browser.close();
        
        
        console.log("Seeding completed successfully");
    } catch (error) {
        console.error("Error during seeding:", error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });