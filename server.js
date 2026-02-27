const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const rooms = new Map();

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("join-room", (roomId, userId) => {
      socket.join(roomId);
      console.log(`User ${userId} (socket ${socket.id}) joined room ${roomId}`);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, { users: new Set(), cards: [], logs: [], messages: [], clientProfile: null });
      }
      rooms.get(roomId).users.add(userId);

      // Send current state to newly joined user
      socket.emit("sync-state", rooms.get(roomId).cards);
      socket.emit("sync-logs", rooms.get(roomId).logs);
      socket.emit("sync-messages", rooms.get(roomId).messages);
      socket.emit("sync-client-profile", rooms.get(roomId).clientProfile);

      // Notify others in room
      socket.to(roomId).emit("user-connected", userId);

      socket.on("disconnect", () => {
        console.log(`User ${userId} disconnected from room ${roomId}`);
        rooms.get(roomId)?.users.delete(userId);
        socket.to(roomId).emit("user-disconnected", userId);
      });
    });

    // Tarot Card Events
    socket.on("add-card", (roomId, card) => {
      const room = rooms.get(roomId);
      if (room) {
        room.cards.push(card);
        io.to(roomId).emit("card-added", card);
      }
    });

    socket.on("update-card", (roomId, updatedCard) => {
      const room = rooms.get(roomId);
      if (room) {
        const index = room.cards.findIndex((c) => c.id === updatedCard.id);
        if (index !== -1) {
          room.cards[index] = updatedCard;
          socket.to(roomId).emit("card-updated", updatedCard); // Send only to others to avoid lag on self
        }
      }
    });

    socket.on("flip-card", (roomId, cardId, isReversed, isFlipped) => {
      const room = rooms.get(roomId);
      if (room) {
        const card = room.cards.find((c) => c.id === cardId);
        if (card) {
          card.isReversed = isReversed;
          card.isFlipped = isFlipped;
          io.to(roomId).emit("card-flipped", cardId, isReversed, isFlipped);
        }
      }
    });

    // Premium Features: Live Cursors & Action Logs
    socket.on("cursor-move", (roomId, cursorData) => {
      // cursorData: { userId, x, y }
      // We don't save cursors to room state, just broadcast
      socket.to(roomId).emit("cursor-move", cursorData);
    });

    socket.on("activity-log", (roomId, logEntry) => {
      // logEntry: { id, message, timestamp, userId }
      const room = rooms.get(roomId);
      if (room) {
        if (!room.logs) room.logs = [];
        room.logs.push(logEntry);
        if (room.logs.length > 50) room.logs.shift(); // Keep last 50
        io.to(roomId).emit("activity-log", logEntry);
      }
    });

    // Auto-Spread Feature Sync (Bulk Update)
    socket.on("sync-all-cards", (roomId, allCards) => {
      const room = rooms.get(roomId);
      if (room) {
        room.cards = allCards;
        socket.to(roomId).emit("sync-state", allCards);
      }
    });

    // Chat System
    socket.on("typing", (roomId, isTyping) => {
      socket.to(roomId).emit("user-typing", isTyping);
    });

    socket.on("chat-message", (roomId, messageData) => {
      const room = rooms.get(roomId);
      if (room) {
        if (!room.messages) room.messages = [];
        room.messages.push(messageData);
        if (room.messages.length > 100) room.messages.shift(); // Keep last 100
        socket.to(roomId).emit("chat-message", messageData);
      }
    });

    // Clear Table
    socket.on("clear-table", (roomId) => {
      const room = rooms.get(roomId);
      if (room) {
        room.cards = [];
        io.to(roomId).emit("sync-state", []);
      }
    });

    // Client Profile Sync
    socket.on("update-client-profile", (roomId, profile) => {
      const room = rooms.get(roomId);
      if (room) {
        room.clientProfile = profile;
        io.to(roomId).emit("client-profile-updated", profile);
      }
    });

    socket.on("update-aura", (roomId, aura) => {
      socket.to(roomId).emit("aura-updated", aura);
    });
  });

  server.once("error", (err) => {
    console.error(err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
