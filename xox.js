// server.js
const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Bellekte odaları tutmak için
let rooms = {};

// Oda oluştur
app.post("/rooms", (req, res) => {
  const roomId = uuidv4().slice(0, 6).toUpperCase();
  const { host, players, gameBoard, currentPlayer, gameActive } = req.body;

  rooms[roomId] = {
    id: roomId,
    host,
    players,
    gameBoard,
    currentPlayer,
    gameActive,
    winner: null,
    isDraw: false,
  };

  res.json({ success: true, roomId });
});

// Odaya katıl
app.post("/rooms/:id/join", (req, res) => {
  const room = rooms[req.params.id];
  if (!room) return res.json({ success: false, message: "Oda bulunamadı" });

  if (room.players.length >= 2) {
    return res.json({ success: false, message: "Oda dolu" });
  }

  const playerName = req.body.playerName || "Oyuncu";
  room.players.push({ name: playerName, symbol: "O" });
  room.gameActive = room.players.length === 2;

  res.json({ success: true, room });
});

// Odadan ayrıl
app.post("/rooms/:id/leave", (req, res) => {
  const room = rooms[req.params.id];
  if (!room) return res.json({ success: false });

  room.players = room.players.filter(p => p.name !== req.body.playerName);
  if (room.players.length === 0) {
    delete rooms[req.params.id]; // boş odayı sil
  } else {
    room.gameActive = false;
  }

  res.json({ success: true });
});

// Hamle yap
app.post("/rooms/:id/move", (req, res) => {
  const room = rooms[req.params.id];
  if (!room) return res.json({ success: false, message: "Oda yok" });

  const { index, symbol, player } = req.body;

  if (room.gameBoard[index] === "" && room.currentPlayer === symbol) {
    room.gameBoard[index] = symbol;
    room.currentPlayer = symbol === "X" ? "O" : "X";

    // Kazanma kontrolü
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];

    for (const [a, b, c] of winPatterns) {
      if (room.gameBoard[a] && room.gameBoard[a] === room.gameBoard[b] && room.gameBoard[a] === room.gameBoard[c]) {
        room.winner = player;
        room.gameActive = false;
        return res.json({ success: true, room });
      }
    }

    if (room.gameBoard.every(cell => cell !== "")) {
      room.isDraw = true;
      room.gameActive = false;
    }
  }

  res.json({ success: true, room });
});

// Oda bilgisini getir
app.get("/rooms/:id", (req, res) => {
  const room = rooms[req.params.id];
  if (!room) return res.json({ success: false, message: "Oda bulunamadı" });
  res.json({ success: true, room });
});

// Room IDs için endpoint
app.get("/roomids", (req, res) => {
  res.json({ success: true, roomIds: Object.keys(rooms) });
});

app.listen(PORT, () => {
  console.log(`✅ Server çalışıyor: http://localhost:${PORT}`);
});
