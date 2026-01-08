const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

const envPath = path.join(__dirname, ".env");
console.log("Checking .env at:", envPath);

if (fs.existsSync(envPath)) {
    console.log("File exists.");
    const rawParams = dotenv.config({ path: envPath });
    if (rawParams.error) {
        console.error("Dotenv Error:", rawParams.error);
    } else {
        console.log("Dotenv parsed successfully.");
        const key = process.env.GEMINI_KEY;
        if (key) {
            console.log("GEMINI_KEY found.");
            console.log("Starts with:", key.substring(0, 10));
            console.log("Length:", key.length);
        } else {
            console.error("GEMINI_KEY is missing/undefined in process.env");
        }
        
        const ws = process.env.WEBSOCKET_SERVER;
        console.log("WEBSOCKET_SERVER:", ws);
    }
} else {
    console.error("File DOES NOT exist.");
}
