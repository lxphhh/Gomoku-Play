import Board from './Board';
import Controls from './Controls';
import { GameMode } from '../types';
import { useGame } from '../hooks/useGame';

interface GameContainerProps {
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
}

export default function GameContainer({ mode }: GameContainerProps) {
  const {
    gameState,
    makeMove,
    undoMove,
    restartGame,
    setGameMode,
    winningLine,
    error,
    clearError,
    isAIMoving,
  } = useGame({ mode, AIEnabled: true });

  const handleCellClick = async (position: { row: number; col: number }) => {
    await makeMove(position);
  };

  const getStatusMessage = (): string => {
    if (gameState.status === 'black_win') return '🎉 黑方获胜!';
    if (gameState.status === 'white_win') return '🎉 白方获胜!';
    if (gameState.status === 'draw') return '🤝 平局!';
    if (isAIMoving) return '🤖 AI 正在思考...';
    return `${gameState.currentPlayer === 'black' ? '⚫' : '⚪'} ${gameState.currentPlayer === 'black' ? '黑方' : '白方'} 回合`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-600 hover:text-red-800 font-bold">
            ×
          </button>
        </div>
      )}

      {/* 状态显示 */}
      <div className={`
        text-center py-4 mb-4 rounded-lg font-bold text-lg
        ${gameState.status.includes('win') ? 'bg-green-100 text-green-800' : ''}
        ${gameState.status === 'draw' ? 'bg-yellow-100 text-yellow-800' : ''}
        ${gameState.status === 'playing' ? 'bg-blue-100 text-blue-800' : ''}
      `}>
        {getStatusMessage()}
      </div>

      {/* 棋盘 */}
      <Board 
        board={gameState.board}
        onCellClick={handleCellClick}
        lastMove={gameState.moves[gameState.moves.length - 1]?.position}
        winningLine={winningLine}
        disabled={isAIMoving}
      />

      {/* 控制面板 */}
      <Controls 
        onUndo={undoMove}
        onRestart={restartGame}
        onModeChange={setGameMode}
        currentMode={mode}
        canUndo={gameState.moves.length > 0 && gameState.status === 'playing' && !isAIMoving}
      />
    </div>
  );
}
