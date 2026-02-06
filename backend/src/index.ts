import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { getAIMove } from './utils/deepseek';
import { BoardData } from './types';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    deepseek: {
      configured: !!process.env.DEEPSEEK_API_KEY,
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    }
  });
});

// Basic routes
app.get('/api', (req, res) => {
  res.json({ message: 'Gomoku Play API', version: '1.0.0' });
});

// AI Move endpoint - 调用 DeepSeek 获取 AI 落子建议
app.post('/api/ai-move', async (req, res) => {
  try {
    const { board, currentPlayer, boardSize } = req.body;
    
    if (!board || !currentPlayer || !boardSize) {
      return res.status(400).json({ 
        error: '缺少必要参数',
        required: ['board', 'currentPlayer', 'boardSize'] 
      });
    }
    
    console.log(`[AI Move] 收到请求: 玩家=${currentPlayer}, 棋盘尺寸=${boardSize}`);
    
    const position = await getAIMove(
      board as BoardData, 
      currentPlayer, 
      boardSize
    );
    
    if (position) {
      res.json({ 
        success: true, 
        position,
        message: 'AI 落子建议' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: '无法获取 AI 落子建议' 
      });
    }
  } catch (error) {
    console.error('[AI Move] 处理请求时出错:', error);
    res.status(500).json({ 
      success: false, 
      error: '服务器内部错误' 
    });
  }
});

// Create HTTP server
const server = createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');

  ws.on('message', (message) => {
    console.log('Received:', message.toString());
    ws.send(`Echo: ${message.toString()}`);
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });

  ws.send('Welcome to Gomoku Play WebSocket server!');
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`WebSocket server is running on ws://localhost:${PORT}/ws`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`AI Move endpoint: POST http://localhost:${PORT}/api/ai-move`);
  console.log(`DeepSeek Model: ${process.env.DEEPSEEK_MODEL || 'deepseek-chat'}`);
});
