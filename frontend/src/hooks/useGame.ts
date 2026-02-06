import { useState, useCallback, useEffect, useRef } from 'react';
import {
  GameState,
  GameConfig,
  Position,
  Player,
  GameStatus,
  Move,
  BoardData,
} from '../types';
import {
  createEmptyBoard,
  checkWin,
  checkDraw,
  getNextPlayer,
  defaultGameConfig,
} from '../utils/gameLogic';
import { getAIMove } from '../utils/deepseek';

interface UseGameReturn {
  gameState: GameState;
  config: GameConfig;
  makeMove: (position: Position) => Promise<boolean>;
  undoMove: () => boolean;
  restartGame: () => void;
  setGameMode: (mode: 'pvp' | 'pva') => void;
  winningLine: Position[];
  error: string | null;
  clearError: () => void;
  isAIMoving: boolean;
}

export const useGame = (initialConfig?: Partial<GameConfig>): UseGameReturn => {
  const [config, setConfig] = useState<GameConfig>({
    ...defaultGameConfig,
    ...initialConfig,
  });

  const [gameState, setGameState] = useState<GameState>(() => {
    const size = config.boardSize;
    return {
      id: Date.now().toString(),
      board: createEmptyBoard(size),
      currentPlayer: 'black',
      status: 'playing',
      moves: [],
      winner: null,
      mode: config.mode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  });

  const [winningLine, setWinningLine] = useState<Position[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAIMoving, setIsAIMoving] = useState(false);
  const aiMovePending = useRef<boolean>(false);

  // 检查游戏是否结束
  const checkGameEnd = useCallback(
    (board: BoardData, lastMove: Position, player: Player): { status: GameStatus; winningLine: Position[] } => {
      const { win, winningLine: line } = checkWin(board, lastMove, player, config.winCondition);
      
      if (win) {
        return { status: `${player}_win` as GameStatus, winningLine: line };
      }
      
      if (checkDraw(board)) {
        return { status: 'draw' as GameStatus, winningLine: [] };
      }
      
      return { status: 'playing' as GameStatus, winningLine: [] };
    },
    [config.winCondition]
  );

  // 落子函数
  const makeMoveFn = useCallback(
    async (position: Position): Promise<boolean> => {
      // 验证游戏状态
      if (gameState.status !== 'playing') {
        setError('游戏已结束，无法继续落子');
        return false;
      }

      // 如果是 AI 正在思考中，跳过
      if (isAIMoving && gameState.currentPlayer === 'white') {
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
      const newBoard = createEmptyBoard(config.boardSize);
      for (let r = 0; r < config.boardSize; r++) {
        for (let c = 0; c < config.boardSize; c++) {
          newBoard[r][c] = gameState.board[r][c];
        }
      }

      const player = gameState.currentPlayer;
      newBoard[position.row][position.col] = player;

      const newMove: Move = {
        position,
        player,
        timestamp: Date.now(),
      };

      const newMoves = [...gameState.moves, newMove];
      const { status: newStatus, winningLine: newWinningLine } = checkGameEnd(
        newBoard,
        position,
        player
      );

      setWinningLine(newWinningLine);
      setGameState((prev) => ({
        ...prev,
        board: newBoard,
        currentPlayer: getNextPlayer(player),
        status: newStatus,
        moves: newMoves,
        winner: newStatus.includes('_win') ? player : newStatus === 'draw' ? null : null,
        updatedAt: Date.now(),
      }));

      return true;
    },
    [gameState, config, checkGameEnd, isAIMoving]
  );

  // AI 落子
  const handleAIMove = useCallback(async () => {
    if (
      config.mode !== 'pva' ||
      gameState.status !== 'playing' ||
      gameState.currentPlayer !== 'white' ||
      isAIMoving ||
      aiMovePending.current
    ) {
      return;
    }

    aiMovePending.current = true;
    setIsAIMoving(true);

    try {
      console.log('[AI] 开始思考...');
      const aiPosition = await getAIMove(gameState.board, 'white');
      
      if (aiPosition) {
        console.log('[AI] 决定落子:', aiPosition);
        await makeMoveFn(aiPosition);
      } else {
        console.error('[AI] 无法获取落子位置');
        setError('AI 无法决策，请重试');
      }
    } catch (err) {
      console.error('[AI] 落子失败:', err);
      setError('AI 落子失败');
    } finally {
      setIsAIMoving(false);
      aiMovePending.current = false;
    }
  }, [config.mode, gameState, isAIMoving, makeMoveFn, config.boardSize]);

  // 自动 AI 落子
  useEffect(() => {
    // 延迟 300ms 等待玩家落子完成
    const timer = setTimeout(() => {
      handleAIMove();
    }, 300);

    return () => clearTimeout(timer);
  }, [gameState.currentPlayer, gameState.status, handleAIMove]);

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

    if (isAIMoving) {
      setError('AI 正在思考中，无法悔棋');
      return false;
    }

    const newBoard = createEmptyBoard(config.boardSize);
    const moves = gameState.moves.slice(0, -1);
    moves.forEach((move) => {
      newBoard[move.position.row][move.position.col] = move.player;
    });

    setWinningLine([]);
    setGameState((prev) => ({
      ...prev,
      board: newBoard,
      currentPlayer: moves.length > 0 
        ? (moves[moves.length - 1].player === 'black' ? 'white' : 'black')
        : 'black',
      moves,
      winner: null,
      updatedAt: Date.now(),
    }));

    return true;
  }, [gameState.moves, gameState.status, config.boardSize, isAIMoving]);

  // 重新开始
  const restartGame = useCallback(() => {
    setGameState({
      id: Date.now().toString(),
      board: createEmptyBoard(config.boardSize),
      currentPlayer: 'black',
      status: 'playing',
      moves: [],
      winner: null,
      mode: config.mode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setWinningLine([]);
    setError(null);
    setIsAIMoving(false);
    aiMovePending.current = false;
  }, [config.boardSize, config.mode]);

  // 设置游戏模式
  const setGameMode = useCallback((mode: 'pvp' | 'pva') => {
    setConfig((prev) => ({ ...prev, mode }));
    setGameState((prev) => ({
      ...prev,
      mode,
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
    makeMove: makeMoveFn,
    undoMove,
    restartGame,
    setGameMode,
    winningLine,
    error,
    clearError,
    isAIMoving,
  };
};
