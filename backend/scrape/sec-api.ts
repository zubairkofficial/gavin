import { ConfigService } from "@nestjs/config";
import axios from "axios";
import * as cheerio from "cheerio";

interface ContractTypeDefinition {
    contractType: string;
    commonFormTypes: string[];
    exhibitCodesKeywords: string[];
}

interface Filing {
    ticker: string;
    accessionNo: string;
    cik: string;
    companyNameLong: string;
    description: string;
    formType: string;
    type: string;
    filingUrl: string;
    filedAt: string;
}

interface ProcessedFiling {
    contractType: string;
    accessionNo: string;
    cik: string;
    companyNameLong: string;
    ticker: string;
    description: string;
    formType: string;
    type: string;
    filingUrl: string;
    filedAt: string;
    scrapedContent: string | null;
    contentLength?: number;
    scrapingSuccess: boolean;
    scrapingError: string | null;
    processedAt: string;
    processingTimeMs: number;
}

interface FinalSummary {
    isFinalSummary: true;
    totalFilings: number;
    successfulScrapes: number;
    failedScrapes: number;
    filings: ProcessedFiling[];
    byContractType: Record<string, ProcessedFiling[]>;
}

type ScrapingResult = ProcessedFiling | FinalSummary;

// Create SEC API axios instance
const secApi = axios.create({
    baseURL: 'https://api.sec-api.io',
    headers: {
        'Authorization': '3401f1938bb3f18e8a470a28ba555e10f58b291c2e6d8153c81d97dd69f20a22',
        'Content-Type': 'application/json'
    }
});

// Create axios instance for scraping SEC URLs
const secScraper = axios.create({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
});

interface ScrapedContent {
    success: boolean;
    content: string | null;
    contentLength?: number;
    error?: string;
}

// Function to scrape filing URL content
async function scrapeFilingContent(filingUrl: string): Promise<ScrapedContent> {
    try {
        console.log(`Scraping content from: ${filingUrl}`);
        const response = await secScraper.get(filingUrl);
        const $ = cheerio.load(response.data);

        // Extract text content from the HTML
        const content = $('body').text().trim();

        return {
            success: true,
            content: content,
            contentLength: content.length,
            // tables: tables,
            // paragraphs: paragraphs
        };
    } catch (error) {
        const err = error as Error;
        console.error(`Error scraping ${filingUrl}:`, err.message);
        return {
            success: false,
            error: err.message,
            content: null
        };
    }
}

// Function to process each filing immediately and return values instantly
async function processFilingImmediately(filing: Filing, contractType: string, filingIndex: number, totalFilings: number): Promise<ProcessedFiling> {
    const startTime = Date.now();

    // Now scrape the content
    console.log(`🌐 Scraping content from URL...`);
    const scrapedData = await scrapeFilingContent(filing.filingUrl);

    // Combine all data
    const processedFiling = {
        contractType: contractType,
        accessionNo: filing.accessionNo,
        cik: filing.cik,
        companyNameLong: filing.companyNameLong,
        ticker: filing.ticker,
        description: filing.description,
        formType: filing.formType,
        type: filing.type,
        filingUrl: filing.filingUrl,
        filedAt: filing.filedAt,
        scrapedContent: scrapedData.content,
        contentLength: scrapedData.contentLength,
        scrapingSuccess: scrapedData.success,
        scrapingError: scrapedData.error || null,
        processedAt: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime
    };

    if (!processedFiling.scrapingSuccess) {
        console.log(`   ❌ Scraping Error: ${processedFiling.scrapingError}`);
    } else if (processedFiling.scrapedContent) {
        // console.log(`   📄 Content Preview: ${processedFiling.scrapedContent.substring(0, 150)}...`);
    } else {
        console.log(`   📄 No content available`);
    }


    return processedFiling;
}

// Async generator function that yields each result immediately
export async function* scrapeSecAPI(): AsyncGenerator<ScrapingResult, void, unknown> {
    const contractTypes = [
        {
            contractType: "Offer Letter",
            commonFormTypes: ["8-K", "S-1"],
            exhibitCodesKeywords: ["Ex-10.1", "Offer Letter"]
        },
        {
            contractType: "Employment Agreement",
            commonFormTypes: ["10-K", "10-Q", "8-K", "S-1", "DEF 14A"],
            exhibitCodesKeywords: ["Ex-10.1", "Employment Agreement"]
        },
        {
            contractType: "Severance Agreement",
            commonFormTypes: ["8-K", "10-K", "DEF 14A"],
            exhibitCodesKeywords: ["Ex-10.1", "Severance", "Separation"]
        },
        {
            contractType: "MSA / SOW",
            commonFormTypes: ["10-K", "8-K"],
            exhibitCodesKeywords: ["Ex-10.1", "Master Services Agreement", "SOW"]
        },
        {
            contractType: "Founder/Shareholder Agreements",
            commonFormTypes: ["S-1", "DEF 14A"],
            exhibitCodesKeywords: ["Ex-3.1", "Ex-10.2", "Shareholder Agreement", "Founder Agreement"]
        },
        {
            contractType: "Independent Contractor Agreement",
            commonFormTypes: ["8-K", "S-1", "10-Q"],
            exhibitCodesKeywords: ["Ex-10.1", "Contractor Agreement"]
        }
    ];

    try {
        console.log("🚀 Starting SEC API scraping with REAL-TIME processing...");
        const allProcessedFilings: ProcessedFiling[] = [];
        const ITEMS_PER_PAGE = 100;
        let globalFilingIndex = 0;
        let totalExpectedFilings = 0;

        // First, get total count for all contract types
        for (const contract of contractTypes) {
            const countResponse = await secApi.post('/full-text-search', {
                query: contract.exhibitCodesKeywords.join(', '),
                formTypes: contract.commonFormTypes,
                start: 0
            });
            totalExpectedFilings += countResponse.data.total.value;
            console.log(`   ${contract.contractType}: ${countResponse.data.total.value} filings`);
        }

        for (const contract of contractTypes) {
            console.log(`\n🎯 STARTING ${contract.contractType.toUpperCase()}...`);

            // Get first page to determine total results
            const firstPageResponse = await secApi.post('/full-text-search', {
                query: contract.exhibitCodesKeywords.join(', '),
                formTypes: contract.commonFormTypes,
                start: 0
            });

            const totalResults = firstPageResponse.data.total.value;
            const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);
            console.log(`📋 ${contract.contractType}: ${totalResults} results across ${totalPages} pages`);

            // Process first page filings immediately - ONE BY ONE
            for (const filing of firstPageResponse.data.filings) {
                globalFilingIndex++;
                console.log(`\n⚡ IMMEDIATE PROCESSING [${globalFilingIndex}/${totalExpectedFilings}] ⚡`);

                const processedFiling = await processFilingImmediately(
                    filing,
                    contract.contractType,
                    globalFilingIndex,
                    totalExpectedFilings
                );

                allProcessedFilings.push(processedFiling);

                // YIELD the result immediately - this returns the result right away!
                yield processedFiling;

                // Show running statistics
                const successCount = allProcessedFilings.filter(f => f.scrapingSuccess).length;
                const failCount = allProcessedFilings.filter(f => !f.scrapingSuccess).length;
                console.log(`📊 RUNNING STATS: ${successCount} successful, ${failCount} failed, ${allProcessedFilings.length} total processed`);

                // Add small delay to avoid overwhelming the SEC servers
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Process remaining pages - ONE BY ONE
            for (let page = 2; page <= totalPages; page++) {
                console.log(`\n📄 Fetching page ${page}/${totalPages} for ${contract.contractType}...`);

                const response = await secApi.post('/full-text-search', {
                    query: contract.exhibitCodesKeywords.join(', '),
                    formTypes: contract.commonFormTypes,
                    page
                });

                // Process each filing immediately - ONE BY ONE
                for (const filing of response.data.filings) {
                    globalFilingIndex++;
                    console.log(`\n⚡ IMMEDIATE PROCESSING [${globalFilingIndex}/${totalExpectedFilings}] ⚡`);

                    const processedFiling = await processFilingImmediately(
                        filing,
                        contract.contractType,
                        globalFilingIndex,
                        totalExpectedFilings
                    );

                    allProcessedFilings.push(processedFiling);

                    // YIELD the result immediately - this returns the result right away!
                    yield processedFiling;

                    // Show running statistics
                    const successCount = allProcessedFilings.filter(f => f.scrapingSuccess).length;
                    const failCount = allProcessedFilings.filter(f => !f.scrapingSuccess).length;
                    console.log(`📊 RUNNING STATS: ${successCount} successful, ${failCount} failed, ${allProcessedFilings.length} total processed`);

                    // Add small delay to avoid overwhelming the SEC servers
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            console.log(`✅ COMPLETED ${contract.contractType.toUpperCase()}`);
        }


        // Summary statistics
        const successfulScrapes = allProcessedFilings.filter(f => f.scrapingSuccess).length;
        const failedScrapes = allProcessedFilings.filter(f => !f.scrapingSuccess).length;

        console.log(`❌ Failed scrapes: ${failedScrapes}`);

        // Group by contract type
        const byContractType: Record<string, ProcessedFiling[]> = allProcessedFilings.reduce((acc: Record<string, ProcessedFiling[]>, filing) => {
            if (!acc[filing.contractType]) {
                acc[filing.contractType] = [];
            }
            acc[filing.contractType].push(filing);
            return acc;
        }, {});

        console.log(`\n📋 Results by contract type:`);
        for (const [contractType, filings] of Object.entries(byContractType)) {
            console.log(`  ${contractType}: ${filings.length} filings`);
        }

        // Yield final summary
        yield {
            isFinalSummary: true,
            totalFilings: allProcessedFilings.length,
            successfulScrapes,
            failedScrapes,
            filings: allProcessedFilings,
            byContractType
        };

    } catch (error) {
        console.error("❌ Error in SEC API scraping:", error);
        throw error;
    }
}

// Updated main execution function to handle async generator
// (async () => {
//     try {
//         console.log("🚀 Starting SEC API scraping with REAL-TIME yield results...");

//         for await (const result of scrapeSecAPI()) {
//             console.log(`\n🎉 RECEIVED RESULT FOR: ${(result as ProcessedFiling).ticker} - ${(result as ProcessedFiling).companyNameLong}`);
//             console.log(`   Contract Type: ${(result as ProcessedFiling).contractType}`);
//             console.log(`   Accession No: ${(result as ProcessedFiling).accessionNo}`);
//             console.log(`   CIK: ${(result as ProcessedFiling).cik}`);
//             console.log(`   Description: ${(result as ProcessedFiling).description}`);
//             console.log(`   Form Type: ${(result as ProcessedFiling).formType}`);
//             console.log(`   Type: ${(result as ProcessedFiling).type}`);
//             console.log(`   Filing URL: ${(result as ProcessedFiling).filingUrl?.split('/').pop()}`);
//             console.log(`   Filed At: ${(result as ProcessedFiling).filedAt}`);
//             console.log(`   Contract Data Preview: ${(result as ProcessedFiling).scrapedContent?.substring(0, 150)}`);  

//         }

        

//         console.log("\n🎯 All results have been processed and yielded!");

//     } catch (error) {
//         console.error("❌ Script execution failed:", error);
//     }
// })();