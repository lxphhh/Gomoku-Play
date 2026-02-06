import { Position, BoardData } from '../types';

// API 配置
type AIProvider = 'deepseek' | 'minimax';

let currentProvider: AIProvider = 'minimax';
let currentDifficulty: DifficultyLevel = 'medium';

export type { AIProvider };

// DeepSeek 配置
const DEEPSEEK_API_URL = import.meta.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
const DEEPSEEK_MODEL = (import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat').trim();

// MiniMax 配置
const MINIMAX_API_URL = import.meta.env.VITE_MINIMAX_API_URL || 'https://api.minimax.chat/v1/text/chatcompletion_v2';
const MINIMAX_API_KEY = import.meta.env.VITE_MINIMAX_API_KEY || '';
const MINIMAX_MODEL = import.meta.env.VITE_MINIMAX_MODEL || 'minimax-m2.1';

const TIMEOUT = parseInt(import.meta.env.VITE_AI_TIMEOUT || '30000', 10);

// 难度级别
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'master';

export interface DifficultyConfig {
  level: DifficultyLevel;
  name: string;
  description: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
}

// 五子棋规则
const RULES = `
【五子棋规则】
- 黑棋先行，白棋后行
- 只能在空白交叉点落子
- 横/竖/斜任意方向连成5子即获胜
`;

// 策略
const STRATEGY = `
【攻守策略】

进攻优先级：
1. 连五 → 直接获胜
2. 活四 → 必胜
3. 冲四 → 叫杀
4. 活三 → 扩张

防守优先级：
1. 对方活四 → 必须挡住！
2. 对方冲四 → 优先挡住
`;

// 系统提示词
const SYSTEM_PROMPTS: Record<DifficultyLevel, string> = {
  easy: `${RULES}
你是五子棋新手，只会看眼前1步。`,
  
  medium: `${RULES}${STRATEGY}
你是五子棋中等水平。`,
  
  hard: `${RULES}${STRATEGY}
你是五子棋高手，深度计算4-5步。`,
  
  master: `${RULES}${STRATEGY}
你是五子棋职业大师，深度计算6+步。`
};

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: { level: 'easy', name: '入门', description: '初学者', maxTokens: 80, temperature: 0.9, systemPrompt: SYSTEM_PROMPTS.easy },
  medium: { level: 'medium', name: '进阶', description: '中等', maxTokens: 120, temperature: 0.6, systemPrompt: SYSTEM_PROMPTS.medium },
  hard: { level: 'hard', name: '困难', description: '高手', maxTokens: 180, temperature: 0.3, systemPrompt: SYSTEM_PROMPTS.hard },
  master: { level: 'master', name: '大师', description: '职业', maxTokens: 250, temperature: 0.1, systemPrompt: SYSTEM_PROMPTS.master }
};

export const getCurrentDifficulty = () => DIFFICULTY_CONFIGS[currentDifficulty];
export const setDifficulty = (level: DifficultyLevel) => { currentDifficulty = level; };
export const getDifficultyOptions = (): DifficultyConfig[] => Object.values(DIFFICULTY_CONFIGS);

export const getCurrentProvider = (): AIProvider => currentProvider;
export const setProvider = (provider: AIProvider) => { currentProvider = provider; };
export const getProviderOptions = (): { value: AIProvider; label: string }[] => [
  { value: 'minimax', label: 'MiniMax M2.1' },
  { value: 'deepseek', label: 'DeepSeek' }
];

// 工具函数
const isValid = (board: BoardData, pos: Position): boolean => {
  const size = board.length;
  return pos.row >= 0 && pos.row < size && pos.col >= 0 && pos.col < size && board[pos.row][pos.col] === null;
};

const getEmpty = (board: BoardData): Position[] => {
  const size = board.length, empty: Position[] = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (board[r][c] === null) empty.push({ row: r, col: c });
  return empty;
};

const randomMove = (board: BoardData): Position | null => {
  const empty = getEmpty(board);
  return empty.length > 0 ? empty[Math.floor(Math.random() * empty.length)] : null;
};

const boardToString = (board: BoardData): string => {
  const size = board.length;
  let result = '   1 2 3 4 5 6 7 8 9 0 1 2 3 4 5\n';
  for (let r = 0; r < size; r++) {
    result += ` ${(r + 1).toString().padStart(2)} `;
    for (let c = 0; c < size; c++) {
      const cell = board[r][c];
      result += cell === null ? '·' : (cell === 'black' ? '●' : '○');
    }
    result += '\n';
  }
  return result;
};

// 解析响应
const parseResponse = (content: string, board: BoardData): Position | null => {
  try {
    console.log('[AI] 响应:', content);
    
    const formats = [
      /\{"row"\s*:\s*(\d+)\s*,\s*"col"\s*:\s*(\d+)\}/,
      /\[\s*(\d+)\s*,\s*(\d+)\s*\]/,
      /"position"\s*:\s*\{\s*"row"\s*:\s*(\d+)\s*,\s*"col"\s*:\s*(\d+)\s*\}/,
    ];

    for (const fmt of formats) {
      const match = content.match(fmt);
      if (match) {
        const pos = { row: parseInt(match[1], 10), col: parseInt(match[2], 10) };
        if (isValid(board, pos)) {
          console.log('[AI] 解析:', pos);
          return pos;
        }
      }
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      let pos: Position | undefined;
      
      if (typeof parsed.row === 'number' && typeof parsed.col === 'number') {
        pos = { row: parsed.row, col: parsed.col };
      } else if (parsed.position && typeof parsed.position === 'object') {
        const p = parsed.position as Record<string, number>;
        if (typeof p.row === 'number' && typeof p.col === 'number') pos = { row: p.row, col: p.col };
      }
      
      if (pos && isValid(board, pos)) {
        console.log('[AI] JSON解析:', pos);
        return pos;
      }
    }
    
    console.warn('[AI] 解析失败，随机落子');
    return randomMove(board);
    
  } catch {
    console.warn('[AI] 异常');
    return randomMove(board);
  }
};

// DeepSeek API
const callDeepSeek = async (prompt: string, maxTokens: number, temp: number): Promise<string | null> => {
  if (!DEEPSEEK_API_KEY) return null;

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: temp,
      }),
      signal: AbortSignal.timeout(TIMEOUT),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
    
  } catch {
    return null;
  }
};

// MiniMax API
const callMiniMax = async (prompt: string, maxTokens: number, temp: number): Promise<string | null> => {
  if (!MINIMAX_API_KEY) return null;

  try {
    const response = await fetch(MINIMAX_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MINIMAX_MODEL,
        messages: [{ role: 'user', content: prompt }],
        tokens_to_generate: maxTokens,
        temperature: temp,
      }),
      signal: AbortSignal.timeout(TIMEOUT),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.choices?.[0]?.message?.content || data.choices?.[0]?.content || null;
    
  } catch {
    return null;
  }
};

// 主函数
export const getAIMove = async (
  board: BoardData,
  currentPlayer: 'black' | 'white'
): Promise<Position | null> => {
  const difficulty = getCurrentDifficulty();
  const boardStr = boardToString(board);
  const playerEmoji = currentPlayer === 'black' ? '●' : '○';

  const userPrompt = `当前棋盘：
${boardStr}

轮到${playerEmoji}落子。

直接返回 JSON：
{"row": 数字, "col": 数字}`;

  try {
    console.log(`[AI] ${difficulty.name} 思考中 (${currentProvider})...`);
    
    let content: string | null = null;

    if (currentProvider === 'deepseek') {
      content = await callDeepSeek(difficulty.systemPrompt + '\n\n' + userPrompt, difficulty.maxTokens, difficulty.temperature);
    } else {
      content = await callMiniMax(difficulty.systemPrompt + '\n\n' + userPrompt, difficulty.maxTokens, difficulty.temperature);
    }
    
    if (!content) return randomMove(board);
    return parseResponse(content, board);
    
  } catch {
    console.error('[AI] 请求异常');
    return randomMove(board);
  }
};
