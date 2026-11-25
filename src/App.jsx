import { useState, useEffect } from "react";
import "./App.css";

function generateQuestion(difficulty) {
  const max = difficulty === "easy" ? 10 : difficulty === "medium" ? 30 : 100;

  const a = Math.floor(Math.random() * max) + 1;
  const b = Math.floor(Math.random() * max) + 1;
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
  const [highScore, setHighScore] = useState(() =>
    Number(localStorage.getItem("highScore") || 0),
  );
  const [started, setStarted] = useState(false);
  const [question, setQuestion] = useState(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [bonus, setBonus] = useState("");
  const [difficulty, setDifficulty] = useState("easy");

  const playing = started && time > 0;

  useEffect(() => {
    if (!playing) return;

    const timer = setInterval(() => {
      setTime((t) => Math.max(0, t - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    localStorage.setItem("highScore", highScore);
  }, [highScore]);

  function startGame() {
    setTime(10);
    setScore(0);
    setQuestion(generateQuestion(difficulty));
    setStarted(true);
    setStreak(0);
    setBestStreak(0);
    setBonus("");
  }

  function checkAnswer(option) {
    if (!playing || !question) return;

    setBonus("");

    if (option === question.answer) {
      const newScore = score + 10;
      const newStreak = streak + 1;

      setScore(newScore);
      setHighScore((best) => Math.max(best, newScore));
      setStreak(newStreak);
      setBestStreak((best) => Math.max(best, newStreak));

      let extraTime = 3;

      if (newStreak % 10 === 0) {
        extraTime += 10;
        setBonus("🔥 Legendary Combo! +10s");
      } else if (newStreak % 5 === 0) {
        extraTime += 5;
        setBonus("⚡ Super Combo! +5s");
      } else if (newStreak % 3 === 0) {
        extraTime += 2;
        setBonus("🔥 Combo! +2s");
      }

      setTime((t) => t + extraTime);
    } else {
      setStreak(0);
      setTime((t) => Math.max(0, t - 2));
    }

    setQuestion(generateQuestion(difficulty));
  }

  return (
    <main className="game">
      <p className="tagline">STEAL TIME. BEAT THE CLOCK. Play Fast!</p>

      <h1>
        TIME <span>THIEF</span>
      </h1>

      <p>Score: {score}</p>
      <p>🏆 High Score: {highScore}</p>
      <p>🔥 Streak: {streak}</p>
      <p>🏅 Best Streak: {bestStreak}</p>

      {bonus && <p className="bonus">{bonus}</p>}

      <div className={`timer ${time <= 3 ? "danger" : ""}`}>{time}s</div>

      {playing ? (
        <>
          <h2>
            {question.a} + {question.b} = ?
          </h2>

          <div className="options">
            {question.options.map((option) => (
              <button key={option} onClick={() => checkAnswer(option)}>
                {option}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <h2>{started ? "Time's Up!" : "Ready to play?"}</h2>

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <button onClick={startGame}>
            {started ? "Play Again" : "Start Game"}
          </button>
        </>
      )}

      <footer>Correct +3s · Wrong −2s</footer>
    </main>
  );
}
