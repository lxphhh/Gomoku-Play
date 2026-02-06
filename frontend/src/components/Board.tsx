import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Position, StoneColor } from '../types';

interface BoardProps {
  board: StoneColor[][];
  onCellClick: (position: Position) => void;
  lastMove?: Position;
  winningLine?: Position[];
  disabled?: boolean;
}

const Board: React.FC<BoardProps> = ({ 
  board, 
  onCellClick, 
  lastMove,
  winningLine,
  disabled = false
}) => {
  const boardSize = board.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const maxWidth = Math.min((window.innerWidth || 500) - 40, 500);
        setContainerWidth(maxWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const cellSize = containerWidth > 0 ? containerWidth / boardSize : 25;
  
  const isWinningCell = (row: number, col: number): boolean => {
    if (!winningLine) return false;
    return winningLine.some(pos => pos.row === row && pos.col === col);
  };

  const isLastMove = (row: number, col: number): boolean => {
    if (!lastMove) return false;
    return lastMove.row === row && lastMove.col === col;
  };

  const getCellClass = (cell: StoneColor, row: number, col: number): string => {
    let classes = 'absolute rounded-full shadow-lg ';
    if (cell === 'black') {
      classes += 'bg-gradient-to-br from-gray-700 to-black';
    } else {
      classes += 'bg-gradient-to-br from-white to-gray-300';
    }
    if (isLastMove(row, col)) {
      classes += ' ring-4 ring-red-500';
    }
    if (isWinningCell(row, col)) {
      classes += ' ring-4 ring-red-500 animate-pulse';
    }
    classes += ' animate-piece-place';
    return classes;
  };

  const getBoxShadow = (cell: StoneColor): string => {
    if (cell === 'black') {
      return '2px 2px 4px rgba(0,0,0,0.5)';
    }
    return '2px 2px 4px rgba(0,0,0,0.3), inset 2px 2px 4px rgba(255,255,255,0.8)';
  };

  return (
    <div className="board-container mx-auto relative flex justify-center" ref={containerRef} style={{ padding: '10px' }}>
      <div 
        className="relative bg-[#F5D6A8] border-2 border-[#8B5E3C] shadow-2xl"
        style={{ 
          width: boardSize * cellSize,
          height: boardSize * cellSize,
        }}
      >
        {Array.from({ length: boardSize }).map((_, index) => (
          <div key={'row-' + index} className="absolute" style={{
            top: index * cellSize + cellSize / 2,
            left: cellSize / 2,
            width: (boardSize - 1) * cellSize,
            height: '2px',
            backgroundColor: '#8B5E3C',
          }} />
        ))}
        {Array.from({ length: boardSize }).map((_, index) => (
          <div key={'col-' + index} className="absolute" style={{
            left: index * cellSize + cellSize / 2,
            top: cellSize / 2,
            height: (boardSize - 1) * cellSize,
            width: '2px',
            backgroundColor: '#8B5E3C',
          }} />
        ))}

        {board.map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <div
              key={rowIndex + '-' + colIndex}
              className={`absolute z-10 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-yellow-500/20 transition-colors'}`}
              style={{
                left: colIndex * cellSize,
                top: rowIndex * cellSize,
                width: cellSize,
                height: cellSize,
              }}
              onClick={() => !disabled && onCellClick({ row: rowIndex, col: colIndex })}
            >
              {cell && (
                <div
                  className={getCellClass(cell, rowIndex, colIndex)}
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: cellSize * 0.8,
                    height: cellSize * 0.8,
                    maxWidth: '32px',
                    maxHeight: '32px',
                    boxShadow: getBoxShadow(cell),
                  }}
                />
              )}
            </div>
          ))
        ))}
      </div>
    </div>
  );
};

export default Board;
