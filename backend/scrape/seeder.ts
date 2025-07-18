import { DataSource } from "typeorm";
import { config } from "dotenv";
import axios from "axios";

// Load environment variables
config();

// Create SEC API axios instance
const secApi = axios.create({
    baseURL: 'https://api.sec-api.io',
    headers: {
        'Authorization': process.env.SEC_API_KEY,
        'Content-Type': 'application/json'
    }
});

const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: ["src/entities/**/*.ts"],
    synchronize: false,
});

async function scrapeSecAPI() {
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
    ];        // Fetch data from SEC API
    try {
        console.log("Fetching data from SEC API...");
        const results = {};
        const ITEMS_PER_PAGE = 100; // Based on the observed response
        
        for (const contract of contractTypes) {
            console.log(`Fetching data for ${contract.contractType}...`);
            const firstPageResponse = await secApi.post('/full-text-search', {
                query: contract.exhibitCodesKeywords.join(', '),
                formTypes: contract.commonFormTypes,
                start: 0
            });
            
            const totalResults = firstPageResponse.data.total.value;
            const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);
            console.log(`Found ${totalResults} results, fetching ${totalPages} pages...`);
            
            // Store first page results
            results[contract.contractType] = {
                total: totalResults,
                filings: [...firstPageResponse.data.filings]
            };
            
            // Fetch remaining pages
            for (let page = 2; page <= totalPages; page++) {
                console.log(`Fetching page ${page} of ${totalPages} for ${contract.contractType}...`);
                const response = await secApi.post('/full-text-search', {
                    query: contract.exhibitCodesKeywords.join(', '),
                    formTypes: contract.commonFormTypes,
                    page
                });
                results[contract.contractType].filings.push(...response.data.filings);
            }
        }
        
        console.log("SEC API data fetched successfully");
        
        // Here you can store the results in your database if needed
        // For now, we'll just log the results
        console.log(JSON.stringify(results, null, 2));
    } catch (error) {
        console.error("Error fetching SEC API data:", error);
    }
}


async function main() {
    try {
        await AppDataSource.initialize();
        console.log("Database connection established");
        
        console.log("Seeding completed successfully");
    } catch (error) {
        console.error("Error during seeding:", error);
        throw error;
    } finally {
        await AppDataSource.destroy();
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });