'use client';

import React, { useState, useEffect } from 'react';

interface Player {
  id: number;
  player: string;
  team: string;
  league: string;
  position: string;
  matches: number;
  minutes: number;
  goals: number;
  assists: number;
  xg: number;
  xa: number;
  np_goals: number;
  np_xg: number;
  penalties: number;
  shots: number;
  key_passes: number;
  xg_chain: number;
  xg_buildup: number;
  goals_per90: number;
  assists_per90: number;
  xg_per90: number;
  xa_per90: number;
  'G+A': number;
  'npG+A': number;
}

interface BubbleChartProps {
  players: Player[];
  xStat: keyof Player;
  yStat: keyof Player;
  sizeStat: keyof Player;
  colorBy?: 'position' | 'team';
  medianX?: number;
  medianY?: number;
  top25PercentileX?: number;
  top25PercentileY?: number;
}

const positionColors: Record<string, string> = {
  FWD: '#00d4ff',
  MID: '#a855f7',
  DEF: '#ff6b6b',
  GK: '#ffd93d'
};

export default function BubbleChart({ 
  players, 
  xStat, 
  yStat, 
  sizeStat,
  colorBy = 'position',
  medianX,
  medianY,
  top25PercentileX,
  top25PercentileY
}: BubbleChartProps) {
  const [hoveredBubble, setHoveredBubble] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(false);
    const timer = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(timer);
  }, [players, xStat, yStat, sizeStat]);

  // Chart dimensions
  const chartWidth = 1200;
  const chartHeight = 600;
  const padding = 80;

  // Get stat values
  const xValues = players.map(p => Number(p[xStat]) || 0);
  const yValues = players.map(p => Number(p[yStat]) || 0);
  const sizeValues = players.map(p => Number(p[sizeStat]) || 0);

  const maxX = Math.max(...xValues, 1);
  const maxY = Math.max(...yValues, 1);
  const maxSize = Math.max(...sizeValues, 1);

  // Calculate bubble positions and sizes
  const bubbles = players.map((player, index) => {
    const xVal = Number(player[xStat]) || 0;
    const yVal = Number(player[yStat]) || 0;
    const sizeVal = Number(player[sizeStat]) || 0;

    const x = isNaN(xVal / maxX) ? padding : (xVal / maxX) * (chartWidth - 2 * padding) + padding;
    const y = isNaN(yVal / maxY) ? chartHeight - padding : chartHeight - ((yVal / maxY) * (chartHeight - 2 * padding) + padding);
    const radius = Math.max(3, isNaN(sizeVal / maxSize) ? 5 : (sizeVal / maxSize) *20 + 3);
    
    const color = positionColors[player.position] || '#94a3b8';

    return { 
      ...player, 
      x, 
      y, 
      radius, 
      color,
      xVal,
      yVal,
      sizeVal
    };
  });

  // Format stat label
  const formatStatLabel = (stat: string) => {
    return stat.replace(/_/g, ' ').toUpperCase();
  };

  // Format number for display
  const formatNumber = (value: number) => {
    return value % 1 === 0 ? value : value.toFixed(1);
  };

  return (
    <div className="relative">
      <style jsx>{`
        @keyframes bubbleEnter {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="bg-gray-900/60 backdrop-blur-xl rounded-3xl p-10 border border-cyan-400/20 shadow-2xl">
        <svg
          width={chartWidth}
          height={chartHeight}
          className="block mx-auto overflow-visible"
        >
          <defs>
            <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.1"/>
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.1"/>
            </linearGradient>
            
            {bubbles.map(bubble => (
              <filter key={`glow-${bubble.id}`} id={`glow-${bubble.id}`}>
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            ))}
          </defs>

          {/* Vertical grid lines */}
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map(fraction => {
            const val = maxX * fraction;
            return (
              <g key={`v-${fraction}`}>
                <line
                  x1={fraction * (chartWidth - 2 * padding) + padding}
                  y1={padding}
                  x2={fraction * (chartWidth - 2 * padding) + padding}
                  y2={chartHeight - padding}
                  stroke="url(#gridGradient)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.3"
                />
                <text
                  x={fraction * (chartWidth - 2 * padding) + padding}
                  y={chartHeight - padding + 25}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="12"
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight="500"
                >
                  {formatNumber(val)}
                </text>
              </g>
            );
          })}

          {/* Horizontal grid lines */}
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map(fraction => {
            const val = maxY * fraction;
            return (
              <g key={`h-${fraction}`}>
                <line
                  x1={padding}
                  y1={chartHeight - (fraction * (chartHeight - 2 * padding) + padding)}
                  x2={chartWidth - padding}
                  y2={chartHeight - (fraction * (chartHeight - 2 * padding) + padding)}
                  stroke="url(#gridGradient)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.3"
                />
                <text
                  x={padding - 15}
                  y={chartHeight - (fraction * (chartHeight - 2 * padding) + padding) + 5}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="12"
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight="500"
                >
                  {formatNumber(val)}
                </text>
              </g>
            );
          })}

          {/* Axis labels */}
          <text
            x={chartWidth / 2}
            y={chartHeight - 10}
            textAnchor="middle"
            fill="#00d4ff"
            fontSize="14"
            fontWeight="700"
            fontFamily="'JetBrains Mono', monospace"
            letterSpacing="2px"
          >
            {formatStatLabel(xStat as string)}
          </text>
          <text
            x={20}
            y={chartHeight / 2}
            textAnchor="middle"
            fill="#a855f7"
            fontSize="14"
            fontWeight="700"
            fontFamily="'JetBrains Mono', monospace"
            letterSpacing="2px"
            transform={`rotate(-90, 20, ${chartHeight / 2})`}
          >
            {formatStatLabel(yStat as string)}
          </text>

          {/* Median Lines */}
          {medianX !== undefined && medianX !== null && maxX > 0 && (
            <>
              <line
                x1={(medianX / maxX) * (chartWidth - 2 * padding) + padding}
                y1={0}
                x2={(medianX / maxX) * (chartWidth - 2 * padding) + padding}
                y2={chartHeight - padding}
                stroke="#00d4ff"
                strokeWidth="3"
                strokeDasharray="8 4"
                opacity="0.7"
              />
              <text
                x={(medianX / maxX) * (chartWidth - 2 * padding) + padding}
                y={-10}
                textAnchor="middle"
                fill="#00d4ff"
                fontSize="11"
                fontWeight="700"
                fontFamily="'JetBrains Mono', monospace"
                style={{ background: 'rgba(0, 0, 0, 0.7)' }}
              >
                MEDIAN: {formatNumber(medianX)}
              </text>
            </>
          )}
          {medianY !== undefined && medianY !== null && maxY > 0 && (
            <>
              <line
                x1={padding}
                y1={chartHeight - ((medianY / maxY) * (chartHeight - 2 * padding) + padding)}
                x2={chartWidth - padding}
                y2={chartHeight - ((medianY / maxY) * (chartHeight - 2 * padding) + padding)}
                stroke="#a855f7"
                strokeWidth="3"
                strokeDasharray="8 4"
                opacity="0.7"
              />
              <text
                x={chartWidth - padding + 15}
                y={chartHeight - ((medianY / maxY) * (chartHeight - 2 * padding) + padding) + 5}
                textAnchor="start"
                fill="#a855f7"
                fontSize="12"
                fontWeight="700"
                fontFamily="'JetBrains Mono', monospace"
              >
                MEDIAN: {formatNumber(medianY)}
              </text>
            </>
          )}

          {/* Bubbles */}
          {bubbles.map((bubble, index) => (
            <g
              key={bubble.id}
              style={{
                cursor: 'pointer'
              }}
              onMouseEnter={() => setHoveredBubble(bubble)}
              onMouseLeave={() => setHoveredBubble(null)}
            >
              {/* Main bubble */}
              <circle
                cx={bubble.x}
                cy={bubble.y}
                r={bubble.radius}
                fill={bubble.color}
                fillOpacity={0.2}
                stroke={bubble.color}
                strokeWidth={2}
                strokeOpacity={1}
                style={{
                  cursor: 'pointer'
                }}
              />
            </g>
          ))}

          {/* Player name labels for top 25% performers */}
          {bubbles.map((bubble) => {
            const isTop25X = top25PercentileX !== undefined && bubble.xVal >= top25PercentileX;
            const isTop25Y = top25PercentileY !== undefined && bubble.yVal >= top25PercentileY;
            
            if (isTop25X || isTop25Y) {
              return (
                <text
                  key={`label-${bubble.id}`}
                  x={bubble.x}
                  y={bubble.y + bubble.radius + 12}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="9"
                  fontWeight="500"
                  fontFamily="'JetBrains Mono', monospace"
                  opacity="0.8"
                  style={{ pointerEvents: 'none' }}
                >
                  {bubble.player}
                </text>
              );
            }
            return null;
          })}
        </svg>

        {/* Tooltip */}
        {hoveredBubble && (
          <div 
            className="absolute backdrop-blur-xl rounded-lg p-3 z-50 pointer-events-none"
            style={{
              left: hoveredBubble.x > chartWidth - 250 
                ? `${hoveredBubble.x - hoveredBubble.radius - 195}px` 
                : `${hoveredBubble.x + hoveredBubble.radius + 105}px`,
              top: `${hoveredBubble.y - 60}px`,
              background: 'rgba(10, 14, 26, 0.95)',
              border: `2px solid ${hoveredBubble.color}`,
              boxShadow: `0 10px 20px rgba(0, 0, 0, 0.5), 0 0 20px ${hoveredBubble.color}40`,
              minWidth: '180px'
            }}
          >
            <div 
              className="text-sm font-bold mb-1 font-mono"
              style={{ color: hoveredBubble.color }}
            >
              {hoveredBubble.player}
            </div>
            
            <div className="text-xs text-slate-400 mb-2 font-mono">
              {hoveredBubble.team} • {hoveredBubble.position}
            </div>

            <div className="grid gap-1.5">
              {[
                { label: formatStatLabel(xStat as string), value: formatNumber(hoveredBubble.xVal), color: '#00d4ff' },
                { label: formatStatLabel(yStat as string), value: formatNumber(hoveredBubble.yVal), color: '#a855f7' },
                { label: formatStatLabel(sizeStat as string), value: formatNumber(hoveredBubble.sizeVal), color: '#ff6b6b' }
              ].map(stat => (
                <div 
                  key={stat.label} 
                  className="flex justify-between items-center p-1.5 bg-white/5 rounded border border-white/5"
                >
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">
                    {stat.label}
                  </span>
                  <span 
                    className="text-sm font-bold font-mono"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 flex justify-center gap-8 flex-wrap">
          {Object.entries(positionColors).map(([pos, color]) => (
            <div key={pos} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ background: color }}
              />
              <span className="text-sm text-slate-400 font-mono font-medium">
                {pos}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-white"/>
            </div>
            <span className="text-sm text-slate-400 font-mono font-medium">
              Size = {formatStatLabel(sizeStat as string)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
