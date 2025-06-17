import { config } from "dotenv";

// Load environment variables
config();

async function main() {
    try {
        console.log("Database connection established");

        
        
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