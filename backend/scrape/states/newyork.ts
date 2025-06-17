import puppeteer, { Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

interface SectionData {
  code: string;
  codeName: string;
  articleNumber: string;
  articleName: string;
  articleDescription: string;
  articleUrl: string;
  sectionNumber: string;
  sectionTitle: string;
  sectionLocation: string;
  sectionContent: string;
  sectionUrl: string;
}

const SELECTED_CODES = {
  'Business Corporation Law': 'BSC',
  'Limited Liability Company Law': 'LLC',
  'General Obligations Law': 'GOB',
  'Uniform Commercial Code': 'UCC',
  'Partnership Law': 'PTR',
  'Labor Law': 'LAB',
  'Civil Practice Law and Rules': 'CVP',
  'Real Property Law': 'RPP',
  'Tax Law': 'TAX',
  'Insurance Law': 'ISC'
};

const JSON_FILE_PATH = path.join(__dirname, 'new_york.json');

async function saveSection(sectionData: SectionData) {
  let sections: SectionData[] = [];
  
  // Read existing sections if file exists
  if (fs.existsSync(JSON_FILE_PATH)) {
    const fileContent = fs.readFileSync(JSON_FILE_PATH, 'utf-8');
    sections = JSON.parse(fileContent);
  }
  
  // Add new section
  sections.push(sectionData);
  
  // Save back to file
  fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(sections, null, 2));
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();

    // For each selected code
    for (const [codeName, codeAbbr] of Object.entries(SELECTED_CODES)) {
      console.log(`\n=== Processing Code: ${codeName} (${codeAbbr}) ===`);
      
      // Navigate to the specific code page
      const codeUrl = `https://www.nysenate.gov/legislation/laws/${codeAbbr}`;
      console.log(`Navigating to: ${codeUrl}`);
      
      await page.goto(codeUrl, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Wait for the page to load completely
      await new Promise(resolve => setTimeout(resolve, 3000));

      try {
        // Wait for the articles container to be present
        await page.waitForSelector('.nys-openleg-items-container', { timeout: 10000 });

        // Extract all article links from the page
        const articles = await page.evaluate(() => {
          const articleLinks = document.querySelectorAll('.nys-openleg-result-item-container a.nys-openleg-result-item-link');
          
          return Array.from(articleLinks).map(link => {
            const nameElement = link.querySelector('.nys-openleg-result-item-name');
            const descriptionElement = link.querySelector('.nys-openleg-result-item-description');
            
            return {
              url: (link as HTMLAnchorElement).href,
              articleName: nameElement ? nameElement.textContent?.trim() || '' : '',
              articleDescription: descriptionElement ? descriptionElement.textContent?.trim() || '' : ''
            };
          });
        });

        console.log(`Found ${articles.length} articles for ${codeName}`);

        // Process each article
        for (const article of articles) {
          if (article.url && article.articleName) {
            // Extract article number from the article name (e.g., "ARTICLE 1" -> "1")
            const articleNumberMatch = article.articleName.match(/ARTICLE\s+(.+)/i);
            const articleNumber = articleNumberMatch ? articleNumberMatch[1] : article.articleName;

            console.log(`\n--- Processing Article: ${article.articleName} ---`);
            console.log(`Article URL: ${article.url}`);

            // Navigate to the article page
            await page.goto(article.url, {
              waitUntil: 'networkidle0',
              timeout: 30000
            });

            // Wait for the page to load
            await new Promise(resolve => setTimeout(resolve, 2000));

            try {
              // Wait for the sections container to be present
              await page.waitForSelector('.nys-openleg-items-container', { timeout: 10000 });

              // Extract all section links from the article page
              const sections = await page.evaluate(() => {
                const sectionLinks = document.querySelectorAll('.nys-openleg-result-item-container a.nys-openleg-result-item-link');
                
                return Array.from(sectionLinks).map(link => {
                  const nameElement = link.querySelector('.nys-openleg-result-item-name');
                  const descriptionElement = link.querySelector('.nys-openleg-result-item-description');
                  
                  return {
                    url: (link as HTMLAnchorElement).href,
                    sectionName: nameElement ? nameElement.textContent?.trim() || '' : '',
                    sectionDescription: descriptionElement ? descriptionElement.textContent?.trim() || '' : ''
                  };
                });
              });

              console.log(`Found ${sections.length} sections in ${article.articleName}`);

              // Process each section
              for (const section of sections) {
                if (section.url && section.sectionName) {
                  console.log(`Processing Section: ${section.sectionName}`);

                  // Navigate to the section page
                  await page.goto(section.url, {
                    waitUntil: 'networkidle0',
                    timeout: 30000
                  });

                  // Wait for the page to load
                  await new Promise(resolve => setTimeout(resolve, 1500));

                  try {
                    // Extract section details
                    const sectionDetails = await page.evaluate(() => {
                      const titleContainer = document.querySelector('.nys-openleg-result-title');
                      const contentContainer = document.querySelector('.nys-openleg-result-text');
                      
                      if (!titleContainer) return null;
                      
                      const headline = titleContainer.querySelector('.nys-openleg-result-title-headline')?.textContent?.trim() || '';
                      const shortTitle = titleContainer.querySelector('.nys-openleg-result-title-short')?.textContent?.trim() || '';
                      const location = titleContainer.querySelector('.nys-openleg-result-title-location')?.textContent?.trim() || '';
                      const content = contentContainer?.innerHTML?.trim() || '';
                      
                      return {
                        headline,
                        shortTitle,
                        location,
                        content
                      };
                    });

                    if (sectionDetails) {
                      // Extract section number from the section name (e.g., "SECTION 101" -> "101")
                      const sectionNumberMatch = section.sectionName.match(/SECTION\s+(.+)/i);
                      const sectionNumber = sectionNumberMatch ? sectionNumberMatch[1] : section.sectionName;

                      // Save the section data
                      await saveSection({
                        code: codeAbbr,
                        codeName: codeName,
                        articleNumber: articleNumber,
                        articleName: article.articleName,
                        articleDescription: article.articleDescription,
                        articleUrl: article.url,
                        sectionNumber: sectionNumber,
                        sectionTitle: sectionDetails.shortTitle,
                        sectionLocation: sectionDetails.location,
                        sectionContent: sectionDetails.content,
                        sectionUrl: section.url
                      });

                      console.log(`Saved: ${sectionDetails.headline} - ${sectionDetails.shortTitle}`);
                    }

                  } catch (sectionError) {
                    console.error(`Error processing section ${section.sectionName}:`, sectionError);
                  }

                  // Small delay between sections
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              }

            } catch (articleError) {
              console.error(`Error processing article ${article.articleName}:`, articleError);
            }

            // Delay between articles
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }

        console.log(`Completed processing ${codeName}`);

      } catch (error) {
        console.error(`Error processing code ${codeName}:`, error);
        
        // Try to take a screenshot for debugging
        try {
          await page.screenshot({ 
            path: `error_${codeAbbr}_${Date.now()}.png`,
            fullPage: true 
          });
          console.log(`Screenshot saved for debugging ${codeName}`);
        } catch (screenshotError) {
          console.error('Failed to take screenshot:', screenshotError);
        }
      }

      // Add delay between different codes
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\nFinished processing all selected codes');
    
    // Read and display final count
    if (fs.existsSync(JSON_FILE_PATH)) {
      const finalContent = fs.readFileSync(JSON_FILE_PATH, 'utf-8');
      const finalSections = JSON.parse(finalContent);
      console.log(`Total sections saved: ${finalSections.length}`);
    }

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    // Keep the browser open for 5 seconds after completion
    console.log('Keeping browser open for 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
  }
})();