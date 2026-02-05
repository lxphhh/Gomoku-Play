import { useState, useCallback, useEffect } from 'react';
import {
  GameState,
  GameConfig,
  Position,
  Move,
  Player,
  GameStatus,
} from '../types';
import {
  createEmptyBoard,
  checkWin,
  checkDraw,
  copyBoard,
  getNextPlayer,
  defaultGameConfig,
} from '../utils/gameLogic';

interface UseGameReturn {
  gameState: GameState;
  config: GameConfig;
  makeMove: (position: Position) => boolean;
  undoMove: () => boolean;
  restartGame: () => void;
  setGameMode: (mode: 'pvp' | 'pva') => void;
  winningLine: Position[];
  error: string | null;
  clearError: () => void;
}

export const useGame = (initialConfig?: Partial<GameConfig>): UseGameReturn => {
  const [config, setConfig] = useState<GameConfig>({
    ...defaultGameConfig,
    ...initialConfig,
  });

  const [gameState, setGameState] = useState<GameState>(() => {
    const size = config.boardSize;
    return {
      id: crypto.randomUUID(),
      board: createEmptyBoard(size),
      currentPlayer: 'black',
      status: 'playing',
      moves: [],
      winner: null,
      mode: config.mode,
      isAIFirst: config.mode === 'pva' ? true : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  });

  const [winningLine, setWinningLine] = useState<Position[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 检查游戏是否结束
  const checkGameEnd = useCallback(
    (board: BoardData, lastMove: Position, player: Player): GameStatus => {
      const { win, winningLine: line } = checkWin(
        board,
        lastMove,
        player,
        config.winCondition
      );
      
      if (win) {
        setWinningLine(line);
        return `${player}_win` as GameStatus;
      }
      
      if (checkDraw(board)) {
        return 'draw';
      }
      
      return 'playing';
    },
    [config.winCondition]
  );

  // 落子
  const makeMove = useCallback(
    (position: Position): boolean => {
      // 验证游戏状态
      if (gameState.status !== 'playing') {
        setError('游戏已结束，无法继续落子');
        return false;
      }

      // 验证位置
      if (
        position.row < 0 ||
        position.row >= config.boardSize ||
        position.col < 0 ||
        position.col >= config.boardSize
      ) {
        setError('位置无效');
        return false;
      }

      // 验证该位置是否已有棋子
      if (gameState.board[position.row][position.col] !== null) {
        setError('该位置已有棋子');
        return false;
      }

      // 执行落子
      const newBoard = copyBoard(gameState.board);
      const player = gameState.currentPlayer;
      newBoard[position.row][position.col] = player;

      const newMove: Move = {
        position,
        player,
        timestamp: Date.now(),
      };

      const newMoves = [...gameState.moves, newMove];
      const newStatus = checkGameEnd(newBoard, position, player);
      const winner = newStatus.includes('_win')
        ? player
        : newStatus === 'draw'
        ? null
        : null;

      setGameState((prev) => ({
        ...prev,
        board: newBoard,
        currentPlayer: getNextPlayer(player),
        status: newStatus,
        moves: newMoves,
        winner,
        updatedAt: Date.now(),
      }));

      // 如果游戏继续且是 PvA 模式，安排 AI 落子
      if (
        newStatus === 'playing' &&
        config.mode === 'pva' &&
        player !== config.isAIFirst
      ) {
        // AI 落子会在 useEffect 中处理
      }

      return true;
    },
    [gameState, config, checkGameEnd]
  );

  // 悔棋
  const undoMove = useCallback((): boolean => {
    if (gameState.moves.length === 0) {
      setError('没有可悔的棋步');
      return false;
    }

    if (gameState.status !== 'playing') {
      setError('游戏已结束，无法悔棋');
      return false;
    }

    const newMoves = gameState.moves.slice(0, -1);
    const lastMove = newMoves[newMoves.length - 1];
    const newBoard = createEmptyBoard(config.boardSize);

    // 重新构建棋盘
    newMoves.forEach((move) => {
      newBoard[move.position.row][move.position.col] = move.player;
    });

    setWinningLine([]);
    setGameState((prev) => ({
      ...prev,
      board: newBoard,
      currentPlayer: lastMove ? getNextPlayer(lastMove.player) : 'black',
      moves: newMoves,
      updatedAt: Date.now(),
    }));

    return true;
  }, [gameState.moves, gameState.status, config.boardSize]);

  // 重新开始
  const restartGame = useCallback(() => {
    setGameState({
      id: crypto.randomUUID(),
      board: createEmptyBoard(config.boardSize),
      currentPlayer: 'black',
      status: 'playing',
      moves: [],
      winner: null,
      mode: config.mode,
      isAIFirst: config.mode === 'pva' ? true : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setWinningLine([]);
    setError(null);
  }, [config.boardSize, config.mode]);

  // 设置游戏模式
  const setGameMode = useCallback((mode: 'pvp' | 'pva') => {
    setConfig((prev) => ({ ...prev, mode }));
    setGameState((prev) => ({
      ...prev,
      mode,
      isAIFirst: mode === 'pva' ? true : undefined,
    }));
    restartGame();
  }, [restartGame]);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    gameState,
    config,
    makeMove,
    undoMove,
    restartGame,
    setGameMode,
    winningLine,
    error,
    clearError,
  };
};
