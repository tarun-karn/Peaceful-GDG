const dotenv = require("dotenv");
dotenv.config();
const OpenAI = require("openai");

const testOpenRouter = async () => {
    const apiKey = process.env.GEMINI_KEY;
    console.log("=== OpenRouter Test ===");
    console.log("API Key:", apiKey ? `${apiKey.substring(0, 15)}...` : "MISSING");
    console.log("Key Length:", apiKey ? apiKey.length : 0);
    
    if (!apiKey) {
        console.error("❌ GEMINI_KEY is missing!");
        return;
    }

    if (!apiKey.startsWith("sk-or-")) {
        console.error("❌ This is not an OpenRouter key!");
        return;
    }

    console.log("✅ OpenRouter key detected");
    
    try {
        const client = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: apiKey,
            defaultHeaders: {
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "MindMate Local",
            },
        });

        console.log("Sending test message to OpenRouter...");
        
        const stream = await client.chat.completions.create({
            model: "google/gemini-2.5-flash-lite",
            messages: [{ role: "user", content: "Say 'Hello, I am working!' in exactly those words." }],
            stream: true,
        });

        console.log("✅ Stream created successfully!");
        console.log("Response:");
        
        let fullResponse = "";
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
                process.stdout.write(content);
                fullResponse += content;
            }
        }
        
        console.log("\n\n✅ SUCCESS! Full response received:");
        console.log(fullResponse);
        
    } catch (error) {
        console.error("❌ FAILED!");
        console.error("Error:", error.message);
        if (error.response) {
            console.error("Response status:", error.response.status);
            console.error("Response data:", error.response.data);
        }
        if (error.cause) {
            console.error("Cause:", error.cause);
        }
    }
};

testOpenRouter();
