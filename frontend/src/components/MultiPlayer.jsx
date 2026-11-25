import { useState, useEffect } from "react";
import { socket } from "../services/socket";

export default function Multiplayer({ onBack }) {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    function onRoomUpdated(data) {
      setRoom(data);
      setError("");
    }

    function onError(message) {
      setError(message);
    }

    function onDisconnect() {
      setRoom(null);
      setError("Server disconnected");
    }

    socket.on("room-updated", onRoomUpdated);
    socket.on("room-error", onError);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("room-updated", onRoomUpdated);
      socket.off("room-error", onError);
      socket.off("disconnect", onDisconnect);
      if (socket.connected) {
        socket.emit("leave-room");
      }
    };
  }, []);

  function createRoom() {
    socket.emit("create-room", playerName.trim());
  }

  function joinRoom() {
    socket.emit("join-room", {
      name: playerName.trim(),
      code: roomCode.trim().toUpperCase(),
    });
  }

  function startMatch() {
    socket.emit("start-game", room.code);
  }

  const me = room?.players.find((p) => p.id === socket.id);

  const question = room?.questions?.[me?.questionIndex];

  const leaderboard = [...(room?.players || [])].sort(
    (a, b) => b.score - a.score,
  );

  return (
    <main className="game">
      <h1>
        TIME <span>THIEF</span>
      </h1>

      {room ? (
        <>
          <h2>Room: {room.code}</h2>

          <p>Players: {room.players.length}/10</p>

          {room.players.map((player, index) => (
            <p key={player.id}>
              👤 {player.name}
              {index === 0 && " (Host)"}
              {player.id === socket.id && " (You)"}
            </p>
          ))}

          {!room.started && (
            <p>
              {room.players.length >= 2
                ? "Ready to play!"
                : "Waiting for players..."}
            </p>
          )}

          {room.players[0]?.id === socket.id &&
            room.players.length >= 2 &&
            !room.started && <button onClick={startMatch}>Start Match</button>}

          {room.players[0]?.id !== socket.id && !room.started && (
            <p>Waiting for host to start...</p>
          )}

          {room.started && !room.finished && question && (
  <>
    <h2>Match in Progress!</h2>

    <div className="timer">{room.time}s</div>

    <p>Your Score: {me.score}</p>

    <h2>{question.a} + {question.b} = ?</h2>

    <div className="options">
      {question.options.map((option) => (
        <button
          key={option}
          onClick={() =>
            socket.emit("submit-answer", {
              code: room.code,
              option,
              questionIndex: me.questionIndex,
            })
          }
        >
          {option}
        </button>
      ))}
    </div>

    <h3>Live Leaderboard</h3>

    {leaderboard.map((player, index) => (
      <p key={player.id}>
        {index + 1}. {player.name}: {player.score}
      </p>
    ))}
  </>
)}

{room.finished && (
  <>
    <h2>Match Over!</h2>

    <h2>
      {leaderboard.length > 1 &&
      leaderboard[0].score === leaderboard[1].score
        ? "🤝 Match Draw!"
        : `🏆 Winner: ${leaderboard[0]?.name}`}
    </h2>

    {leaderboard.map((player, index) => (
      <p key={player.id}>
        {index + 1}. {player.name}: {player.score}
      </p>
    ))}
  </>
)}
        </>
      ) : (
        <>
          <h2>Multiplayer Lobby</h2>

          <input
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />

          <button disabled={!playerName.trim()} onClick={createRoom}>
            Create Room
          </button>

          <p>OR</p>

          <input
            placeholder="Enter room code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          />

          <button
            disabled={!playerName.trim() || !roomCode.trim()}
            onClick={joinRoom}
          >
            Join Room
          </button>
        </>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button onClick={onBack}>Back to Menu</button>
    </main>
  );
}
