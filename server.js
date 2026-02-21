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
        rooms.set(roomId, { users: new Set(), cards: [] });
      }
      rooms.get(roomId).users.add(userId);

      // Send current state to newly joined user
      socket.emit("sync-state", rooms.get(roomId).cards);

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
  });

  server.once("error", (err) => {
    console.error(err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
