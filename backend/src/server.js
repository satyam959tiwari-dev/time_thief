import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

const rooms = new Map();
const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 3000;

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Time Thief backend is running",
  });
});

function generateQuestion() {
  const a = Math.floor(Math.random() * 20) + 1;
  const b = Math.floor(Math.random() * 20) + 1;

  const answer = a + b;

  const options = [answer, answer + 1, answer - 1, answer + 3];

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return { a, b, options };
}

io.on("connection", (socket) => {
  // Create Room
  socket.on("create-room", (name) => {
    let code;

    do {
      code = Math.random().toString(36).slice(2, 8).toUpperCase();
    } while (rooms.has(code));

    const room = {
      code,
      started: false,
      players: [{ id: socket.id, name, score: 0 }],
    };

    rooms.set(code, room);
    socket.join(code);

    io.to(code).emit("room-updated", room);
  });

  // Join Room
  socket.on("join-room", ({ name, code }) => {
    const room = rooms.get(code);

    if (!room) {
      socket.emit("room-error", "Room not found");
      return;
    }

    if (room.started) {
      socket.emit("room-error", "Match already started");
      return;
    }

    if (room.players.length >= 10) {
      socket.emit("room-error", "Room is full");
      return;
    }

    if (room.players.some((p) => p.id === socket.id)) return;

    room.players.push({
      id: socket.id,
      name,
      score: 0,
    });

    socket.join(code);
    io.to(code).emit("room-updated", room);
  });

  // Start Match - NEW
  socket.on("start-game", (code) => {
    const room = rooms.get(code);

    if (!room || room.players.length < 2) return;
    if (room.players[0].id !== socket.id) return;
    if (room.started) return;

    room.started = true;
    room.finished = false;
    room.time = 60;
    room.questions = [generateQuestion()];

    room.players.forEach((player) => {
      player.score = 0;
      player.questionIndex = 0;
    });

    io.to(code).emit("room-updated", room);

    const timer = setInterval(() => {
      if (!rooms.has(code)) {
        clearInterval(timer);
        return;
      }

      room.time = Math.max(0, room.time - 1);

      if (room.time === 0) {
        clearInterval(timer);
        room.finished = true;
      }

      io.to(code).emit("room-updated", room);
    }, 1000);
  });

  socket.on("submit-answer", ({ code, option, questionIndex }) => {
    const room = rooms.get(code);

    if (!room || !room.started || room.finished) return;

    const player = room.players.find((p) => p.id === socket.id);

    if (!player) return;
    if (player.questionIndex !== questionIndex) return;

    const question = room.questions[player.questionIndex];

    if (!question || !question.options.includes(option)) return;

    if (option === question.a + question.b) {
      player.score += 10;
    }

    player.questionIndex += 1;

    if (!room.questions[player.questionIndex]) {
      room.questions.push(generateQuestion());
    }

    io.to(code).emit("room-updated", room);
  });

  // Leave Room
  function leaveRoom() {
    for (const [code, room] of rooms) {
      if (!room.players.some((p) => p.id === socket.id)) continue;

      room.players = room.players.filter((p) => p.id !== socket.id);

      socket.leave(code);

      if (room.players.length === 0) {
        rooms.delete(code);
      } else {
        io.to(code).emit("room-updated", room);
      }
    }
  }

  socket.on("leave-room", leaveRoom);
  socket.on("disconnect", leaveRoom);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
