import { memo } from 'react';

/**
 * Debug Ruler Background
 * Shows horizontal lines every 2% with labels to help measure sprite foot positions
 */
export const DebugRulerBackground = memo(() => {
  // Generate lines from 0% to 40% from bottom (where animals walk)
  const lines = [];
  for (let i = 0; i <= 40; i += 2) {
    lines.push(i);
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-gray-200">
      {/* Grid lines */}
      {lines.map((percent) => (
        <div
          key={percent}
          className="absolute w-full flex items-center"
          style={{
            bottom: `${percent}%`,
            height: '1px',
          }}
        >
          {/* Line */}
          <div
            className="w-full h-px"
            style={{
              backgroundColor: percent % 10 === 0 ? '#ff0000' : percent % 5 === 0 ? '#0066ff' : '#999',
              height: percent % 10 === 0 ? '2px' : '1px',
            }}
          />
          {/* Label */}
          <div
            className="absolute left-2 px-1 text-xs font-mono"
            style={{
              backgroundColor: 'white',
              color: percent % 10 === 0 ? '#ff0000' : percent % 5 === 0 ? '#0066ff' : '#666',
              fontWeight: percent % 10 === 0 ? 'bold' : 'normal',
              transform: 'translateY(-50%)',
            }}
          >
            {percent}%
          </div>
          {/* Right label */}
          <div
            className="absolute right-2 px-1 text-xs font-mono"
            style={{
              backgroundColor: 'white',
              color: percent % 10 === 0 ? '#ff0000' : percent % 5 === 0 ? '#0066ff' : '#666',
              fontWeight: percent % 10 === 0 ? 'bold' : 'normal',
              transform: 'translateY(-50%)',
            }}
          >
            {percent}%
          </div>
        </div>
      ))}

      {/* Ground level indicator for Meadow (16.15%) */}
      <div
        className="absolute w-full"
        style={{
          bottom: '16.15%',
          height: '3px',
          backgroundColor: '#00ff00',
        }}
      >
        <div
          className="absolute left-1/2 -translate-x-1/2 px-2 py-1 text-xs font-bold font-mono bg-green-500 text-white rounded"
          style={{ transform: 'translate(-50%, -100%)' }}
        >
          GROUND: 16.15%
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded text-sm font-mono text-center">
        <div>DEBUG MODE - Measuring foot positions</div>
        <div className="text-xs mt-1 text-gray-300">Green line = ground level (16.15%)</div>
        <div className="text-xs text-gray-300">Red = 10%, Blue = 5%, Gray = 2%</div>
      </div>
    </div>
  );
});

DebugRulerBackground.displayName = 'DebugRulerBackground';
