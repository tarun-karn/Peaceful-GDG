const dotenv = require("dotenv");
dotenv.config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const run = async () => {
    const key = process.env.GEMINI_KEY;
    console.log("Checking GEMINI_KEY...");
    if (!key) {
        console.error("FAIL: GEMINI_KEY is missing in .env");
        return;
    }
    console.log(`Key found: ${key.substring(0, 5)}...`);

    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("Attempting to generate content...");
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log("SUCCESS: Response received!");
        console.log("Response text:", response.text());
    } catch (error) {
        console.error("FAIL: API Call Failed.");
        console.error("Error Message:", error.message);
        if (error.message.includes("API key not valid")) {
             console.error(">>> The provided API Key is INVALID. Please check it.");
        }
        if (error.message.includes("quota")) {
             console.error(">>> Quota exceeded.");
        }
    }
};

run();
