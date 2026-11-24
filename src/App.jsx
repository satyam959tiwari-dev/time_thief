import { useState, useEffect } from "react";
import "./App.css";

function generateQuestion() {
  const a = Math.floor(Math.random() * 20) + 1;
  const b = Math.floor(Math.random() * 20) + 1;
  const answer = a + b;

  const options = [answer, answer + 1, answer - 1, answer + 3];

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return { a, b, answer, options };
}

export default function App() {
  const [time, setTime] = useState(10);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const [question, setQuestion] = useState(null);

  const playing = started && time > 0;

  useEffect(() => {
    if (!playing) return;

    const timer = setInterval(() => {
      setTime(t => Math.max(0, t - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [playing]);

  function startGame() {
    setTime(10);
    setScore(0);
    setQuestion(generateQuestion());
    setStarted(true);
  }

  function checkAnswer(option) {
    if (!playing) return;

    if (option === question.answer) {
      setScore(s => s + 10);
      setTime(t => t + 3);
    } else {
      setTime(t => Math.max(0, t - 2));
    }

    setQuestion(generateQuestion());
  }

  return (
    <main className="game">
      <p className="tagline">STEAL TIME. BEAT THE CLOCK.</p>
      <h1>TIME <span>THIEF</span></h1>

      <p>Score: {score}</p>

      <div className={`timer ${time <= 3 ? "danger" : ""}`}>
        {time}s
      </div>

      {playing ? (
        <>
          <h2>{question.a} + {question.b} = ?</h2>

          <div className="options">
            {question.options.map(option => (
              <button
                key={option}
                onClick={() => checkAnswer(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <h2>{started ? "Time's Up!" : "Ready to play?"}</h2>

          <button onClick={startGame}>
            {started ? "Play Again" : "Start Game"}
          </button>
        </>
      )}

      <footer>Correct +3s · Wrong −2s</footer>
    </main>
  );
}