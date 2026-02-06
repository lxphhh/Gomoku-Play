import { Position, BoardData } from '../types';

// DeepSeek API 配置
// 正确端点：https://api.deepseek.com/chat/completions（无需 /v1）
const DEEPSEEK_API_URL = import.meta.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
const DEEPSEEK_MODEL = (import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat').trim();
const DEEPSEEK_TIMEOUT = parseInt(import.meta.env.VITE_DEEPSEEK_TIMEOUT || '30000', 10);

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
const buildPrompt = (board: BoardData, currentPlayer: 'black' | 'white'): string => {
  const boardStr = boardToString(board);
  
  return `# 五子棋 AI

当前棋盘（●黑 ○白）：
${boardStr}

当前执子：${currentPlayer}

请直接返回 JSON，格式：
{"row": 0-14的数字, "col": 0-14的数字}
`;
};

/**
 * 解析 AI 返回的位置
 */
const parseResponse = (content: string, size: number): Position | null => {
  try {
    // 提取 JSON
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
 * 调用 DeepSeek API
 */
export const getAIMove = async (
  board: BoardData,
  currentPlayer: 'black' | 'white',
  size: number = 15
): Promise<Position | null> => {
  // 1. 检查 API Key
  if (!DEEPSEEK_API_KEY) {
    console.warn('[DeepSeek] API Key 未配置，使用随机落子');
    return getRandomMove(board);
  }

  // 2. 发送请求
  try {
    const prompt = buildPrompt(board, currentPlayer);
    
    console.log('[DeepSeek] 发送请求...');
    
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(DEEPSEEK_TIMEOUT),
    });

    // 3. 处理错误响应
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DeepSeek] API 错误:', response.status, errorText);
      return getRandomMove(board);
    }

    // 4. 解析成功响应
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('[DeepSeek] 响应:', content);
    
    if (!content) {
      return getRandomMove(board);
    }

    const position = parseResponse(content, size);
    
    if (position) {
      console.log('[DeepSeek] 成功:', position);
      return position;
    }
    
    return getRandomMove(board);
    
  } catch (error) {
    console.error('[DeepSeek] 请求异常:', error);
    return getRandomMove(board);
  }
};
