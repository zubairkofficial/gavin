import { ConfigService } from "@nestjs/config";
import axios from "axios";

// Create SEC API axios instance
const secApi = axios.create({
    baseURL: 'https://api.sec-api.io',
    headers: {
        'Authorization': 'a554113b8c7bad1273b72637824a10b3e3c87eae0b90e43bb308b97e774ea512',
        'Content-Type': 'application/json'
    }
});

console.log(process.env.SEC_API_KEY)

export async function scrapeSecAPI() {
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
                console.log(response.data)
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


(async ()=>{
   const data  = scrapeSecAPI()
   console.log(data)
})()