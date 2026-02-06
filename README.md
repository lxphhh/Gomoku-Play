# Gomoku-Play 五子棋游戏

一个基于 React + TypeScript + Vite 的五子棋游戏，支持 PvP（双人对战）和 PvA（人机对战）。

## 技术栈

- **前端框架**: React 18
- **构建工具**: Vite 5
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 3
- **AI 对接**: DeepSeek API（前端直接调用）

## 项目结构

```
Gomoku-Play/
├── frontend/                 # 前端项目（前后端不分离）
│   ├── src/
│   │   ├── components/        # React 组件
│   │   │   ├── Board.tsx     # 棋盘组件
│   │   │   ├── Controls.tsx  # 控制面板组件
│   │   │   └── Game.tsx      # 游戏主组件
│   │   ├── hooks/
│   │   │   └── useGame.ts    # 游戏逻辑 Hook
│   │   ├── utils/
│   │   │   ├── gameLogic.ts  # 游戏逻辑工具函数
│   │   │   └── deepseek.ts   # DeepSeek AI 对接
│   │   ├── types/
│   │   │   └── index.ts      # TypeScript 类型定义
│   │   ├── App.tsx           # 应用入口组件
│   │   └── main.tsx          # 应用入口
│   ├── index.html            # HTML 模板
│   ├── vite.config.ts        # Vite 配置
│   └── package.json
├── backend/                  # 后端项目（保留但不使用）
│   └── ...
└── package.json              # 根目录 package.json
```

## 功能特性

### ✅ 已完成
- 🎮 **PvP 双人对战**: 黑白棋轮流下
- 🤖 **PvA 人机对战**: 白棋由 DeepSeek AI 控制
- 🏆 **胜负判定**: 连成 5 子获胜
- ↩️ **悔棋功能**: 可撤销最后一步
- 🔄 **重新开始**: 重置游戏
- 📱 **响应式设计**: 适配移动端

### AI 对接
- 前端直接调用 DeepSeek API，无需后端
- 环境变量配置（Vercel 中配置）

## 开发

### 安装依赖

```bash
cd frontend
npm install
```

### 开发模式

```bash
cd frontend
npm run dev
```

### 构建生产版本

```bash
cd frontend
npm run build
```

## 环境变量

在 Vercel 项目中配置以下环境变量：

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_DEEPSEEK_API_URL` | DeepSeek API 地址 | `https://api.deepseek.com` |
| `VITE_DEEPSEEK_API_KEY` | DeepSeek API Key | - |
| `VITE_DEEPSEEK_MODEL` | 模型名称 | `deepseek-chat` |
| `VITE_DEEPSEEK_TIMEOUT` | 超时时间(ms) | `60000` |

## 部署

### Vercel 部署

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. Vercel 自动部署

### 注意事项

- 前端环境变量必须以 `VITE_` 开头
- `.env` 文件不会上传到 Git（已在 .gitignore 中配置）
- 部署后访问域名即可游戏

## License

MIT
