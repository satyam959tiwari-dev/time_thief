import { useState, useEffect } from "react";
import SinglePlayer from "./components/SinglePlayer";
import Multiplayer from "./components/MultiPlayer";
import { socket } from "./services/socket";
import "./App.css";

export default function App() {
  const [mode, setMode] = useState(null);
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, []);

  if (mode === "single") {
    return (
      <>
        <SinglePlayer />
        <button onClick={() => setMode(null)}>
          Back to Menu
        </button>
      </>
    );
  }

  if (mode === "multi") {
    return <Multiplayer onBack={() => setMode(null)} />;
  }

  return (
    <main className="game">
      <h1>TIME <span>THIEF</span></h1>

      <p style={{ color: isConnected ? "limegreen" : "red" }}>
        {isConnected ? "🟢 Server Online" : "🔴 Server Offline"}
      </p>

      <h2>Select Game Mode</h2>

      <button onClick={() => setMode("single")}>
        Single Player
      </button>

      <button
        disabled={!isConnected}
        onClick={() => setMode("multi")}
      >
        Multiplayer
      </button>
    </main>
  );
}