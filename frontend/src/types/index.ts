// 棋子类型
export type StoneColor = 'black' | 'white' | null;

// 玩家类型
export type Player = 'black' | 'white';

// 游戏模式
export type GameMode = 'pvp' | 'pva';

// 游戏状态
export type GameStatus = 'playing' | 'black_win' | 'white_win' | 'draw' | 'waiting';

// 落子位置
export interface Position {
  row: number;
  col: number;
}

// 移动记录
export interface Move {
  position: Position;
  player: Player;
  timestamp: number;
}

// 棋盘数据 (二维数组)
export type BoardData = StoneColor[][];

// 游戏状态
export interface GameState {
  id: string;
  board: BoardData;
  currentPlayer: Player;
  status: GameStatus;
  moves: Move[];
  winner: Player | null;
  mode: GameMode;
  isAIFirst?: boolean;
  createdAt: number;
  updatedAt: number;
}

// 游戏配置
export interface GameConfig {
  boardSize: number; // 默认 15x15
  winCondition: number; // 连子数量，默认 5
  mode: GameMode;
  AIEnabled: boolean;
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// WebSocket 消息类型
export interface WSMessage {
  type: string;
  payload: Record<string, unknown>;
}

// 游戏操作类型
export type GameAction = 
  | { type: 'MAKE_MOVE'; payload: Position }
  | { type: 'UNDO_MOVE' }
  | { type: 'RESTART_GAME' }
  | { type: 'SET_MODE'; payload: GameMode }
  | { type: 'SET_CONFIG'; payload: Partial<GameConfig> }
  | { type: 'UPDATE_GAME_STATE'; payload: GameState }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };
