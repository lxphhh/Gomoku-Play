# Gomoku-Play 🎮

Full-stack Gomoku (Five in a Row) game built with React, Express, TypeScript, and WebSocket.

## Features

- 🏆 **Multiple Game Modes**
  - Player vs Player (Local)
  - Player vs AI (Simple Bot)
  - Online PvP (Coming Soon)

- 🎨 **Modern UI**
  - Clean, responsive design with Tailwind CSS
  - Smooth animations and transitions
  - Mobile-friendly interface

- ⚡ **Real-time Updates**
  - WebSocket support for live multiplayer
  - Instant game state synchronization

- 🔧 **Developer Friendly**
  - Full TypeScript support
  - Monorepo structure
  - ESLint + Prettier configured
  - Hot reload development

## Tech Stack

### Frontend
- React 18+ with TypeScript
- Vite for fast builds
- Tailwind CSS for styling
- Custom hooks for game logic

### Backend
- Express.js with TypeScript
- WebSocket (ws) for real-time communication
- RESTful API architecture
- Simple AI opponent

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/Gomoku-Play.git
cd Gomoku-Play

# Install dependencies
npm install

# Start development servers
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:3001`.

### Available Scripts

```bash
# Start both frontend and backend
npm run dev

# Start only frontend
npm run dev:frontend

# Start only backend
npm run dev:backend

# Build for production
npm run build

# Lint code
npm run lint

# Format code
npm run format
```

## Project Structure

```
gomoku-play/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── types/        # TypeScript type definitions
│   │   ├── utils/        # Utility functions
│   │   └── styles/       # Global styles
│   ├── package.json
│   └── vite.config.ts
│
├── backend/              # Express backend application
│   ├── src/
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Express middleware
│   │   ├── models/       # Data models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── types/        # TypeScript definitions
│   │   └── utils/        # Utility functions
│   ├── package.json
│   └── tsconfig.json
│
├── package.json           # Root workspace package.json
├── tsconfig.json          # TypeScript configuration
├── .eslintrc.cjs          # ESLint configuration
├── .prettierrc            # Prettier configuration
└── README.md              # Project documentation
```

## Game Rules

Gomoku (Five in a Row) is a traditional board game:

1. Players take turns placing stones (black first)
2. First player to align 5 stones horizontally, vertically, or diagonally wins
3. Standard rules apply (no overlines for casual play)

## API Endpoints

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/games` | Create a new game |
| GET | `/api/games/:id` | Get game state |
| POST | `/api/games/:id/move` | Make a move |
| POST | `/api/games/:id/undo` | Request undo |
| POST | `/api/games/:id/restart` | Restart game |

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join` | Client → Server | Join a game room |
| `move` | Client → Server | Send a move |
| `gameState` | Server → Client | Receive game state |
| `gameOver` | Server → Client | Game ended notification |
| `undoRequest` | Bidirectional | Request to undo move |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat(scope): add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [React](https://reactjs.org/)
- [Express](https://expressjs.com/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
