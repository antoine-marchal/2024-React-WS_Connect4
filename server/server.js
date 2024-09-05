const express = require("express");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");

const app = express();

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "../frontend/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let waitingPlayer = null;

wss.on("connection", function connection(ws) {
  if (waitingPlayer) {
    const opponent = waitingPlayer;
    waitingPlayer = null;

    ws.opponent = opponent;
    opponent.opponent = ws;
    const turn = ["X", "O"][Math.floor(Math.random() * 2)];
    ws.send(
      JSON.stringify({
        type: "start",
        player: "X",
        turn: turn,
        board: Array(42).fill(null),
      })
    );
    opponent.send(
      JSON.stringify({
        type: "start",
        player: "O",
        turn: turn,
        board: Array(42).fill(null),
      })
    );
  } else {
    waitingPlayer = ws;
    ws.send(JSON.stringify({ type: "waiting" }));
  }

  ws.on("message", async function incoming(message) {
    let data;
    try {
      if (Buffer.isBuffer(message)) {
        message = message.toString();
      }

      data = JSON.parse(message);

      if (ws.opponent) {
        ws.opponent.send(message);
      }
    } catch (err) {
      console.error("Failed to parse message as JSON:", err);
    }
  });

  ws.on("close", function () {
    if (ws.opponent) {
      ws.opponent.send(JSON.stringify({ type: "opponent_left" }));
      ws.opponent.opponent = null;
    }

    if (waitingPlayer === ws) {
      waitingPlayer = null;
    }
  });
});

server.listen(5173, function () {
  console.log("Server is listening on port 5173");
});
