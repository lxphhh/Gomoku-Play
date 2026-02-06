import { Position, BoardData } from '../types';

// DeepSeek API 配置
const DEEPSEEK_API_URL = import.meta.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
const DEEPSEEK_MODEL = (import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat').trim();
const DEEPSEEK_TIMEOUT = parseInt(import.meta.env.VITE_DEEPSEEK_TIMEOUT || '30000', 10);

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

// 简化的系统提示词
const SYSTEM_PROMPTS: Record<DifficultyLevel, string> = {
  easy: `你是五子棋新手。

规则：
- 黑先白后
- 只能下在空白位置
- 连成5子获胜

请简单分析棋盘，给出落子位置。`,
  
  medium: `你是五子棋中等水平玩家。

规则：
- 黑先白后
- 只能下在空白位置
- 连成5子获胜

分析：
- 看看双方有没有连成4子的
- 有没有可以形成连4的机会
- 给出最佳位置。`,
  
  hard: `你是五子棋高手。

规则：
- 黑先白后
- 只能下在空白位置
- 连成5子获胜

分析步骤：
1. 检查自己是否能连5（最高优先级）
2. 检查对手是否能连5（必须挡住）
3. 检查是否能连4或活3
4. 给出最佳落子位置。`,
  
  master: `你是五子棋职业选手。

规则：
- 黑先白后
- 只能下在空白位置
- 连成5子获胜

严格分析：
1. 连5 → 直接获胜
2. 对手活4 → 必须挡住
3. 对手冲4 → 优先挡住
4. 自己活4/冲4
5. 对手活3 → 反三或挡
6. 自己活3/跳3
7. 位置价值（中心、连接）
`
};

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: { level: 'easy', name: '入门', description: '初学者水平', maxTokens: 80, temperature: 0.9, systemPrompt: SYSTEM_PROMPTS.easy },
  medium: { level: 'medium', name: '进阶', description: '中等水平', maxTokens: 120, temperature: 0.6, systemPrompt: SYSTEM_PROMPTS.medium },
  hard: { level: 'hard', name: '困难', description: '高水平', maxTokens: 180, temperature: 0.3, systemPrompt: SYSTEM_PROMPTS.hard },
  master: { level: 'master', name: '大师', description: '职业级', maxTokens: 250, temperature: 0.1, systemPrompt: SYSTEM_PROMPTS.master }
};

let currentDifficulty: DifficultyLevel = 'medium';
export const getCurrentDifficulty = () => DIFFICULTY_CONFIGS[currentDifficulty];
export const setDifficulty = (level: DifficultyLevel) => { if (DIFFICULTY_CONFIGS[level]) currentDifficulty = level; };
export const getDifficultyOptions = (): DifficultyConfig[] => Object.values(DIFFICULTY_CONFIGS);

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

interface AIResponse {
  row?: number;
  col?: number;
  position?: { row: number; col: number };
  move?: { row: number; col: number };
}

const parseAIResponse = (content: string, board: BoardData): Position | null => {
  try {
    console.log('[AI] 原始响应:', content);
    
    // 多种 JSON 格式尝试
    const patterns: RegExp[] = [
      // {"row": 7, "col": 8}
      /\{"row":\s*(\d+),\s*"col":\s*(\d+)\}/,
      // [7, 8] 数组格式
      /\[\s*(\d+)\s*,\s*(\d+)\s*\]/,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        const row = parseInt(match[1], 10);
        const col = parseInt(match[2], 10);
        const pos = { row, col };
        
        if (isValid(board, pos)) {
          console.log('[AI] 解析成功:', pos);
          return pos;
        }
      }
    }

    // 尝试提取任意 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as AIResponse;
      let pos: Position | undefined;
      
      if (parsed.row !== undefined && parsed.col !== undefined) pos = { row: parsed.row, col: parsed.col };
      else if (parsed.position) pos = parsed.position;
      else if (parsed.move) pos = parsed.move;
      
      if (pos && isValid(board, pos)) {
        console.log('[AI] JSON解析成功:', pos);
        return pos;
      }
    }
    
    console.warn('[AI] 无法解析响应，使用随机落子');
    return randomMove(board);
    
  } catch (error) {
    console.warn('[AI] 解析异常:', error);
    return randomMove(board);
  }
};

export const getAIMove = async (
  board: BoardData,
  currentPlayer: 'black' | 'white'
): Promise<Position | null> => {
  if (!DEEPSEEK_API_KEY) return randomMove(board);

  const difficulty = getCurrentDifficulty();
  const boardStr = boardToString(board);
  const playerEmoji = currentPlayer === 'black' ? '●' : '○';

  // 简化用户提示
  const userPrompt = `当前棋盘：
${boardStr}

轮到你下（${playerEmoji}），请选择最佳位置。

直接返回 JSON，格式：
{"row": 数字, "col": 数字}

必须是空白位置（·）！`;

  try {
    console.log(`[AI] ${difficulty.name} 难度思考中...`);
    
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: difficulty.systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: difficulty.maxTokens,
        temperature: difficulty.temperature,
      }),
      signal: AbortSignal.timeout(DEEPSEEK_TIMEOUT),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI] API 错误:', response.status, errorText);
      return randomMove(board);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    if (!content) return randomMove(board);

    return parseAIResponse(content, board);
    
  } catch (error) {
    console.error('[AI] 请求异常:', error);
    return randomMove(board);
  }
};
