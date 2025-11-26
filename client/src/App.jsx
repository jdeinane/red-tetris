import { Routes, Route } from "react-router-dom";
import GamePage from "./components/GamePage";

function App() {
  return (
    <Routes>
      <Route path="/:room/:player" element = {<GamePage />} />
      <Route path="*" element={<h1>Welcome to Pink Tetris</h1>} />
    </Routes>
  );
}

export default App;