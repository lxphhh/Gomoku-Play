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

// 五子棋规则提示词（所有难度通用）
const RULES_PROMPT = `
## 五子棋规则
1. 黑棋先手，白棋后手
2. 双方轮流落子
3. **重要：不能下在已有棋子的位置！必须选择空白位置！**
4. 横、竖、斜任意方向连成5子获胜
5. 连成5子即获胜，不需要6子

## 重要注意事项
- row 和 col 的取值范围是 0-14
- **必须选择棋盘上为 "·" 的空白位置**
- **绝对不能选择已有 "●" 或 "○" 的位置！**
`;

// 不同难度的系统提示词
const SYSTEM_PROMPTS: Record<DifficultyLevel, string> = {
  easy: `你是一个五子棋初学者水平 AI。

你的特点：
1. 刚开始学习五子棋
2. 只会攻击眼前的连子
3. 防守意识较弱
4. 偶尔会犯明显错误

请严格遵守以下规则：
- 只能选择空白位置（棋盘上显示为 "·" 的位置）
- 不能下在已有棋子的位置！

${RULES_PROMPT}`,
  
  medium: `你是一个五子棋进阶水平 AI。

你的特点：
1. 会识别威胁并防守
2. 能进行基本的进攻
3. 会考虑 2-3 步后的局势
4. 攻防平衡

请严格遵守以下规则：
- 只能选择空白位置（棋盘上显示为 "·" 的位置）
- 不能下在已有棋子的位置！

${RULES_PROMPT}`,
  
  hard: `你是一个五子棋高水平 AI。

你的特点：
1. 能准确识别所有威胁（活四、冲四、活三等）
2. 会进行深度计算（4-5 步）
3. 攻防转换时机把握精准
4. 善于制造陷阱

请严格遵守以下规则：
- 只能选择空白位置（棋盘上显示为 "·" 的位置）
- 不能下在已有棋子的位置！

${RULES_PROMPT}`,
  
  master: `你是一个五子棋职业大师级 AI。

你的特点：
1. 能看穿所有棋型（眠三、跳三、活四、冲四、连五等）
2. 深度计算（6+ 步）
3. 完美的攻防节奏控制
4. 善于开局定式和飞手设计

请严格遵守以下规则：
- 只能选择空白位置（棋盘上显示为 "·" 的位置）
- 不能下在已有棋子的位置！

${RULES_PROMPT}`
};

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    level: 'easy',
    name: '入门',
    description: '适合初学者，AI 会犯错',
    maxTokens: 100,
    temperature: 0.8,
    systemPrompt: SYSTEM_PROMPTS.easy
  },
  medium: {
    level: 'medium',
    name: '进阶',
    description: '标准对战，会防守和进攻',
    maxTokens: 150,
    temperature: 0.5,
    systemPrompt: SYSTEM_PROMPTS.medium
  },
  hard: {
    level: 'hard',
    name: '困难',
    description: '高水平，需要认真对待',
    maxTokens: 200,
    temperature: 0.3,
    systemPrompt: SYSTEM_PROMPTS.hard
  },
  master: {
    level: 'master',
    name: '大师',
    description: '职业级水平，极难战胜',
    maxTokens: 300,
    temperature: 0.1,
    systemPrompt: SYSTEM_PROMPTS.master
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

/**
 * 检查位置是否有效（空白且在棋盘范围内）
 */
const isValidPosition = (board: BoardData, pos: Position): boolean => {
  const size = board.length;
  return (
    pos.row >= 0 &&
    pos.row < size &&
    pos.col >= 0 &&
    pos.col < size &&
    board[pos.row][pos.col] === null
  );
};

/**
 * 获取所有空白位置
 */
const getEmptyPositions = (board: BoardData): Position[] => {
  const size = board.length;
  const empty: Position[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === null) {
        empty.push({ row: r, col: c });
      }
    }
  }
  return empty;
};

/**
 * 备用：随机落子（选择空白位置）
 */
const getRandomMove = (board: BoardData): Position | null => {
  const emptyPositions = getEmptyPositions(board);
  if (emptyPositions.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * emptyPositions.length);
  return emptyPositions[randomIndex];
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
 * 构建用户提示词
 */
const buildPrompt = (board: BoardData, currentPlayer: 'black' | 'white'): string => {
  const boardStr = boardToString(board);
  const playerEmoji = currentPlayer === 'black' ? '●' : '○';
  const emptyCount = getEmptyPositions(board).length;
  
  return `
## 当前局面
当前执子方：${playerEmoji} (${currentPlayer})
剩余空白位置：${emptyCount} 个

当前棋盘（●黑 ○白，坐标从0开始）：
${boardStr}

## 任务
请分析当前局势，选择最佳落子位置。

## 要求
1. **必须选择空白位置（"·"）**
2. **绝对不能选择已有 "●" 或 "○" 的位置！**
3. 返回格式严格的 JSON

请直接返回 JSON（不要加任何解释）：
{"row": 数字, "col": 数字, "reasoning": "你的分析"}
`;
};

/**
 * 解析 AI 返回的位置
 */
const parseAndValidateResponse = (
  content: string,
  board: BoardData,
  size: number
): Position | null => {
  try {
    // 提取 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[AI] 无法提取 JSON');
      return null;
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // 解析坐标
    if (typeof parsed.row !== 'number' || typeof parsed.col !== 'number') {
      console.error('[AI] 坐标格式错误:', parsed);
      return null;
    }
    
    const row = Math.max(0, Math.min(size - 1, Math.floor(parsed.row)));
    const col = Math.max(0, Math.min(size - 1, Math.floor(parsed.col)));
    
    const position: Position = { row, col };
    
    // 验证位置是否有效（必须在范围内且是空白位置）
    if (!isValidPosition(board, position)) {
      console.error('[AI] 选择的不是空白位置:', position, '棋盘该位置:', board[row][col]);
      
      // 如果无效，自动选择第一个空白位置
      const emptyPositions = getEmptyPositions(board);
      if (emptyPositions.length > 0) {
        const fallback = emptyPositions[0];
        console.log('[AI] 自动选择空白位置:', fallback);
        return fallback;
      }
      return null;
    }
    
    console.log('[AI] 验证通过:', position);
    return position;
    
  } catch (error) {
    console.error('[AI] JSON 解析错误:', error);
    return getRandomMove(board);
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
  // 1. 检查 API Key
  if (!DEEPSEEK_API_KEY) {
    console.warn('[AI] API Key 未配置，使用随机落子');
    return getRandomMove(board);
  }

  const difficulty = getCurrentDifficulty();
  
  try {
    const prompt = buildPrompt(board, currentPlayer);
    
    console.log(`[AI] ${difficulty.name} 难度，思考中... (剩余空白: ${getEmptyPositions(board).length})`);
    
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

    // 2. 处理错误响应
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI] API 错误:', response.status, errorText);
      return getRandomMove(board);
    }

    // 3. 解析成功响应
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    if (!content) {
      console.warn('[AI] 响应为空，使用随机落子');
      return getRandomMove(board);
    }

    console.log(`[AI] ${difficulty.name} 原始响应:`, content);
    
    // 4. 解析并验证位置
    const position = parseAndValidateResponse(content, board, size);
    
    if (position) {
      console.log(`[AI] ${difficulty.name} 最终选择:`, position);
      return position;
    }
    
    // 5. 备用：随机选择空白位置
    console.warn('[AI] 使用备用随机落子');
    return getRandomMove(board);
    
  } catch (error) {
    console.error('[AI] 请求异常:', error);
    return getRandomMove(board);
  }
};
