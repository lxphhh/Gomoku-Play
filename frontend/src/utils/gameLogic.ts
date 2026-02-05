import { BoardData, Position, GameStatus, Player, GameConfig } from '../types';

// 创建空棋盘
export const createEmptyBoard = (size: number): BoardData => {
  return Array(size).fill(null).map(() => Array(size).fill(null));
};

// 检查是否在棋盘范围内
export const isValidPosition = (pos: Position, boardSize: number): boolean => {
  return pos.row >= 0 && pos.row < boardSize && pos.col >= 0 && pos.col < boardSize;
};

// 检查位置是否为空
export const isEmptyCell = (board: BoardData, pos: Position): boolean => {
  return board[pos.row][pos.col] === null;
};

// 检查是否获胜
export const checkWin = (
  board: BoardData, 
  lastMove: Position, 
  player: Player, 
  winCondition: number = 5
): { win: boolean; winningLine: Position[] } => {
  const size = board.length;
  const directions = [
    { dr: 0, dc: 1 },   // 水平
    { dr: 1, dc: 0 },   // 垂直
    { dr: 1, dc: 1 },   // 对角线
    { dr: 1, dc: -1 },  // 反对角线
  ];

  for (const { dr, dc } of directions) {
    let count = 1;
    const winningLine: Position[] = [lastMove];

    // 正方向检查
    for (let i = 1; i < winCondition; i++) {
      const r = lastMove.row + dr * i;
      const c = lastMove.col + dc * i;
      if (!isValidPosition({ row: r, col: c }, size) || board[r][c] !== player) {
        break;
      }
      count++;
      winningLine.push({ row: r, col: c });
    }

    // 反方向检查
    for (let i = 1; i < winCondition; i++) {
      const r = lastMove.row - dr * i;
      const c = lastMove.col - dc * i;
      if (!isValidPosition({ row: r, col: c }, size) || board[r][c] !== player) {
        break;
      }
      count++;
      winningLine.unshift({ row: r, col: c });
    }

    if (count >= winCondition) {
      return { win: true, winningLine };
    }
  }

  return { win: false, winningLine: [] };
};

// 检查是否平局（棋盘已满）
export const checkDraw = (board: BoardData): boolean => {
  return board.every(row => row.every(cell => cell !== null));
};

// 复制棋盘
export const copyBoard = (board: BoardData): BoardData => {
  return board.map(row => [...row]);
};

// 获取当前玩家
export const getNextPlayer = (currentPlayer: Player): Player => {
  return currentPlayer === 'black' ? 'white' : 'black';
};

// 格式化游戏状态
export const formatGameStatus = (status: GameStatus): string => {
  const statusMap: Record<GameStatus, string> = {
    playing: '游戏中',
    black_win: '黑方获胜!',
    white_win: '白方获胜!',
    draw: '平局!',
    waiting: '等待中',
  };
  return statusMap[status];
};

// 初始化游戏配置
export const defaultGameConfig: GameConfig = {
  boardSize: 15,
  winCondition: 5,
  mode: 'pva',
  AIEnabled: true,
};
