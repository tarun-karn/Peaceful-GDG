const dotenv = require("dotenv");
const path = require("path");
// Ensure env is loaded relative to this file just in case, but rely on index.js mostly
dotenv.config({ path: path.join(__dirname, "../.env") });

const { initHist } = require("./initHist.js");
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const OpenAI = require("openai");

const GOOGLE_MODEL_NAME = "gemini-pro";
const OPENROUTER_MODEL_NAME = "google/gemini-2.5-flash-lite"; // Correct OpenRouter model ID

let geminiModel;
let openaiClient;
let activeProvider = null; 

// FALLBACK KEY PROVIDED BY USER - REMOVE IN PRODUCTION IF NOT NEEDED
const HARDCODED_KEY = "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";

const setupGeminiChat = async () => {
  try {
    let apiKey = process.env.GEMINI_KEY ? process.env.GEMINI_KEY.trim() : null;
    if (!apiKey || apiKey === "undefined") {
      console.warn("process.env.GEMINI_KEY missing. Using Hardcoded Fallback.");
      apiKey = HARDCODED_KEY;
    }

    if (!apiKey) {
      console.error("CRITICAL: API Key is TOTALLY MISSING.");
      return;
    }

    const isOpenRouter = apiKey.startsWith("sk-or-");
    
    if (isOpenRouter) {
      console.log(`Setting up OpenRouter/OpenAI Client... (Key: ${apiKey.substring(0, 5)}...)`);
      openaiClient = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: apiKey,
        defaultHeaders: {
          "HTTP-Referer": "https://peaceful-gdg.vercel.app", // Required by OpenRouter
          "X-Title": "Methods of Peace", // Required by OpenRouter
        },
      });
      activeProvider = "openai";
      geminiModel = null;
    } else {
      console.log(`Setting up Google Gemini Client... (Key: ${apiKey.substring(0, 5)}...)`);
      const genAI = new GoogleGenerativeAI(apiKey);
      geminiModel = genAI.getGenerativeModel({ model: GOOGLE_MODEL_NAME });
      activeProvider = "google";
      openaiClient = null;
    }
  } catch (err) {
    console.error("Failed to setup Gemini/OpenRouter clients:", err.message);
  }
};

const startGeminiChat = (history = []) => {
  // Debug Log
  if (!geminiModel && !openaiClient) {
     console.error("startGeminiChat FAILED: Clients are null. activeProvider:", activeProvider);
     // Try to re-init synchronously if possible? No, async.
     // But we can check if HARDCODED_KEY exists and maybe we missed setup?
  }

  if (!geminiModel && !openaiClient) {
    return {
      sendMessageStream: async (msg) => {
        return {
          stream: (async function* () {
             yield { text: () => "Error: API Key is missing (Clients Check Failed). Check Backend startup logs." };
          })()
        };
      }
    };
  }

  if (activeProvider === "openai" || openaiClient) {
    // OpenRouter / OpenAI Adapter
    return {
      sendMessageStream: async (msg) => {
        try {
          const messages = history.map(h => ({
            role: h.role === "model" ? "assistant" : "user",
            content: h.parts[0].text
          }));
          messages.push({ role: "user", content: msg });

          const stream = await openaiClient.chat.completions.create({
            model: OPENROUTER_MODEL_NAME,
            messages: messages,
            stream: true,
          });

          return {
            stream: (async function* () {
              for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                if (content) {
                   yield { text: () => content };
                }
              }
            })()
          };
        } catch (error) {
           console.error("OpenRouter Error:", error);
           throw new Error("Failed to communicate with OpenRouter: " + error.message);
        }
      }
    };
  } else {
    // Standard Google Gemini
    const generationConfig = {
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    };
    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    return geminiModel.startChat({
      generationConfig,
      safetySettings,
      history: [...initHist, ...history],
    });
  }
};

const getAIStatus = () => ({
  initialized: !!(geminiModel || openaiClient),
  provider: activeProvider,
  model: activeProvider === "openai" ? OPENROUTER_MODEL_NAME : GOOGLE_MODEL_NAME
});

module.exports = { setupGeminiChat, geminiModel, startGeminiChat, getAIStatus };
