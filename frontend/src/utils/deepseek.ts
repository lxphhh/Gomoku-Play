import { Position, BoardData } from '../types';

// DeepSeek API 配置
const DEEPSEEK_API_URL = import.meta.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
const DEEPSEEK_MODEL = (import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat').trim();
const DEEPSEEK_TIMEOUT = parseInt(import.meta.env.VITE_DEEPSEEK_TIMEOUT || '30000', 10);

// 难度级别定义
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'master';

export interface DifficultyConfig {
  level: DifficultyLevel;
  name: string;
  description: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    level: 'easy',
    name: '入门',
    description: '适合初学者，AI 会犯错',
    maxTokens: 100,
    temperature: 0.8,
    systemPrompt: `你是一个五子棋初学者水平 AI。

你的特点：
1. 偶尔会犯明显的错误
2. 不会主动做复杂的防守
3. 只会攻击眼前的连子
4. 思考时间短，反应快

请根据当前棋盘给出落子建议。`
  },
  medium: {
    level: 'medium',
    name: '进阶',
    description: '标准对战，会防守和进攻',
    maxTokens: 150,
    temperature: 0.5,
    systemPrompt: `你是一个五子棋进阶水平 AI。

你的特点：
1. 会识别威胁并防守
2. 能进行基本的进攻
3. 会考虑 2-3 步后的局势
4. 攻防平衡

请分析棋盘并给出最佳落子位置。`
  },
  hard: {
    level: 'hard',
    name: '困难',
    description: '高水平，需要认真对待',
    maxTokens: 200,
    temperature: 0.3,
    systemPrompt: `你是一个五子棋高水平 AI。

你的特点：
1. 能准确识别所有威胁（活四、冲四、活三等）
2. 会进行深度计算（4-5 步）
3. 攻防转换时机把握精准
4. 善于制造陷阱

请给出最优落子位置，并简要说明理由。`
  },
  master: {
    level: 'master',
    name: '大师',
    description: '职业级水平，极难战胜',
    maxTokens: 300,
    temperature: 0.1,
    systemPrompt: `你是一个五子棋职业大师级 AI。

你的特点：
1. 能看穿所有棋型（眠三、跳三、活四、冲四、连五等）
2. 深度计算（6+ 步）
3. 完美的攻防节奏控制
4. 善于开局定式和飞手设计
5. 每一步都追求最优解

请给出最优落子位置，分析：
- 当前棋型分析
- 攻守判断
- 最佳应对
- 后续变化`
  }
};

// 当前难度（默认中等）
let currentDifficulty: DifficultyLevel = 'medium';

// 获取当前难度配置
export const getCurrentDifficulty = (): DifficultyConfig => {
  return DIFFICULTY_CONFIGS[currentDifficulty];
};

// 设置难度
export const setDifficulty = (level: DifficultyLevel): void => {
  if (DIFFICULTY_CONFIGS[level]) {
    currentDifficulty = level;
    console.log('[AI] 难度已切换:', DIFFICULTY_CONFIGS[level].name);
  }
};

// 获取所有难度选项
export const getDifficultyOptions = (): DifficultyConfig[] => {
  return Object.values(DIFFICULTY_CONFIGS);
};

// 备用：随机落子
const getRandomMove = (board: BoardData): Position | null => {
  const size = board.length;
  const emptyCells: Position[] = [];
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === null) {
        emptyCells.push({ row: r, col: c });
      }
    }
  }
  
  if (emptyCells.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  return emptyCells[randomIndex];
};

/**
 * 将棋盘转换为字符串
 */
const boardToString = (board: BoardData): string => {
  const size = board.length;
  let result = '   ';
  
  for (let c = 0; c < size; c++) {
    result += ` ${c + 1} `;
  }
  result += '\n';
  
  for (let r = 0; r < size; r++) {
    result += ` ${(r + 1).toString().padStart(2)} `;
    for (let c = 0; c < size; c++) {
      const cell = board[r][c];
      if (cell === null) result += ' · ';
      else if (cell === 'black') result += ' ● ';
      else if (cell === 'white') result += ' ○ ';
    }
    result += '\n';
  }
  
  return result;
};

/**
 * 构建提示词
 */
const buildPrompt = (board: BoardData, currentPlayer: 'black' | 'white', difficulty: DifficultyConfig): string => {
  const boardStr = boardToString(board);
  const playerEmoji = currentPlayer === 'black' ? '●' : '○';
  
  return `${difficulty.systemPrompt}

当前棋盘状态（●黑 ○白，坐标从0开始）：
${boardStr}

当前执子方：${playerEmoji} (${currentPlayer})

请直接返回 JSON 格式：
{"row": 数字, "col": 数字, "reasoning": "你的简要分析"}

注意：row 和 col 必须在 0-14 范围内。
`;
};

/**
 * 解析 AI 返回的位置
 */
const parseResponse = (content: string, size: number): Position | null => {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (typeof parsed.row === 'number' && typeof parsed.col === 'number') {
      const row = Math.max(0, Math.min(size - 1, Math.floor(parsed.row)));
      const col = Math.max(0, Math.min(size - 1, Math.floor(parsed.col)));
      
      if (row >= 0 && row < size && col >= 0 && col < size) {
        return { row, col };
      }
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * 调用 DeepSeek AI
 */
export const getAIMove = async (
  board: BoardData,
  currentPlayer: 'black' | 'white',
  size: number = 15
): Promise<Position | null> => {
  if (!DEEPSEEK_API_KEY) {
    console.warn('[AI] API Key 未配置，使用随机落子');
    return getRandomMove(board);
  }

  const difficulty = getCurrentDifficulty();
  
  try {
    const prompt = buildPrompt(board, currentPlayer, difficulty);
    
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
          { role: 'user', content: prompt },
        ],
        max_tokens: difficulty.maxTokens,
        temperature: difficulty.temperature,
      }),
      signal: AbortSignal.timeout(DEEPSEEK_TIMEOUT),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI] API 错误:', response.status, errorText);
      return getRandomMove(board);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log(`[AI] ${difficulty.name} 响应:`, content);
    
    if (!content) {
      return getRandomMove(board);
    }

    const position = parseResponse(content, size);
    
    if (position) {
      console.log(`[AI] ${difficulty.name} 建议:`, position);
      return position;
    }
    
    return getRandomMove(board);
    
  } catch (error) {
    console.error('[AI] 请求异常:', error);
    return getRandomMove(board);
  }
};
