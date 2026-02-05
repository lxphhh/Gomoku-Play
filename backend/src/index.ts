import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Basic routes
app.get('/api', (req, res) => {
  res.json({ message: 'Gomoku Play API', version: '1.0.0' });
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
});
