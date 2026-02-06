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

// 五子棋核心规则（所有难度通用）
const CORE_RULES = `
## 🎯 五子棋核心规则
1. 黑棋先手，白棋后手，双方轮流落子
2. **最重要：只能下在空白位置（"·"），绝不能下在已有棋子的位置！**
3. 横、竖、斜任意方向连成5子（连5）即获胜
4. 连5即胜，不需要6子或更多
5. 禁止使用"长连"禁手（普通规则中可忽略）
`;

// 棋型定义
const PATTERN_ANALYSIS = `
## 📊 棋型分析（进攻型）

### 🔥 必胜型（最高优先级）
- **连五 (5)**: 已经连成5子，直接获胜
- **活四 (活四)**: 两头都没有阻挡的4子，下一手必胜
- **冲四 (冲四)**: 一头被阻挡的4子，形成冲四

### ⚠️ 威胁型（高分）
- **活三 (活三)**: 两头都没阻挡的3子，活三后可能形成活四
- **眠三 (眠三)**: 只有一头开放的3子
- **跳三 (跳三)**: 中间有空格的3子

### 📈 发展型（中分）
- **活二 (活二)**: 两头开放的2子
- **眠二 (眠二)**: 只有一头开放的2子
- **活一 (活一)**: 单独的一子

## 🛡️ 防守优先级

1. **最高**: 对手有"活四"→ 必须挡住（否则下一手输）
2. **高**: 对手有"冲四"→ 优先挡住
3. **中**: 对手有"活三"→ 考虑挡住或自己也活三
4. **常规**: 正常攻防
`;

// 策略指南
const STRATEGY_GUIDE = `
## 🧠 AI 决策策略

### 进攻策略
1. 检查自己是否有必胜型（活四、冲四）→ 直接获胜
2. 创造活四的机会
3. 延伸活三到活四

### 防守策略
1. 检查对手是否有威胁型
2. 对手活四必须挡住（最高优先级）
3. 对手冲四优先挡住
4. 对手活三可以考虑反活三

### 位置评估
1. **中心优势**: 棋盘中心（7,7）附近更有价值
2. **连接性**: 能连接自己棋子的位置更好
3. **阻挡性**: 能同时阻挡对手的位置更好
4. **多功能**: 同时具有进攻和防守价值的位置最佳
`;

// 不同难度的系统提示词
const SYSTEM_PROMPTS: Record<DifficultyLevel, string> = {
  easy: `你是一个五子棋入门水平 AI，棋力较弱，会犯简单错误。

${CORE_RULES}

${PATTERN_ANALYSIS}

## 🎮 你的风格
- 只会看眼前的一两步
- 很少主动防守
- 经常错过好机会
- 偶尔下出"假棋"（看起来好但实际无用）

${STRATEGY_GUIDE}

## ⚠️ 特别提醒
- **必须选择空白位置！**
- 如果你不确定，选择靠近中心的位置
- 不要思考太深，快速决策
`,

  medium: `你是一个五子棋中等水平 AI，具备基本棋力。

${CORE_RULES}

${PATTERN_ANALYSIS}

## 🎮 你的风格
- 能识别基本棋型（活三、冲四等）
- 会进行基本的攻防
- 能看 2-3 步
- 会犯偶尔的错误

${STRATEGY_GUIDE}

## ⚠️ 特别提醒
- **必须选择空白位置！**
- 优先检查双方威胁
- 进攻时先看自己能否连五
- 防守时优先挡住活四
`,

  hard: `你是一个五子棋高水平 AI，棋力强劲，很少犯错。

${CORE_RULES}

${PATTERN_ANALYSIS}

${STRATEGY_GUIDE}

## 🎮 你的风格
- 准确识别所有棋型（活四、冲四、眠三、跳三等）
- 能进行深度计算（4-5 步）
- 攻防转换时机精准
- 善于制造和使用陷阱
- 很少犯低级错误

## ⚠️ 特别提醒
- **必须选择空白位置！**
- 严格按优先级处理
- 1. 自己的连五 → 直接获胜
- 2. 对手的活四 → 必须挡住
- 3. 对手的冲四 → 优先挡住
- 4. 创造自己的活四/活三
- 5. 深度计算至少 4 步
`,

  master: `你是一个五子棋职业大师级 AI，拥有超强的棋力和战略眼光。

${CORE_RULES}

${PATTERN_ANALYSIS}

${STRATEGY_GUIDE}

## 🎮 你的风格
- 准确识别所有棋型，包括复杂的复合型
- 能进行深度计算（6+ 步）
- 精通各种开局定式（花月、蒲月、流星、月等）
- 善于制造"双重威胁"（同时创造两个威胁）
- 完美的攻防节奏控制
- 极少犯错，每一步都经过深思熟虑

## ⚠️ 严格遵守
- **必须选择空白位置！绝不能下在已有棋子的位置！**
- 严格的优先级处理：
  1. 自己的连五（最高优先级）
  2. 对手的活四（必须挡住）
  3. 对手的冲四（优先挡住）
  4. 自己的冲四/活四
  5. 对手的活三（反三或挡）
  6. 自己的活三/跳三
  7. 位置价值评估（中心、连接、阻挡）
- 深度计算至少 6 步
- 考虑多种变化路
`
};

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    level: 'easy',
    name: '入门',
    description: '初学者水平，棋力较弱',
    maxTokens: 100,
    temperature: 0.9,
    systemPrompt: SYSTEM_PROMPTS.easy
  },
  medium: {
    level: 'medium',
    name: '进阶',
    description: '中等水平，基本攻防',
    maxTokens: 150,
    temperature: 0.6,
    systemPrompt: SYSTEM_PROMPTS.medium
  },
  hard: {
    level: 'hard',
    name: '困难',
    description: '高水平，深度计算',
    maxTokens: 200,
    temperature: 0.3,
    systemPrompt: SYSTEM_PROMPTS.hard
  },
  master: {
    level: 'master',
    name: '大师',
    description: '职业级，极难战胜',
    maxTokens: 300,
    temperature: 0.1,
    systemPrompt: SYSTEM_PROMPTS.master
  }
};

// 当前难度
let currentDifficulty: DifficultyLevel = 'medium';

export const getCurrentDifficulty = (): DifficultyConfig => DIFFICULTY_CONFIGS[currentDifficulty];
export const setDifficulty = (level: DifficultyLevel) => {
  if (DIFFICULTY_CONFIGS[level]) {
    currentDifficulty = level;
    console.log('[AI] 难度切换:', DIFFICULTY_CONFIGS[level].name);
  }
};
export const getDifficultyOptions = (): DifficultyConfig[] => Object.values(DIFFICULTY_CONFIGS);

// 工具函数
const isValidPosition = (board: BoardData, pos: Position): boolean => {
  const size = board.length;
  return pos.row >= 0 && pos.row < size && pos.col >= 0 && pos.col < size && board[pos.row][pos.col] === null;
};

const getEmptyPositions = (board: BoardData): Position[] => {
  const size = board.length;
  const empty: Position[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === null) empty.push({ row: r, col: c });
    }
  }
  return empty;
};

const getRandomMove = (board: BoardData): Position | null => {
  const empty = getEmptyPositions(board);
  if (empty.length === 0) return null;
  return empty[Math.floor(Math.random() * empty.length)];
};

const boardToString = (board: BoardData): string => {
  const size = board.length;
  let result = '   ';
  for (let c = 0; c < size; c++) result += ` ${c + 1} `;
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

const buildPrompt = (board: BoardData, currentPlayer: 'black' | 'white'): string => {
  const boardStr = boardToString(board);
  const playerEmoji = currentPlayer === 'black' ? '●' : '○';
  const emptyCount = getEmptyPositions(board).length;
  
  return `
## 🎮 当前局面
执子方：${playerEmoji} (${currentPlayer})
剩余空白：${emptyCount} 个

当前棋盘（●黑 ○白，坐标从0开始）：
${boardStr}

## 📋 分析任务
1. 分析当前双方棋型
2. 识别威胁（自己的和对手的）
3. 给出最佳落子位置

## ⚠️ 强制要求
- **只能选择空白位置（"·"）！**
- **绝对不能选择已有棋子的位置！**
- 必须返回严格 JSON 格式

## 📝 返回格式
{"row": 数字, "col": 数字, "analysis": "简要分析", "threatLevel": "威胁等级"}

威胁等级选项：必胜/高/中/低
`;
};

const parseResponse = (content: string, board: BoardData, size: number): Position | null => {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return getRandomMove(board);
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (typeof parsed.row === 'number' && typeof parsed.col === 'number') {
      const row = Math.max(0, Math.min(size - 1, Math.floor(parsed.row)));
      const col = Math.max(0, Math.min(size - 1, Math.floor(parsed.col)));
      const pos = { row, col };
      
      if (isValidPosition(board, pos)) {
        console.log('[AI] 验证通过:', pos, '分析:', parsed.analysis);
        return pos;
      }
    }
    
    console.error('[AI] 无效位置，自动选择空白位置');
    return getRandomMove(board);
  } catch {
    return getRandomMove(board);
  }
};

export const getAIMove = async (
  board: BoardData,
  currentPlayer: 'black' | 'white',
  size: number = 15
): Promise<Position | null> => {
  if (!DEEPSEEK_API_KEY) return getRandomMove(board);

  const difficulty = getCurrentDifficulty();
  
  try {
    const prompt = buildPrompt(board, currentPlayer);
    
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
          { role: 'user', content: prompt },
        ],
        max_tokens: difficulty.maxTokens,
        temperature: difficulty.temperature,
      }),
      signal: AbortSignal.timeout(DEEPSEEK_TIMEOUT),
    });

    if (!response.ok) {
      console.error('[AI] API 错误:', response.status);
      return getRandomMove(board);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    if (!content) return getRandomMove(board);

    console.log(`[AI] ${difficulty.name} 响应:`, content);
    return parseResponse(content, board, size);
    
  } catch (error) {
    console.error('[AI] 请求异常:', error);
    return getRandomMove(board);
  }
};
