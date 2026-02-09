'use client';

import React, { useState, useEffect } from 'react';
import { Player, MetricConfig, MetricType, AxisInsight } from '@/lib/metrics';

interface BubbleChartProps {
  players: Player[];
  xMetric: MetricConfig;
  yMetric: MetricConfig;
  sizeMetric: MetricConfig;
  medianX?: number;
  medianY?: number;
  top25PercentileX?: number;
  top25PercentileY?: number;
  xInsight?: AxisInsight;
  yInsight?: AxisInsight;
}

const positionColors: Record<string, string> = {
  FWD: '#06b6d4',
  MID: '#8b5cf6',
  DEF: '#f43f5e',
  GK: '#fbbf24'
};

const OVERLAP_THRESHOLD = 12;
const MIN_HIT_RADIUS = 14;

function getAxisRange(values: number[], type: MetricType, id?: string): { min: number; max: number } {
  // For stats that are always non-negative, set origin to 0
  const alwaysPositive = [
    'goals', 'assists', 'G+A', 'npG+A', 'xg', 'xa', 'np_goals', 'np_xg', 'shots', 'key_passes', 'minutes',
    'goals_per90', 'assists_per90', 'xg_per90', 'xa_per90', 'xg_chain', 'xg_buildup', 'minutes_per_match', 'shots/goals', 'keypasses/assists'
  ];
  if (type === 'raw' || (id && alwaysPositive.includes(id))) {
    return { min: 0, max: Math.max(...values, 1) };
  }
  const absMax = Math.max(
    Math.abs(Math.min(...values, 0)),
    Math.abs(Math.max(...values, 0)),
    0.1
  );
  return { min: -absMax, max: absMax };
}

export default function BubbleChart({
  players,
  xMetric,
  yMetric,
  sizeMetric,
  medianX,
  medianY,
  top25PercentileX,
  top25PercentileY,
  xInsight,
  yInsight
}: BubbleChartProps) {
  const [hoveredBubble, setHoveredBubble] = useState<any>(null);
  const [clusterMenu, setClusterMenu] = useState<{ bubbles: any[]; x: number; y: number } | null>(null);
  const [pinnedPlayer, setPinnedPlayer] = useState<any>(null);

  // Filter out players with zero values for conversion metrics
  const isConversionX = xMetric.id === 'keypasses/assists' || xMetric.id === 'shots/goals';
  const isConversionY = yMetric.id === 'keypasses/assists' || yMetric.id === 'shots/goals';
  const filteredPlayers = (isConversionX || isConversionY)
    ? players.filter(p => {
        if (isConversionX && xMetric.getValue(p) <= 0) return false;
        if (isConversionY && yMetric.getValue(p) <= 0) return false;
        return true;
      })
    : players;

  // Chart dimensions (viewBox coordinates — SVG scales to fill container)
  const chartWidth = 1200;
  const chartHeight = 700;
  const padding = { top: 40, right: 10, bottom: 50, left: 10 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Get stat values
  const xValues = filteredPlayers.map(p => xMetric.getValue(p));
  const yValues = filteredPlayers.map(p => yMetric.getValue(p));
  const sizeValues = filteredPlayers.map(p => sizeMetric.getValue(p));

  const xRange = getAxisRange(xValues, xMetric.type, xMetric.id);
  const yRange = getAxisRange(yValues, yMetric.type, yMetric.id);
  const maxSize = Math.max(...sizeValues, 1);

  // Scaling helpers
  const scaleX = (val: number) =>
    ((val - xRange.min) / (xRange.max - xRange.min)) * plotWidth + padding.left;

  const scaleY = (val: number) =>
    chartHeight - (((val - yRange.min) / (yRange.max - yRange.min)) * plotHeight + padding.bottom);

  // Calculate bubble positions and sizes
  const bubbles = filteredPlayers.map((player) => {
    const xVal = xMetric.getValue(player);
    const yVal = yMetric.getValue(player);
    const sizeVal = sizeMetric.getValue(player);

    const x = scaleX(xVal);
    const y = scaleY(yVal);
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
  }, [xMetric.id, yMetric.id, sizeMetric.id, players.length]);

  // Format number for display
  const formatNumber = (value: number) => {
    return value % 1 === 0 ? value : value.toFixed(1);
  };

  // Position an overlay next to an anchor point using percentages (viewBox-relative)
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
    return {
      left: `${(left / chartWidth) * 100}%`,
      top: `${(top / chartHeight) * 100}%`,
    };
  };

  // Show stat card for: pinned player (click), or hovered non-clustered bubble
  const hoveredSoloBubble = hoveredBubble && !clusteredIds.has(hoveredBubble.id) && !clusterMenu && !pinnedPlayer
    ? hoveredBubble
    : null;
  const displayBubble = pinnedPlayer || hoveredSoloBubble;

  const isOverlayActive = !!(clusterMenu || pinnedPlayer);

  // Grid values: 5 evenly spaced across axis range
  const xGridValues = [0, 0.25, 0.5, 0.75, 1].map(f => xRange.min + f * (xRange.max - xRange.min));
  const yGridValues = [0, 0.25, 0.5, 0.75, 1].map(f => yRange.min + f * (yRange.max - yRange.min));

  // Divider line config
  const xDividerValue = xMetric.type === 'differential' ? 0 : medianX;
  const yDividerValue = yMetric.type === 'differential' ? 0 : medianY;
  const xDividerLabel = xMetric.type === 'differential' ? '0' : (medianX !== undefined ? `MEDIAN: ${formatNumber(medianX)}` : '');
  const yDividerLabel = yMetric.type === 'differential' ? '0' : (medianY !== undefined ? `${formatNumber(medianY)}` : '');

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4 h-full flex flex-col">
      {/* SVG wrapper — responsive, fills available space */}
      <div className="relative w-full flex-1 min-h-0">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="block w-full h-full overflow-visible"
          onClick={dismissAll}
        >
          {/* Invisible background to catch clicks on empty chart space */}
          <rect x={0} y={0} width={chartWidth} height={chartHeight} fill="transparent" />

          {/* Vertical grid lines */}
          {xGridValues.map((val, i) => (
            <g key={`v-${i}`}>
              <line
                x1={scaleX(val)}
                y1={padding.top}
                x2={scaleX(val)}
                y2={chartHeight - padding.bottom}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="1"
              />
              <text
                x={scaleX(val)}
                y={chartHeight - padding.bottom + 20}
                textAnchor="middle"
                fill="#64748b"
                fontSize="11"
                fontFamily="'IBM Plex Mono', monospace"
                className="tabular-nums"
              >
                {formatNumber(val)}
              </text>
            </g>
          ))}

          {/* Horizontal grid lines */}
          {yGridValues.map((val, i) => (
            <g key={`h-${i}`}>
              <line
                x1={padding.left}
                y1={scaleY(val)}
                x2={chartWidth - padding.right}
                y2={scaleY(val)}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="1"
              />
              <text
                x={padding.left - 12}
                y={scaleY(val) + 4}
                textAnchor="end"
                fill="#64748b"
                fontSize="11"
                fontFamily="'IBM Plex Mono', monospace"
                className="tabular-nums"
              >
                {formatNumber(val)}
              </text>
            </g>
          ))}

          {/* Axis labels */}
          <text
            x={chartWidth / 2}
            y={chartHeight - 5}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="15"
            fontWeight="700"
            fontFamily="'IBM Plex Mono', monospace"
            letterSpacing="1.5px"
          >
            {xMetric.label.toUpperCase()}
          </text>
          <text
            x={4}
            y={chartHeight / 2}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="15"
            fontWeight="700"
            fontFamily="'IBM Plex Mono', monospace"
            letterSpacing="1.5px"
            transform={`rotate(-90, -10, ${chartHeight / 2 + 30})`}
          >
            {yMetric.label.toUpperCase()}
          </text>

          {/* Divider Lines (0-line for differential, median for raw) */}
          {xDividerValue !== undefined && xDividerValue !== null && (
            <>
              <line
                x1={scaleX(xDividerValue)}
                y1={padding.top}
                x2={scaleX(xDividerValue)}
                y2={chartHeight - padding.bottom}
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.5"
              />
              <text
                x={scaleX(xDividerValue)}
                y={padding.top - 10}
                textAnchor="middle"
                fill="#06b6d4"
                fontSize="10"
                fontWeight="600"
                fontFamily="'IBM Plex Mono', monospace"
              >
                {xDividerLabel}
              </text>
            </>
          )}
          {yDividerValue !== undefined && yDividerValue !== null && (
            <>
              <line
                x1={padding.left}
                y1={scaleY(yDividerValue)}
                x2={chartWidth - padding.right}
                y2={scaleY(yDividerValue)}
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.5"
              />
              <text
                x={chartWidth - padding.right + 10}
                y={scaleY(yDividerValue) + 4}
                textAnchor="start"
                fill="#06b6d4"
                fontSize="10"
                fontWeight="600"
                fontFamily="'IBM Plex Mono', monospace"
              >
                {yDividerLabel}
              </text>
            </>
          )}

          {/* Axis Insight Labels — placed on the ground (x) and left (y) axis lines */}
          {xInsight && (() => {
            const xMid = (padding.left + chartWidth - padding.right) / 2;
            return (
              <>
                <text
                  x={xMid + (chartWidth - padding.right - xMid) * 0.8}
                  y={chartHeight - padding.bottom - 10}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="500"
                  fontFamily="'IBM Plex Mono', monospace"
                  opacity="0.8"
                  letterSpacing="0.5px"
                  style={{ pointerEvents: 'none' }}
                >
                  {xInsight.positive} →
                </text>
                <text
                  x={padding.left + (xMid - padding.left) * 0.2}
                  y={chartHeight - padding.bottom - 10}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="500"
                  fontFamily="'IBM Plex Mono', monospace"
                  opacity="0.8"
                  letterSpacing="0.5px"
                  style={{ pointerEvents: 'none' }}
                >
                  ← {xInsight.negative}
                </text>
              </>
            );
          })()}
          {yInsight && (() => {
            const yMid = (padding.top + chartHeight - padding.bottom) / 2;
            const yPosLabel = padding.top + (yMid - padding.top) * 0.2;
            const yNegLabel = yMid + (chartHeight - padding.bottom - yMid) * 0.8;
            return (
              <>
                <text
                  x={padding.left + 8}
                  y={yPosLabel}
                  textAnchor="start"
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="500"
                  fontFamily="'IBM Plex Mono', monospace"
                  opacity="0.8"
                  letterSpacing="0.5px"
                  style={{ pointerEvents: 'none' }}
                >
                  ↑ {yInsight.positive}
                </text>
                <text
                  x={padding.left + 8}
                  y={yNegLabel}
                  textAnchor="start"
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="500"
                  fontFamily="'IBM Plex Mono', monospace"
                  opacity="0.8"
                  letterSpacing="0.5px"
                  style={{ pointerEvents: 'none' }}
                >
                  ↓ {yInsight.negative}
                </text>
              </>
            );
          })()}

          {/* Bubbles */}
          {bubbles.map((bubble) => {
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
            let showLabel = false;
            if (isConversionX && bubble.xVal > 0 && top25PercentileX !== undefined) {
              // Favor values closer to 0
              showLabel = Math.abs(bubble.xVal) <= Math.abs(top25PercentileX);
            }
            if (isConversionY && bubble.yVal > 0 && top25PercentileY !== undefined) {
              showLabel = showLabel || Math.abs(bubble.yVal) <= Math.abs(top25PercentileY);
            }
            // For other stats, show highest absolute values
            if (!isConversionX && top25PercentileX !== undefined && Math.abs(bubble.xVal) >= Math.abs(top25PercentileX)) {
              showLabel = true;
            }
            if (!isConversionY && top25PercentileY !== undefined && Math.abs(bubble.yVal) >= Math.abs(top25PercentileY)) {
              showLabel = true;
            }
            if (showLabel) {
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
                { label: xMetric.label, value: formatNumber(displayBubble.xVal), color: '#06b6d4' },
                { label: yMetric.label, value: formatNumber(displayBubble.yVal), color: '#06b6d4' },
                { label: sizeMetric.label, value: formatNumber(displayBubble.sizeVal), color: '#64748b' }
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
      <div className="mt-3 flex-shrink-0 flex justify-center gap-6 flex-wrap">
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
