export interface BoardData {
  [row: number]: {
    [col: number]: string | null;
  };
}

export interface Position {
  row: number;
  col: number;
}

export interface GameStatus {
  status: 'playing' | 'black_win' | 'white_win' | 'draw' | 'waiting';
}

export interface Player {
  player: 'black' | 'white';
}

export interface GameConfig {
  boardSize: number;
  winCondition: number;
  mode: 'pvp' | 'pva';
  AIEnabled: boolean;
}
