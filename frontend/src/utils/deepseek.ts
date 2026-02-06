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

// 五子棋核心规则
const RULES = `
【五子棋规则】
- 黑棋先行，白棋后行
- 只能在空白交叉点落子（不能下在已有棋子的位置！）
- 横/竖/斜任意方向连成5子即获胜
- 必须返回正确的 JSON 格式
`;

// 专业棋型术语
const PATTERNS = `
【棋型定义】
活四：AA.AA（中间任意空）= 下一手必胜
冲四：AAAA. 或 .AAAA = 冲四叫杀
活三：AA.AA（两个空位都不在端点）= 强活三
眠三：A.AA. 或 AA.A. 或 A.A.A = 眠三
跳三：A.AAA 或 AAA.A = 跳三威胁
`;

// 策略指南
const STRATEGY = `
【攻守策略】

【进攻优先级】（从高到低）
1. 连五 = 直接获胜
2. 活四 = 下一手必胜
3. 冲四 = 制造冲四叫杀
4. 活三 = 扩张优势

【防守优先级】（从高到低）
1. 对方活四 = 必须挡住！
2. 对方冲四 = 优先挡住
3. 对方活三 = 考虑反三或挡

【位置价值评估】
- 中心位 (7,7) 附近 > 边角位
- 能连接自己棋子 > 独立位置
- 能同时攻和守 > 单向价值
`;

// 不同难度的专业提示词
const SYSTEM_PROMPTS: Record<DifficultyLevel, string> = {
  easy: `${RULES}${PATTERNS}

【你是新手】只会看眼前1步，经常犯错，防守意识弱。`,

  medium: `${RULES}${PATTERNS}${STRATEGY}

【你是中等水平】能识别基本棋型，攻防平衡，能看2-3步。`,

  hard: `${RULES}${PATTERNS}${STRATEGY}

【你是高手】准确定位所有棋型，深度计算4-5步，攻防精准。`,

  master: `${RULES}${PATTERNS}${STRATEGY}

【你是职业大师】精通所有战术，深度计算6+步，善用定式和陷阱，完美攻防节奏。`
};

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: { 
    level: 'easy', name: '入门', description: '初学者', 
    maxTokens: 80, temperature: 0.9, systemPrompt: SYSTEM_PROMPTS.easy 
  },
  medium: { 
    level: 'medium', name: '进阶', description: '中等', 
    maxTokens: 120, temperature: 0.6, systemPrompt: SYSTEM_PROMPTS.medium 
  },
  hard: { 
    level: 'hard', name: '困难', description: '高手', 
    maxTokens: 180, temperature: 0.3, systemPrompt: SYSTEM_PROMPTS.hard 
  },
  master: { 
    level: 'master', name: '大师', description: '职业', 
    maxTokens: 250, temperature: 0.1, systemPrompt: SYSTEM_PROMPTS.master 
  }
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

const parseAIResponse = (content: string, board: BoardData): Position | null => {
  try {
    console.log('[AI] 原始响应:', content);
    
    // 尝试多种 JSON 格式
    const formats = [
      /\{"row"\s*:\s*(\d+)\s*,\s*"col"\s*:\s*(\d+)\}/,
      /\{"col"\s*:\s*(\d+)\s*,\s*"row"\s*:\s*(\d+)\}/,
      /\[\s*(\d+)\s*,\s*(\d+)\s*\]/,
      /"position"\s*:\s*\{\s*"row"\s*:\s*(\d+)\s*,\s*"col"\s*:\s*(\d+)\s*\}/,
    ];

    for (const fmt of formats) {
      const match = content.match(fmt);
      if (match) {
        const pos = { row: parseInt(match[1], 10), col: parseInt(match[2], 10) };
        if (isValid(board, pos)) {
          console.log('[AI] 解析成功:', pos);
          return pos;
        }
      }
    }

    // 提取任意 JSON
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
    
  } catch (error) {
    console.warn('[AI] 异常:', error);
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

  const userPrompt = `当前棋盘：
${boardStr}

轮到${playerEmoji}落子。

请分析：
1. 双方各有什么棋型？
2. 有无连五/活四/冲四？
3. 最佳落子位置？

直接返回 JSON（只返回JSON，不要解释）：
{"row": 0-14的数字, "col": 0-14的数字, "reasoning": "一句话分析"}`;

  try {
    console.log(`[AI] ${difficulty.name} 思考中...`);
    
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
      console.error('[AI] API错误:', response.status, errorText);
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
