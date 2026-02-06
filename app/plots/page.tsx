'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import BubbleChart from '@/components/BubbleChart';
import Link from 'next/link';

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

const statOptions = [
  { value: 'goals', label: 'Goals' },
  { value: 'assists', label: 'Assists' },
  { value: 'G+A', label: 'G+A' },
  { value: 'npG+A', label: 'npG+A' },
  { value: 'xg', label: 'xG' },
  { value: 'xa', label: 'xA' },
  { value: 'np_goals', label: 'Non-Penalty Goals' },
  { value: 'np_xg', label: 'Non-Penalty xG' },
  { value: 'shots', label: 'Shots' },
  { value: 'key_passes', label: 'Key Passes' },
  { value: 'minutes', label: 'Minutes' },
  { value: 'goals_per90', label: 'Goals per 90' },
  { value: 'assists_per90', label: 'Assists per 90' },
  { value: 'xg_per90', label: 'xG per 90' },
  { value: 'xa_per90', label: 'xA per 90' },
  { value: 'xg_chain', label: 'xG Chain' },
  { value: 'xg_buildup', label: 'xG Buildup' },
];

export default function PlotsPage() {
  const [league, setLeague] = useState<string>('all');
  const [position, setPosition] = useState<string>('FWD');
  const [minGames, setMinGames] = useState<number>(5);
  const [percentile, setPercentile] = useState<number>(75);
  const [xStat, setXStat] = useState<keyof Player>('xg');
  const [yStat, setYStat] = useState<keyof Player>('xa');
  const [sizeStat, setSizeStat] = useState<keyof Player>('minutes');

  const { data: players = [], isLoading } = useQuery<Player[]>({
    queryKey: ['players', 'v2'],
    queryFn: async () => {
      const res = await fetch('/api/players');
      if (!res.ok) throw new Error('Failed to fetch players');
      return res.json();
    },
    staleTime: 30 * 60 * 1000,
  });

  // Filter players
  const baseFilteredPlayers = players.filter(player => {
    if (league !== 'all' && player.league !== league) return false;
    if (position === 'FWD+MID') {
      if (player.position !== 'FWD' && player.position !== 'MID') return false;
    } else if (position !== 'all' && player.position !== position) {
      return false;
    }
    if (player.matches < minGames) return false;
    return true;
  });

  // Calculate percentile thresholds
  const xValuesForPercentile = baseFilteredPlayers.map(p => Number(p[xStat]) || 0).sort((a, b) => a - b);
  const yValuesForPercentile = baseFilteredPlayers.map(p => Number(p[yStat]) || 0).sort((a, b) => a - b);
  const percentileIndex = Math.floor(xValuesForPercentile.length * (1 - percentile / 100));
  const xPercentileThreshold = xValuesForPercentile.length > 0 ? xValuesForPercentile[percentileIndex] : 0;
  const yPercentileThreshold = yValuesForPercentile.length > 0 ? yValuesForPercentile[percentileIndex] : 0;

  // Apply all filters including percentile
  const filteredPlayers = baseFilteredPlayers.filter(player => {
    const xValue = Number(player[xStat]) || 0;
    const yValue = Number(player[yStat]) || 0;
    if (xValue < xPercentileThreshold) return false;
    if (yValue < yPercentileThreshold) return false;
    return true;
  });

  const leagues = ['ENG-Premier League', 'ESP-La Liga', 'GER-Bundesliga', 'ITA-Serie A', 'FRA-Ligue 1'];
  const positions = ['FWD', 'MID', 'FWD+MID', 'DEF', 'GK'];

  // Calculate median values for reference lines
  const xValues = filteredPlayers.map(p => Number(p[xStat]) || 0).sort((a, b) => a - b);
  const yValues = filteredPlayers.map(p => Number(p[yStat]) || 0).sort((a, b) => a - b);
  const medianX = xValues.length > 0 ? xValues[Math.floor(xValues.length / 2)] : 0;
  const medianY = yValues.length > 0 ? yValues[Math.floor(yValues.length / 2)] : 0;

  // Calculate dynamic label threshold
  const labelPercentile = 95 - (100 - percentile) * 0.2;
  const labelThresholdX = xValues.length > 0 ? xValues[Math.floor(xValues.length * (labelPercentile / 100))] : 0;
  const labelThresholdY = yValues.length > 0 ? yValues[Math.floor(yValues.length * (labelPercentile / 100))] : 0;

  return (
    <div className="min-h-screen bg-[#1a1f3a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 sticky top-0 z-50 bg-[#1a1f3a]/95 backdrop-blur-sm">
        <div className="px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">
              FutPlot
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">Data Visualizations</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-6 py-8">
        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <aside className="w-56 flex-shrink-0 space-y-6">
            {/* League Filter */}
            <div>
              <h3 className="text-xs font-heading font-semibold text-slate-400 uppercase tracking-wider mb-3">
                League
              </h3>
              <select
                value={league}
                onChange={(e) => setLeague(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
              >
                <option value="all">All Leagues</option>
                {leagues.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* Position Filter */}
            <div>
              <h3 className="text-xs font-heading font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Position
              </h3>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
              >
                <option value="all">All Positions</option>
                {positions.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Min Games Filter */}
            <div>
              <h3 className="text-xs font-heading font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Min Games
              </h3>
              <input
                type="number"
                value={minGames}
                onChange={(e) => setMinGames(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                min="0"
              />
            </div>

            {/* Percentile Filter */}
            <div>
              <h3 className="text-xs font-heading font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Top Percentile
              </h3>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  value={percentile}
                  onChange={(e) => setPercentile(parseInt(e.target.value))}
                  className="flex-1"
                  min="0"
                  max="100"
                  step="5"
                />
                <span className="text-cyan-400 font-heading font-bold text-sm w-12 text-right tabular-nums">
                  {percentile}%
                </span>
              </div>
            </div>

            {/* Chart Axes */}
            <div className="pt-6 border-t border-white/10">
              <h3 className="text-xs font-heading font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Chart Axes
              </h3>
              <div className="space-y-4">
                {/* X Axis */}
                <div>
                  <label className="block text-xs text-slate-500 mb-2 uppercase tracking-wider">
                    X-Axis
                  </label>
                  <select
                    value={xStat}
                    onChange={(e) => setXStat(e.target.value as keyof Player)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                  >
                    {statOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Y Axis */}
                <div>
                  <label className="block text-xs text-slate-500 mb-2 uppercase tracking-wider">
                    Y-Axis
                  </label>
                  <select
                    value={yStat}
                    onChange={(e) => setYStat(e.target.value as keyof Player)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                  >
                    {statOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Size */}
                <div>
                  <label className="block text-xs text-slate-500 mb-2 uppercase tracking-wider">
                    Bubble Size
                  </label>
                  <select
                    value={sizeStat}
                    onChange={(e) => setSizeStat(e.target.value as keyof Player)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                  >
                    {statOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="pt-6 border-t border-white/10">
              <p className="text-xs text-slate-400">
                {filteredPlayers.length} of {players.length} players
              </p>
            </div>
          </aside>

          {/* Center - Bubble Chart */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-96 bg-white/5 rounded-lg border border-white/10">
                <div className="flex flex-col items-center">
                  <div className="inline-block animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mb-4"></div>
                  <p className="text-slate-400">Loading data...</p>
                </div>
              </div>
            ) : (
              <BubbleChart
                players={filteredPlayers}
                xStat={xStat}
                yStat={yStat}
                sizeStat={sizeStat}
                medianX={medianX}
                medianY={medianY}
                top25PercentileX={labelThresholdX}
                top25PercentileY={labelThresholdY}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
