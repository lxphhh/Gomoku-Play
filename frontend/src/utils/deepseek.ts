import { Position, BoardData } from '../types';

// DeepSeek API 配置 (从环境变量读取)
const DEEPSEEK_API_URL = import.meta.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com';
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
const DEEPSEEK_MODEL = import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat';
const DEEPSEEK_TIMEOUT = parseInt(import.meta.env.VITE_DEEPSEEK_TIMEOUT || '30000', 10);

/**
 * 将棋盘转换为字符串表示
 */
export const boardToString = (board: BoardData): string => {
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
      if (cell === null) {
        result += ' · ';
      } else if (cell === 'black') {
        result += ' ● ';
      } else if (cell === 'white') {
        result += ' ○ ';
      }
    }
    result += '\n';
  }
  
  return result;
};

/**
 * 构建 AI 提示词（简化版）
 */
export const buildAIPrompt = (
  board: BoardData,
  currentPlayer: 'black' | 'white',
  _size: number = 15
): string => {
  const boardStr = boardToString(board);
  
  return `
# 五子棋 AI

当前棋盘（●黑 ○白，坐标从0开始）：
${boardStr}

当前执子：${currentPlayer}

直接返回 JSON：
{"row": 数字, "col": 数字}
`;
};

/**
 * 备用：随机落子
 */
export const getRandomMove = (board: BoardData): Position | null => {
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
 * 解析 AI 返回的位置
 */
const parseAIMove = (content: string, size: number): Position | null => {
  try {
    // 尝试多种格式提取 JSON
    let jsonStr = content;
    
    // 格式1: ```json {...}```
    const match1 = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (match1) jsonStr = match1[1];
    
    // 格式2: ```{...}```
    const match2 = content.match(/```\s*([\s\S]*?)\s*```/);
    if (match2) jsonStr = match2[1];
    
    // 格式3: {"row": 数字, "col": 数字}
    const match3 = content.match(/\{[\s\S]*\}/);
    if (match3) jsonStr = match3[0];
    
    console.log('[DeepSeek] 解析内容:', jsonStr);
    
    const parsed = JSON.parse(jsonStr);
    
    if (typeof parsed.row === 'number' && typeof parsed.col === 'number') {
      const position: Position = {
        row: Math.max(0, Math.min(size - 1, Math.floor(parsed.row))),
        col: Math.max(0, Math.min(size - 1, Math.floor(parsed.col))),
      };
      
      // 验证位置
      if (position.row >= 0 && position.row < size && position.col >= 0 && position.col < size) {
        return position;
      }
    }
    
    console.error('[DeepSeek] 解析结果无效:', parsed);
    return null;
  } catch (e) {
    console.error('[DeepSeek] JSON 解析失败:', e, '内容:', content);
    return null;
  }
};

/**
 * 调用 DeepSeek API 获取 AI 落子建议
 */
export const getAIMove = async (
  board: BoardData,
  currentPlayer: 'black' | 'white',
  size: number = 15
): Promise<Position | null> => {
  // 检查 API Key
  if (!DEEPSEEK_API_KEY) {
    console.warn('[DeepSeek] API Key 未配置，使用随机落子');
    return getRandomMove(board);
  }

  try {
    const prompt = buildAIPrompt(board, currentPlayer, size);
    
    console.log('[DeepSeek] 发送请求...');
    
    const response = await fetch(`${DEEPSEEK_API_URL}/chat/completions`, {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DeepSeek] API 错误:', response.status, errorText);
      return getRandomMove(board);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('[DeepSeek] 原始响应:', content);
    
    if (!content) {
      console.warn('[DeepSeek] 响应为空');
      return getRandomMove(board);
    }

    const position = parseAIMove(content, size);
    
    if (position) {
      console.log('[DeepSeek] 成功:', position);
      return position;
    }
    
    // 解析失败，使用随机落子
    console.warn('[DeepSeek] 解析失败，使用随机落子');
    return getRandomMove(board);
    
  } catch (error) {
    console.error('[DeepSeek] 请求错误:', error);
    return getRandomMove(board);
  }
};
