const dotenv = require("dotenv");
dotenv.config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const run = async () => {
    const key = process.env.GEMINI_KEY;
    console.log("=== Google Gemini API Test ===");
    console.log("Key:", key ? `${key.substring(0, 10)}...` : "MISSING");
    
    if (!key) {
        console.error("❌ GEMINI_KEY is missing!");
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(key);
        
        // Try different model names
        const modelNames = ["gemini-pro", "gemini-1.5-pro", "gemini-1.5-flash"];
        
        for (const modelName of modelNames) {
            try {
                console.log(`\nTrying model: ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Say 'Hello, I am working!' in exactly those words.");
                const response = await result.response;
                
                console.log(`✅ SUCCESS with ${modelName}!`);
                console.log("Response:", response.text());
                return; // Exit on first success
            } catch (modelError) {
                console.log(`❌ ${modelName} failed:`, modelError.message);
                if (modelError.status) console.log(`   Status: ${modelError.status}`);
                if (modelError.statusText) console.log(`   Status Text: ${modelError.statusText}`);
                if (modelError.errorDetails) console.log(`   Details:`, modelError.errorDetails);
            }
        }
        console.log("\n❌ All models failed!");
    } catch (error) {
        console.error("❌ FAILED!");
        console.error("Error:", error.message);
        console.error("Full error:", JSON.stringify(error, null, 2));
    }
};

run();
