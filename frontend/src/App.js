import "./App.css";
import React, { useState, useEffect } from "react";

let winningCombinations = [
  // Horizontal wins
  [0, 1, 2, 3],
  [1, 2, 3, 4],
  [2, 3, 4, 5],
  [3, 4, 5, 6],
  [7, 8, 9, 10],
  [8, 9, 10, 11],
  [9, 10, 11, 12],
  [10, 11, 12, 13],
  [14, 15, 16, 17],
  [15, 16, 17, 18],
  [16, 17, 18, 19],
  [17, 18, 19, 20],
  [21, 22, 23, 24],
  [22, 23, 24, 25],
  [23, 24, 25, 26],
  [24, 25, 26, 27],
  [28, 29, 30, 31],
  [29, 30, 31, 32],
  [30, 31, 32, 33],
  [31, 32, 33, 34],
  [35, 36, 37, 38],
  [36, 37, 38, 39],
  [37, 38, 39, 40],
  [38, 39, 40, 41],
  // Vertical wins
  [0, 7, 14, 21],
  [7, 14, 21, 28],
  [14, 21, 28, 35],
  [1, 8, 15, 22],
  [8, 15, 22, 29],
  [15, 22, 29, 36],
  [2, 9, 16, 23],
  [9, 16, 23, 30],
  [16, 23, 30, 37],
  [3, 10, 17, 24],
  [10, 17, 24, 31],
  [17, 24, 31, 38],
  [4, 11, 18, 25],
  [11, 18, 25, 32],
  [18, 25, 32, 39],
  [5, 12, 19, 26],
  [12, 19, 26, 33],
  [19, 26, 33, 40],
  [6, 13, 20, 27],
  [13, 20, 27, 34],
  [20, 27, 34, 41],
  // Diagonal wins
  [3, 9, 15, 21],
  [4, 10, 16, 22],
  [5, 11, 17, 23],
  [6, 12, 18, 24],
  [0, 8, 16, 24],
  [1, 9, 17, 25],
  [2, 10, 18, 26],
  [3, 11, 19, 27],
  [14, 22, 30, 38],
  [13, 21, 29, 37],
  [12, 20, 28, 36],
  [11, 19, 27, 35],
  [20, 26, 32, 38],
  [19, 25, 31, 37],
  [18, 24, 30, 36],
  [17, 23, 29, 35],
];

const App = () => {
  const [ws, setWs] = useState(null);
  const [gameState, setGameState] = useState(Array(42).fill(null));
  const [player, setPlayer] = useState(null);
  const [turn, setTurn] = useState(null);
  const [message, setMessage] = useState("Connecting to server...");
  const [winner, setWinner] = useState(null);
  const [scores, setScores] = useState({ X: 0, O: 0 });

  useEffect(() => {
    const socket = new WebSocket(
      "ws://" + window.location.hostname + ":" + window.location.port
    );

    socket.onopen = () => {
      setMessage("Connected to server. Waiting for an opponent...");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "start") {
        setPlayer(data.player);
        setTurn(data.turn);
        setGameState(data.board);
        setMessage(`Game started. You are player ${data.player}`);
        ["board", "scores"].map((className) => showByClassName(className));
      } else if (data.type === "opponent_left") {
        setMessage("Your opponent left the game.");
      } else if (data.type === "move") {
        setGameState(data.board);
        setTurn(data.turn);
        const winner_c = checkWinner(data.board);
        if (winner_c) {
          //setWinner(winner_c);
          setMessage(
            winner_c === player ? "You scored !" : "Your opponent scored !"
          );
          setScores((prevScores) => ({
            ...prevScores,
            [winner_c]: prevScores[winner_c] + 1,
          }));
        } else if (!data.board.includes(null)) {
          //checkFinalWinner(scores.slice());
        }
      }
    };

    socket.onclose = () => {
      setMessage("Connection closed. Please refresh to try again.");
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [player]);

  const handleClick = (index) => {
    if (turn !== player || !ws || winner) return;

    const columnIndex = index % 7;
    let availableIndex = null;

    // Find the lowest available spot in the selected column
    for (let i = 5; i >= 0; i--) {
      if (!gameState[columnIndex + i * 7]) {
        availableIndex = columnIndex + i * 7;
        break;
      }
    }

    if (availableIndex === null) return; // Column is full

    const newGameState = [...gameState];
    newGameState[availableIndex] = player;

    const winner_c = checkWinner(newGameState);

    setGameState(newGameState);
    setTurn(player === "X" ? "O" : "X");

    ws.send(
      JSON.stringify({
        type: "move",
        board: newGameState,
        turn: player === "X" ? "O" : "X",
      })
    );

    if (winner_c) {
      setMessage(
        winner_c === player ? "You scored!" : "Your opponent just scored!"
      );
      setScores((prevScores) => ({
        ...prevScores,
        [winner_c]: prevScores[winner_c] + 1,
      }));
    } else if (!newGameState.includes(null)) {
      checkFinalWinner(scores);
    }
  };

  const checkWinner = (board) => {
    for (let combo of winningCombinations) {
      const [a, b, c, d] = combo;
      if (
        board[a] &&
        board[a] === board[b] &&
        board[a] === board[c] &&
        board[a] === board[d]
      ) {
        winningCombinations = winningCombinations.filter(
          (arr) => JSON.stringify(arr) !== JSON.stringify(combo)
        );
        return board[a];
      }
    }
    return null;
  };

  const checkFinalWinner = (scores) => {
    const finalWinner =
      scores.X > scores.O ? "X" : scores.O > scores.X ? "O" : "Draw";
    setWinner(finalWinner);
    setMessage(
      finalWinner === "Draw"
        ? "It's a draw!"
        : `Game over! ${finalWinner} wins with ${Math.max(
            scores.X,
            scores.O
          )} points!`
    );
  };

  const showByClassName = (className) => {
    document
      .querySelectorAll("." + className)
      .forEach((e) => (e.style.display = ""));
  };
  return (
    <div>
      <h1>Puissance 4 Multiplayer Game!</h1>
      <h2>{message}</h2>
      <div className="scores" style={{ display: "none" }}>
        <h3>Scores:</h3>
        <p>Your score: {scores[player]}</p>
        <p>Opponent: {player === "X" ? scores.O : scores.X}</p>
      </div>
      {turn && !winner && (
        <h3>
          {turn === player ? `It's your turn` : `It's your opponent's turn`}
        </h3>
      )}
      <div className="board" style={{ display: "none" }}>
        {gameState.map((value, index) => (
          <div
            key={index}
            className="cell"
            data-value={value}
            onClick={() => handleClick(index)}
          >
            {value}
          </div>
        ))}
      </div>
      <p className="footer">
        a tiny project designed by{" "}
        <a href="mailto:antoine.marchal@pm.me">Antoine Marchal</a>.
      </p>
    </div>
  );
};

export default App;
