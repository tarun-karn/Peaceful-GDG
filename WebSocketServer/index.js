const WebSocket = require("ws");
const dotenv = require("dotenv");
dotenv.config();

const port = process.env.PORT || process.env.SOCKET_PORT || 8802;
const wss = new WebSocket.Server({ port: port });
console.log(`WebSocketServer listening on port ${port}`);

const map = new Map();
/* 
    This is an inmemory storage for all the rooms
    Map will store the room id of the current users and their connection
    map type = {
        uuid : Connection[]
    }
    connection type = {
        connectId : number,
        ws : WebSocket Connection
    }
*/

let counter = 0;
// wss.broadcast = (id, data) => {
//   console.log("bcas");
//   wss.clients.forEach((client) => {
//     if (client.readyState == WebSocket.OPEN && data != undefined) {
//       if (client.id === id) {
//         client.send(data);
//       }
//     }
//   });
// };
wss.on("connection", async (ws, req) => {
  // Parse query parameters safely using a base URL
  const reqUrl = req && req.url ? req.url : "/";
  const params = new URL(reqUrl, "http://localhost");
  const qs = new URLSearchParams(params.search);
  const id = qs.get("id");
  const isServer = qs.get("isServer") === "true";

  if (!id) {
    console.warn("WebSocket connection rejected: missing id");
    ws.terminate();
    return;
  }

  if (!isServer && (!map.has(id) || !map.get(id).server)) {
    console.warn(`WebSocket connection rejected: no server for id=${id}`);
    ws.terminate();
    return;
  }

  if (!map.has(id)) map.set(id, {});
  const room = map.get(id);

  if (isServer) {
    room.server = ws;
    console.log(`Server connected for id=${id}`);
  } else {
    room.client = ws;
    console.log(`Client connected for id=${id}`);
  }

  const connectId = counter++;

  ws.on("message", (data, isBinary) => {
    try {
      const target = isServer ? room.client : room.server;
      if (target && target.readyState === WebSocket.OPEN) {
        target.send(data, { binary: isBinary }, (err) => {
          if (err)
            console.error("Error sending websocket data:", err.message || err);
        });
      } else {
        // Target not available or not open
        // Optionally buffer or drop
        // console.debug("Target socket not open, dropping message");
      }
    } catch (err) {
      console.error(
        "WebSocket message handler error:",
        err && err.message ? err.message : err
      );
    }
  });

  ws.on("close", () => {
    try {
      if (isServer) {
        if (room.client && room.client.readyState === WebSocket.OPEN)
          room.client.terminate();
      } else {
        if (room.server && room.server.readyState === WebSocket.OPEN)
          room.server.terminate();
      }
    } catch (err) {
      console.warn(
        "Error during socket close cleanup:",
        err && err.message ? err.message : err
      );
    }
    map.delete(id);
    console.log(`Connection closed for id=${id}, isServer=${isServer}`);
  });
});
