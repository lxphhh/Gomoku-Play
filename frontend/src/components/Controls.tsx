import { GameMode } from '../types';
import { DifficultyConfig, getDifficultyOptions, setDifficulty, getCurrentDifficulty, AIProvider, getCurrentProvider, setProvider, getProviderOptions } from '../utils/deepseek';
import { useState, useEffect } from 'react';

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
  const [difficulty, setDifficultyState] = useState<DifficultyConfig>(getCurrentDifficulty());
  const [provider, setProviderState] = useState<AIProvider>(getCurrentProvider());
  const [showDifficultySelector, setShowDifficultySelector] = useState(false);
  const [showProviderSelector, setShowProviderSelector] = useState(false);
  const difficulties = getDifficultyOptions();
  const providers = getProviderOptions();

  useEffect(() => {
    setDifficultyState(getCurrentDifficulty());
    setProviderState(getCurrentProvider());
  }, []);

  const handleDifficultyChange = (diff: DifficultyConfig) => {
    setDifficulty(diff.level);
    setDifficultyState(diff);
    setShowDifficultySelector(false);
  };

  const handleProviderChange = (p: { value: AIProvider; label: string }) => {
    setProvider(p.value);
    setProviderState(p.value);
    setShowProviderSelector(false);
    console.log('[AI] 已切换到:', p.label);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-orange-500';
      case 'master': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-6">
      {/* AI 选择器 */}
      {currentMode === 'pva' && (
        <div className="relative">
          <button
            onClick={() => setShowProviderSelector(!showProviderSelector)}
            className="px-4 py-2 rounded-lg font-medium text-white shadow-md bg-purple-500"
          >
            🤖 AI: {providers.find(p => p.value === provider)?.label} ▼
          </button>

          {showProviderSelector && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 
                          bg-white rounded-lg shadow-xl p-2 z-50 min-w-[180px]
                          border border-gray-200">
              {providers.map((p) => (
                <button
                  key={p.value}
                  onClick={() => handleProviderChange(p)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-all
                    ${provider === p.value ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 难度选择器 */}
      {currentMode === 'pva' && (
        <div className="relative">
          <button
            onClick={() => setShowDifficultySelector(!showDifficultySelector)}
            className={`px-4 py-2 rounded-lg font-medium text-white shadow-md ${getDifficultyColor(difficulty.level)}`}
          >
            🎯 难度: {difficulty.name} ▼
          </button>

          {showDifficultySelector && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 
                          bg-white rounded-lg shadow-xl p-2 z-50 min-w-[200px]
                          border border-gray-200">
              <div className="text-xs text-gray-500 px-3 py-1 border-b">
                选择 AI 难度等级
              </div>
              {difficulties.map((diff) => (
                <button
                  key={diff.level}
                  onClick={() => handleDifficultyChange(diff)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-all
                    ${difficulty.level === diff.level ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${getDifficultyColor(diff.level)}`}></span>
                    <span className="font-medium">{diff.name}</span>
                  </div>
                  <div className="text-xs text-gray-500 ml-5">{diff.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 模式切换 */}
      <div className="flex bg-gray-200 rounded-lg p-1">
        <button
          onClick={() => onModeChange('pvp')}
          className={`px-4 py-2 rounded-md transition-all
            ${currentMode === 'pvp' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-700 hover:bg-gray-300'}`}
        >
          🏆 双人对战
        </button>
        <button
          onClick={() => onModeChange('pva')}
          className={`px-4 py-2 rounded-md transition-all
            ${currentMode === 'pva' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-700 hover:bg-gray-300'}`}
        >
          🧠 人机对战
        </button>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`px-6 py-2 rounded-lg font-medium transition-all
            ${canUndo ? 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-md' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
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
    </div>
  );
}
