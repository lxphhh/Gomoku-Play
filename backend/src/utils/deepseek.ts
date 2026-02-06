import { BoardData, Position } from '../types';

// DeepSeek API 配置
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const DEEPSEEK_TIMEOUT = parseInt(process.env.DEEPSEEK_TIMEOUT || '60000', 10);

export interface AIGenerationResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 将棋盘转换为字符串表示
 */
export const boardToString = (board: BoardData): string => {
  const size = board.length;
  let result = '   ';
  
  // 添加列标题
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
 * 构建 AI 提示词
 */
export const buildAIPrompt = (
  board: BoardData,
  currentPlayer: 'black' | 'white',
  size: number = 15
): string => {
  const boardStr = boardToString(board);
  const playerEmoji = currentPlayer === 'black' ? '●' : '○';
  const opponentEmoji = currentPlayer === 'black' ? '○' : '●';
  
  return `
# 五子棋 AI 对话

你是一个五子棋 AI 助手，请根据当前棋盘局势给出最佳落子位置。

## 棋盘状态
${boardStr}

## 当前信息
- 当前执子方: ${playerEmoji} (${currentPlayer})
- 对手执子方: ${opponentEmoji}
- 棋盘尺寸: ${size}x${size}
- 胜利条件: 连成5子

## 要求
1. 分析当前棋盘局势
2. 找出最佳落子位置
3. 考虑进攻（形成连子）和防守（阻止对手连子）
4. 返回格式: JSON 对象，包含 "row" 和 "col" 字段（从 0 开始计数）

## 示例返回格式
\`\`\`json
{
  "row": 7,
  "col": 8,
  "reasoning": "在 (7,8) 落子可以形成活三，同时阻止对手的冲四"
}
\`\`\`

请直接返回 JSON 对象，不要添加其他内容。
`;
};

/**
 * 调用 DeepSeek API 获取 AI 落子建议
 */
export const getAIMove = async (
  board: BoardData,
  currentPlayer: 'black' | 'white',
  size: number = 15
): Promise<Position | null> => {
  if (!DEEPSEEK_API_KEY) {
    console.error('[DeepSeek] API Key 未配置');
    return null;
  }

  try {
    const prompt = buildAIPrompt(board, currentPlayer, size);
    
    console.log('[DeepSeek] 正在调用 API...');
    
    const response = await fetch(`${DEEPSEEK_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(DEEPSEEK_TIMEOUT),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DeepSeek] API 错误:', response.status, errorText);
      return null;
    }

    const data: AIGenerationResponse = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    console.log('[DeepSeek] API 响应:', content);
    
    // 解析 JSON 响应
    try {
      // 尝试提取 JSON 代码块
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      const parsed = JSON.parse(jsonStr);
      
      if (parsed.row !== undefined && parsed.col !== undefined) {
        const position: Position = {
          row: parseInt(String(parsed.row), 10),
          col: parseInt(String(parsed.col), 10),
        };
        
        // 验证位置有效性
        if (
          position.row >= 0 &&
          position.row < size &&
          position.col >= 0 &&
          position.col < size
        ) {
          console.log('[DeepSeek] AI 建议落子:', position);
          return position;
        } else {
          console.error('[DeepSeek] AI 返回位置超出棋盘范围:', position);
        }
      }
    } catch (parseError) {
      console.error('[DeepSeek] JSON 解析错误:', parseError, '原始内容:', content);
    }
    
    return null;
  } catch (error) {
    console.error('[DeepSeek] 请求错误:', error);
    return null;
  }
};
