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
  FWD: '#06b6d4',
  MID: '#8b5cf6',
  DEF: '#f43f5e',
  GK: '#fbbf24'
};

const OVERLAP_THRESHOLD = 12;
const MIN_HIT_RADIUS = 14;

export default function BubbleChart({
  players,
  xStat,
  yStat,
  sizeStat,
  medianX,
  medianY,
  top25PercentileX,
  top25PercentileY
}: BubbleChartProps) {
  const [hoveredBubble, setHoveredBubble] = useState<any>(null);
  const [clusterMenu, setClusterMenu] = useState<{ bubbles: any[]; x: number; y: number } | null>(null);
  const [pinnedPlayer, setPinnedPlayer] = useState<any>(null);

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
  const bubbles = players.map((player) => {
    const xVal = Number(player[xStat]) || 0;
    const yVal = Number(player[yStat]) || 0;
    const sizeVal = Number(player[sizeStat]) || 0;

    const x = (xVal / maxX) * (chartWidth - 2 * padding) + padding;
    const y = chartHeight - ((yVal / maxY) * (chartHeight - 2 * padding) + padding);
    const radius = Math.max(4, (sizeVal / maxSize) * 18 + 4);

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

  // Find all bubbles overlapping with a target bubble
  const getCluster = (target: any) => {
    return bubbles.filter(b => {
      const dx = b.x - target.x;
      const dy = b.y - target.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < (b.radius + target.radius + OVERLAP_THRESHOLD);
    });
  };

  // Pre-compute which bubble IDs belong to a cluster
  const clusteredIds = new Set<number>();

  for (const bubble of bubbles) {
    if (clusteredIds.has(bubble.id)) continue;
    const cluster = getCluster(bubble);
    if (cluster.length > 1) {
      cluster.forEach(b => clusteredIds.add(b.id));
    }
  }

  const dismissAll = () => {
    setClusterMenu(null);
    setPinnedPlayer(null);
    setHoveredBubble(null);
  };

  const handleBubbleClick = (bubble: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!clusteredIds.has(bubble.id)) return;
    const cluster = getCluster(bubble);
    setClusterMenu({ bubbles: cluster, x: bubble.x, y: bubble.y });
    setPinnedPlayer(null);
  };

  const handleClusterSelect = (bubble: any) => {
    setPinnedPlayer(bubble);
    setClusterMenu(null);
  };

  // Clear state when data/axes change
  useEffect(() => {
    dismissAll();
  }, [xStat, yStat, sizeStat, players.length]);

  // Format stat label
  const formatStatLabel = (stat: string) => {
    return stat.replace(/_/g, ' ').toUpperCase();
  };

  // Format number for display
  const formatNumber = (value: number) => {
    return value % 1 === 0 ? value : value.toFixed(1);
  };

  // Position an overlay next to an anchor point, offset by radius
  const getOverlayStyle = (anchorX: number, anchorY: number, anchorR: number, overlayWidth: number) => {
    const gap = 14;
    let left: number;
    if (anchorX + anchorR + gap + overlayWidth > chartWidth) {
      left = anchorX - anchorR - gap - overlayWidth;
    } else {
      left = anchorX + anchorR + gap;
    }
    let top = anchorY - 50;
    if (top < 0) top = 4;
    if (top + 220 > chartHeight + 40) top = chartHeight + 40 - 220;
    return { left: `${left}px`, top: `${top}px` };
  };

  // Show stat card for: pinned player (click), or hovered non-clustered bubble
  const hoveredSoloBubble = hoveredBubble && !clusteredIds.has(hoveredBubble.id) && !clusterMenu && !pinnedPlayer
    ? hoveredBubble
    : null;
  const displayBubble = pinnedPlayer || hoveredSoloBubble;

  const isOverlayActive = !!(clusterMenu || pinnedPlayer);

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-8">
      {/* SVG wrapper — w-fit so SVG coords map directly to absolute positioning */}
      <div className="relative w-fit mx-auto">
        <svg
          width={chartWidth}
          height={chartHeight}
          className="block overflow-visible"
          onClick={dismissAll}
        >
          {/* Invisible background to catch clicks on empty chart space */}
          <rect x={0} y={0} width={chartWidth} height={chartHeight} fill="transparent" />

          {/* Vertical grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(fraction => {
            const val = maxX * fraction;
            return (
              <g key={`v-${fraction}`}>
                <line
                  x1={fraction * (chartWidth - 2 * padding) + padding}
                  y1={padding}
                  x2={fraction * (chartWidth - 2 * padding) + padding}
                  y2={chartHeight - padding}
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="1"
                />
                <text
                  x={fraction * (chartWidth - 2 * padding) + padding}
                  y={chartHeight - padding + 20}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="11"
                  fontFamily="'IBM Plex Mono', monospace"
                  className="tabular-nums"
                >
                  {formatNumber(val)}
                </text>
              </g>
            );
          })}

          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(fraction => {
            const val = maxY * fraction;
            return (
              <g key={`h-${fraction}`}>
                <line
                  x1={padding}
                  y1={chartHeight - (fraction * (chartHeight - 2 * padding) + padding)}
                  x2={chartWidth - padding}
                  y2={chartHeight - (fraction * (chartHeight - 2 * padding) + padding)}
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="1"
                />
                <text
                  x={padding - 12}
                  y={chartHeight - (fraction * (chartHeight - 2 * padding) + padding) + 4}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="11"
                  fontFamily="'IBM Plex Mono', monospace"
                  className="tabular-nums"
                >
                  {formatNumber(val)}
                </text>
              </g>
            );
          })}

          {/* Axis labels */}
          <text
            x={chartWidth / 2}
            y={chartHeight - 15}
            textAnchor="middle"
            fill="#06b6d4"
            fontSize="12"
            fontWeight="600"
            fontFamily="'IBM Plex Mono', monospace"
            letterSpacing="1px"
          >
            {formatStatLabel(xStat as string)}
          </text>
          <text
            x={15}
            y={chartHeight / 2}
            textAnchor="middle"
            fill="#06b6d4"
            fontSize="12"
            fontWeight="600"
            fontFamily="'IBM Plex Mono', monospace"
            letterSpacing="1px"
            transform={`rotate(-90, 15, ${chartHeight / 2})`}
          >
            {formatStatLabel(yStat as string)}
          </text>

          {/* Median Lines */}
          {medianX !== undefined && medianX !== null && maxX > 0 && (
            <>
              <line
                x1={(medianX / maxX) * (chartWidth - 2 * padding) + padding}
                y1={padding}
                x2={(medianX / maxX) * (chartWidth - 2 * padding) + padding}
                y2={chartHeight - padding}
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.5"
              />
              <text
                x={(medianX / maxX) * (chartWidth - 2 * padding) + padding}
                y={padding - 10}
                textAnchor="middle"
                fill="#06b6d4"
                fontSize="10"
                fontWeight="600"
                fontFamily="'IBM Plex Mono', monospace"
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
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.5"
              />
              <text
                x={chartWidth - padding + 10}
                y={chartHeight - ((medianY / maxY) * (chartHeight - 2 * padding) + padding) + 4}
                textAnchor="start"
                fill="#06b6d4"
                fontSize="10"
                fontWeight="600"
                fontFamily="'IBM Plex Mono', monospace"
              >
                {formatNumber(medianY)}
              </text>
            </>
          )}

          {/* Bubbles */}
          {bubbles.map((bubble) => {
            const isInCluster = clusteredIds.has(bubble.id);
            const isHovered = hoveredBubble?.id === bubble.id;
            return (
              <g
                key={bubble.id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => {
                  if (!clusterMenu && !pinnedPlayer) setHoveredBubble(bubble);
                }}
                onMouseLeave={() => {
                  if (!clusterMenu && !pinnedPlayer) setHoveredBubble(null);
                }}
                onClick={(e) => handleBubbleClick(bubble, e)}
              >
                {/* Invisible larger hit area for easier clicking */}
                <circle
                  cx={bubble.x}
                  cy={bubble.y}
                  r={Math.max(bubble.radius, MIN_HIT_RADIUS)}
                  fill="transparent"
                />
                {/* Visible bubble */}
                <circle
                  cx={bubble.x}
                  cy={bubble.y}
                  r={bubble.radius}
                  fill={bubble.color}
                  fillOpacity={isHovered ? 0.4 : 0.15}
                  stroke={bubble.color}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  strokeOpacity={isHovered ? 1 : 0.8}
                />
              </g>
            );
          })}

          {/* Player name labels for top performers */}
          {bubbles.map((bubble) => {
            const isTop25X = top25PercentileX !== undefined && bubble.xVal >= top25PercentileX;
            const isTop25Y = top25PercentileY !== undefined && bubble.yVal >= top25PercentileY;

            if (isTop25X || isTop25Y) {
              return (
                <text
                  key={`label-${bubble.id}`}
                  x={bubble.x}
                  y={bubble.y + bubble.radius + 14}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="9"
                  fontWeight="500"
                  fontFamily="'IBM Plex Mono', monospace"
                  opacity="0.7"
                  style={{ pointerEvents: 'none' }}
                >
                  {bubble.player}
                </text>
              );
            }
            return null;
          })}
        </svg>

        {/* Full-screen backdrop to catch outside clicks when menu/card is active */}
        {isOverlayActive && (
          <div
            className="fixed inset-0 z-40"
            onClick={dismissAll}
          />
        )}

        {/* Cluster dropdown menu */}
        {clusterMenu && (
          <div
            className="absolute z-50 rounded-lg overflow-hidden"
            style={{
              ...getOverlayStyle(clusterMenu.x, clusterMenu.y, 20, 220),
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(16px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 border-b border-white/10">
              <span className="text-[10px] font-heading text-slate-400 uppercase tracking-wider">
                {clusterMenu.bubbles.length} overlapping players
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {clusterMenu.bubbles.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleClusterSelect(b)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: b.color }}
                  />
                  <span className="text-white truncate">{b.player}</span>
                  <span className="text-[10px] text-slate-500 ml-auto flex-shrink-0">{b.team}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Player stat card — hover for solo dots, click for clustered */}
        {displayBubble && !clusterMenu && (
          <div
            className="absolute backdrop-blur-xl rounded-lg p-4 z-50 pointer-events-none"
            style={{
              ...getOverlayStyle(displayBubble.x, displayBubble.y, displayBubble.radius, 220),
              background: 'rgba(15, 23, 42, 0.95)',
              border: `1px solid ${displayBubble.color}40`,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
              minWidth: '200px'
            }}
          >
            <div
              className="text-base font-heading font-semibold mb-1"
              style={{ color: displayBubble.color }}
            >
              {displayBubble.player}
            </div>

            <div className="text-xs text-slate-400 mb-3 font-body">
              {displayBubble.team} • {displayBubble.position}
            </div>

            <div className="space-y-2">
              {[
                { label: formatStatLabel(xStat as string), value: formatNumber(displayBubble.xVal), color: '#06b6d4' },
                { label: formatStatLabel(yStat as string), value: formatNumber(displayBubble.yVal), color: '#06b6d4' },
                { label: formatStatLabel(sizeStat as string), value: formatNumber(displayBubble.sizeVal), color: '#64748b' }
              ].map(stat => (
                <div
                  key={stat.label}
                  className="flex justify-between items-center py-1.5 border-b border-white/5"
                >
                  <span className="text-[10px] text-slate-400 font-heading uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <span
                    className="text-sm font-heading font-semibold tabular-nums"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 flex justify-center gap-6 flex-wrap">
        {Object.entries(positionColors).map(([pos, color]) => (
          <div key={pos} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                background: color,
                opacity: 0.3,
                border: `1.5px solid ${color}`
              }}
            />
            <span className="text-xs text-slate-400 font-heading font-medium">
              {pos}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
