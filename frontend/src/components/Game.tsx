import { useState, useCallback, useEffect } from 'react';
import Board from './Board';
import Controls from './Controls';
import { 
  GameState, 
  Position, 
  Player, 
  GameMode,
} from '../types';
import { 
  createEmptyBoard,
  checkWin,
  checkDraw,
  copyBoard
} from '../utils/gameLogic';

interface GameProps {
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
}

export default function Game({ mode, onModeChange }: GameProps) {
  const [gameState, setGameState] = useState<GameState>(() => ({
    id: Date.now().toString(),
    board: createEmptyBoard(15),
    currentPlayer: 'black',
    status: 'playing',
    moves: [],
    winner: null,
    mode,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));

  const [winningLine, setWinningLine] = useState<Position[]>([]);

  // AI 落子 (简单随机)
  const makeAIMove = useCallback((currentBoard: any[][], _blackPlayer: Player) => {
    const emptyCells: Position[] = [];
    currentBoard.forEach((row, r) => {
      row.forEach((cell: any, c) => {
        if (!cell) emptyCells.push({ row: r, col: c });
      });
    });

    if (emptyCells.length > 0) {
      // 简单 AI：随机选择一个空位
      const randomIndex = Math.floor(Math.random() * emptyCells.length);
      return emptyCells[randomIndex];
    }
    return null;
  }, []);

  // 落子处理
  const handleCellClick = useCallback((position: Position) => {
    if (gameState.status !== 'playing') return;
    
    const newBoard = copyBoard(gameState.board);
    if (newBoard[position.row][position.col] !== null) return;

    // 更新棋盘
    newBoard[position.row][position.col] = gameState.currentPlayer;

    // 检查获胜
    const { win, winningLine: line } = checkWin(newBoard, position, gameState.currentPlayer);
    const draw = checkDraw(newBoard);

    // 更新状态
    setGameState((prev: GameState) => ({
      ...prev,
      board: newBoard,
      currentPlayer: prev.currentPlayer === 'black' ? 'white' : 'black',
      status: win 
        ? `${prev.currentPlayer}_win` as const
        : draw 
          ? 'draw' as const
          : 'playing' as const,
      moves: [...prev.moves, { 
        position, 
        player: prev.currentPlayer, 
        timestamp: Date.now() 
      }],
      winner: win ? prev.currentPlayer : null,
      updatedAt: Date.now(),
    }));

    if (win) {
      setWinningLine(line);
    }

    // AI 回合
    if (mode === 'pva' && gameState.status === 'playing' && !win) {
      setTimeout(() => {
        const aiMove = makeAIMove(newBoard, 'black');
        if (aiMove) {
          handleCellClick(aiMove);
        }
      }, 500);
    }
  }, [gameState, mode, makeAIMove]);

  // 悔棋
  const handleUndo = useCallback(() => {
    if (gameState.moves.length === 0 || gameState.status !== 'playing') return;

    const lastMove = gameState.moves[gameState.moves.length - 1];
    const newBoard = copyBoard(gameState.board);
    newBoard[lastMove.position.row][lastMove.position.col] = null;

    setGameState((prev: GameState) => ({
      ...prev,
      board: newBoard,
      currentPlayer: prev.currentPlayer === 'black' ? 'white' : 'black',
      moves: prev.moves.slice(0, -1),
      updatedAt: Date.now(),
    }));
  }, [gameState]);

  // 重新开始
  const handleRestart = useCallback(() => {
    setGameState({
      id: Date.now().toString(),
      board: createEmptyBoard(15),
      currentPlayer: 'black',
      status: 'playing',
      moves: [],
      winner: null,
      mode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setWinningLine([]);
  }, [mode]);

  // 模式切换时重置
  useEffect(() => {
    handleRestart();
  }, [mode, handleRestart]);

  // 获取状态消息
  const getStatusMessage = (): string => {
    if (gameState.status === 'black_win') return '🎉 黑方获胜!';
    if (gameState.status === 'white_win') return '🎉 白方获胜!';
    if (gameState.status === 'draw') return '🤝 平局!';
    return `${gameState.currentPlayer === 'black' ? '⚫' : '⚪'} ${gameState.currentPlayer === 'black' ? '黑方' : '白方'} 回合`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* 状态显示 */}
      <div className={`
        text-center py-4 mb-4 rounded-lg font-bold text-lg
        ${gameState.status.includes('win') ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
        ${gameState.status === 'draw' ? 'bg-yellow-100 text-yellow-800' : ''}
      `}>
        {getStatusMessage()}
      </div>

      {/* 棋盘 */}
      <Board 
        board={gameState.board}
        onCellClick={handleCellClick}
        lastMove={gameState.moves[gameState.moves.length - 1]?.position}
        winningLine={winningLine}
      />

      {/* 控制面板 */}
      <Controls 
        onUndo={handleUndo}
        onRestart={handleRestart}
        onModeChange={onModeChange}
        currentMode={mode}
        canUndo={gameState.moves.length > 0 && gameState.status === 'playing'}
      />
    </div>
  );
}
