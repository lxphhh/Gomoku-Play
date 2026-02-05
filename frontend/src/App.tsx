import { useState } from 'react';
import Game from './components/Game';
import { GameMode } from './types';

function App() {
  const [gameMode, setGameMode] = useState<GameMode>('pva');

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎮 Gomoku-Play
          </h1>
          <p className="text-gray-600">五子棋对战游戏</p>
        </header>
        
        <Game mode={gameMode} onModeChange={setGameMode} />
        
        <footer className="text-center mt-8 text-gray-500 text-sm">
          <p>支持人人对战 | 人机对战 | 实时通信</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
