import { GameMode } from '../types';

interface ControlsProps {
  onUndo: () => void;
  onRestart: () => void;
  onModeChange: (mode: GameMode) => void;
  currentMode: GameMode;
  canUndo: boolean;
}

export default function Controls({ 
  onUndo, 
  onRestart, 
  onModeChange,
  currentMode,
  canUndo 
}: ControlsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-6">
      {/* 模式切换 */}
      <div className="flex bg-gray-200 rounded-lg p-1">
        <button
          onClick={() => onModeChange('pvp')}
          className={`
            px-4 py-2 rounded-md transition-all
            ${currentMode === 'pvp' 
              ? 'bg-blue-500 text-white shadow-md' 
              : 'text-gray-700 hover:bg-gray-300'}
          `}
        >
          🏆 双人对战
        </button>
        <button
          onClick={() => onModeChange('pva')}
          className={`
            px-4 py-2 rounded-md transition-all
            ${currentMode === 'pva' 
              ? 'bg-blue-500 text-white shadow-md' 
              : 'text-gray-700 hover:bg-gray-300'}
          `}
        >
          🧠 人机对战
        </button>
      </div>

      {/* 操作按钮 */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`
          px-6 py-2 rounded-lg font-medium transition-all
          ${canUndo 
            ? 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-md' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
        `}
      >
        ↩️ 悔棋
      </button>

      <button
        onClick={onRestart}
        className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-all shadow-md"
      >
        🔄 重新开始
      </button>
    </div>
  );
}
