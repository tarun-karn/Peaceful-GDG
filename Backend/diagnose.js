const WebSocket = require("ws");

const checkPort = (port) => {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://localhost:${port}?id=test&isServer=true`);
    
    ws.on('open', () => {
      console.log(`[SUCCESS] Connected to localhost:${port}`);
      ws.close();
      resolve(true);
    });

    ws.on('error', (err) => {
      console.log(`[FAILURE] Could not connect to localhost:${port}. Error: ${err.message}`);
      resolve(false);
    });
    
    ws.on('unexpected-response', (req, res) => {
         console.log(`[FAILURE] Unexpected response from localhost:${port}: ${res.statusCode} ${res.statusMessage}`);
         resolve(false);
    });
  });
};

const run = async () => {
  console.log("Checking WebSocket Server on port 8802...");
  await checkPort(8802);
  
  console.log("\nChecking Backend Server (for comparison) on port 8800...");
  await checkPort(8800);
};

run();
