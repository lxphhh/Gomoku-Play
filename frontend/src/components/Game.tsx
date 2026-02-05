import { useState, useCallback, useEffect, useRef } from 'react';
import Board from './Board';
import Controls from './Controls';
import { 
  GameState, 
  Position, 
  Player, 
  GameMode,
  BoardData,
} from '../types';
import { 
  createEmptyBoard,
  checkWin,
  checkDraw,
  getNextPlayer,
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
  const isAiThinking = useRef(false);

  // AI 落子 (简单随机)
  const makeAIMove = useCallback((board: BoardData): Position | null => {
    const emptyCells: Position[] = [];
    board.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (!cell) emptyCells.push({ row: r, col: c });
      });
    });

    if (emptyCells.length > 0) {
      const randomIndex = Math.floor(Math.random() * emptyCells.length);
      return emptyCells[randomIndex];
    }
    return null;
  }, []);

  // 落子处理
  const handleCellClick = useCallback((position: Position) => {
    if (gameState.status !== 'playing' || isAiThinking.current) return;
    if (gameState.board[position.row][position.col] !== null) return;

    const newBoard = createEmptyBoard(15);
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        newBoard[r][c] = gameState.board[r][c];
      }
    }

    newBoard[position.row][position.col] = gameState.currentPlayer;

    let newStatus: typeof gameState.status = 'playing';
    let newWinner: Player | null = null;

    if (win) {
      newStatus = `${gameState.currentPlayer}_win`;
      newWinner = gameState.currentPlayer;
      setWinningLine(line);
    } else if (draw) {
      newStatus = 'draw';
    }

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: getNextPlayer(prev.currentPlayer),
      status: newStatus,
      moves: newMoves,
      winner: newWinner,
      updatedAt: Date.now(),
    }));

    // AI 回合
    if (mode === 'pva' && !win && !draw && gameState.currentPlayer === 'black') {
      isAiThinking.current = true;
      setTimeout(() => {
        const aiMove = makeAIMove(newBoard);
        if (aiMove) {
          handleCellClick(aiMove);
        }
        isAiThinking.current = false;
      }, 500);
    }
  }, [gameState, mode, makeAIMove]);

  // 悔棋
  const handleUndo = useCallback(() => {
    if (gameState.moves.length === 0 || gameState.status !== 'playing') return;
    if (isAiThinking.current) return;

    const newBoard = createEmptyBoard(15);
    const moves = gameState.moves.slice(0, -1);
    moves.forEach((move) => {
      newBoard[move.position.row][move.position.col] = move.player;
    });

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: moves.length > 0 
        ? (moves[moves.length - 1].player === 'black' ? 'white' : 'black')
        : 'black',
      moves,
      winner: null,
      updatedAt: Date.now(),
    }));
    setWinningLine([]);
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
    isAiThinking.current = false;
  }, [mode]);

  // 模式切换时重置
  useEffect(() => {
    handleRestart();
  }, [mode, handleRestart]);

  const getStatusMessage = (): string => {
    if (gameState.status === 'black_win') return '🎉 黑方获胜!';
    if (gameState.status === 'white_win') return '🎉 白方获胜!';
    if (gameState.status === 'draw') return '🤝 平局!';
    return `${gameState.currentPlayer === 'black' ? '⚫' : '⚪'} ${gameState.currentPlayer === 'black' ? '黑方' : '白方'} 回合`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className={`
        text-center py-4 mb-4 rounded-lg font-bold text-lg
        ${gameState.status.includes('win') ? 'bg-green-100 text-green-800' : ''}
        ${gameState.status === 'draw' ? 'bg-yellow-100 text-yellow-800' : ''}
        ${gameState.status === 'playing' ? 'bg-blue-100 text-blue-800' : ''}
      `}>
        {getStatusMessage()}
      </div>

      <Board 
        board={gameState.board}
        onCellClick={handleCellClick}
        lastMove={gameState.moves[gameState.moves.length - 1]?.position}
        winningLine={winningLine}
      />

      <Controls 
        onUndo={handleUndo}
        onRestart={handleRestart}
        onModeChange={onModeChange}
        currentMode={mode}
        canUndo={gameState.moves.length > 0 && gameState.status === 'playing' && !isAiThinking.current}
      />
    </div>
  );
}
