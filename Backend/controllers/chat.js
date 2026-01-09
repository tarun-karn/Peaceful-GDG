const dotenv = require("dotenv");
dotenv.config();
const { v4: uuid } = require("uuid");
const WebSocket = require("ws");
const querystring = require("querystring");
const { startGeminiChat } = require("../gemini/chat.js");
const chatHistModel = require("../models/ChatHist.js");


const mongoose = require("mongoose");

const connectWithChatBot = async (req, res) => {
  try {
    if (req.userId === undefined) {
      return res.status(400).json({ error: "UserId is required" });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected. Please check server logs and Atlas whitelist." });
    }

    const foundHist = await chatHistModel
      .find({ userId: req.userId })
      .sort({ timestamp: 1 });

    // console.log(foundHist);

    let foundHistForGemini = [];
    for (let conv of foundHist) {
      foundHistForGemini.push({
        role: "user",
        parts: [
          {
            text: conv.prompt,
          },
        ],
      });
      foundHistForGemini.push({
        role: "model",
        parts: [
          {
            text: conv.response,
          },
        ],
      });
    }
    // console.log(foundHistForGemini[0]);

    const roomId = uuid();
    // Use env var (now fixed) or fallback
    const websocketServerBase = process.env.WEBSOCKET_SERVER || "wss://peaceful-websocket.onrender.com";
    
    const websocketserverLink = `${websocketServerBase}?${querystring.stringify({
      id: roomId,
      isServer: true,
    })}`;
    
    const wss = new WebSocket(websocketserverLink);
    
    const connectionTimeout = setTimeout(() => {
      if (wss.readyState !== WebSocket.OPEN) {
        wss.terminate();
        if (!res.headersSent) {
          res.status(504).json({ error: "Gateway Timeout: Could not connect to WebSocket Server (Render might be sleeping)" });
        }
      }
    }, 8000); // 8 second timeout

    wss.on("open", () => {
      clearTimeout(connectionTimeout);
      // console.log("Backend Connected to WebSocket Server successfully!");
      res.status(200).json({ chatId: roomId });
      wss.send(JSON.stringify({ type: "server:connected" }));
    });

    // Get history from mongo
    const chat = startGeminiChat(foundHistForGemini);

    wss.on("message", async (data) => {
      try {
        // console.log("Backend received message:", data.toString());
        data = JSON.parse(data.toString());

        if (data?.type === "client:chathist") {
          console.log("Sending chat history to client");
          wss.send(
            JSON.stringify({ type: "server:chathist", data: foundHist })
          );
        } else if (data?.type === "client:prompt") {
          if (data.prompt === undefined) {
            // throw err
            return;
          }

          // Prompt by the user sent to gemini
          const result = await chat.sendMessageStream(data.prompt);
          let respText = "";
          wss.send(JSON.stringify({ type: "server:response:start" }));

          for await (const chunk of result.stream) {
            const chunkText = chunk.text();

            wss.send(
              JSON.stringify({
                type: "server:response:chunk",
                chunk: chunkText,
              })
            );
            respText += chunkText;
          }
          wss.send(JSON.stringify({ type: "server:response:end" }));
          // should be stored in the db
          await chatHistModel.create({
            userId: req.userId,
            prompt: data.prompt,
            response: respText,
          });
        }
      } catch (error) {
        console.error("Error processing message:", error);
        // Send error to client so they don't hang
        wss.send(JSON.stringify({ type: "server:response:start" }));
        wss.send(JSON.stringify({ 
          type: "server:response:chunk", 
          chunk: "Error: Failed to generate response. Check Backend logs (likely invalid API Key)." 
        }));
        wss.send(JSON.stringify({ type: "server:response:end" }));
      }
    });
    wss.on("close", () => {
      console.log("Backend WebSocket Closed");
    });
    wss.on("error", (error) => {
      console.error("WebSocket Error in Backend:", error.message);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to connect to WebSocket Server" });
      }
    });
  } catch (error) {
    console.error("Controller Error:", error);
    if (!res.headersSent) {
       res.status(500).json({ error: "Internal Server Error" });
    }
  }
};
module.exports = { connectWithChatBot };
