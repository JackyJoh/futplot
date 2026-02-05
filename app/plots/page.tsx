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
  const [minXValue, setMinXValue] = useState<number>(0);
  const [minYValue, setMinYValue] = useState<number>(0);
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
    if (xValue < Math.max(minXValue, xPercentileThreshold)) return false;
    if (yValue < Math.max(minYValue, yPercentileThreshold)) return false;
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
  // 100% filter → show top 5%, 75% filter → show top 10%, 50% → top 15%, 25% → top 20%
  const labelPercentile = 95 - (100 - percentile) * 0.2;
  const labelThresholdX = xValues.length > 0 ? xValues[Math.floor(xValues.length * (labelPercentile / 100))] : 0;
  const labelThresholdY = yValues.length > 0 ? yValues[Math.floor(yValues.length * (labelPercentile / 100))] : 0;

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden flex flex-col">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] animate-[gridMove_20s_linear_infinite] pointer-events-none" />
      
      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      {/* Header */}
      <div className="relative z-10 px-6 py-4 border-b border-cyan-400/20 backdrop-blur-sm bg-slate-900/20">
        <div className="flex items-center justify-between max-w-[2000px] mx-auto">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent font-mono tracking-tight">
              VISUALIZATIONS
            </h1>
            <p className="text-slate-400 font-mono text-xs mt-1">
              Interactive bubble chart • Explore player performance
            </p>
          </div>
          <Link 
            href="/" 
            className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-cyan-400/30 hover:border-cyan-400/60 rounded-lg transition-all duration-300 text-cyan-400 font-mono font-semibold backdrop-blur-sm text-sm"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex overflow-hidden">
        {/* Left Sidebar - Filters */}
        <div className="w-80 border-r border-cyan-400/20 backdrop-blur-sm bg-slate-900/20 p-6 overflow-y-auto flex-shrink-0">
          <div className="space-y-4">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-black tracking-tight mb-1">
                <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  FILTERS
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {filteredPlayers.length} of {players.length} players
              </p>
            </div>

            {/* Filter Controls */}
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
              <div className="space-y-4">
                {/* League Filter */}
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                    League
                  </label>
                  <select
                    value={league}
                    onChange={(e) => setLeague(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-600/50 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-400/50 transition-colors"
                  >
                    <option value="all">All Leagues</option>
                    {leagues.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                {/* Position Filter */}
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                    Position
                  </label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-600/50 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-400/50 transition-colors"
                  >
                    <option value="all">All Positions</option>
                    {positions.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Min Games Filter */}
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                    Min Games
                  </label>
                  <input
                    type="number"
                    value={minGames}
                    onChange={(e) => setMinGames(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-600/50 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-400/50 transition-colors"
                    min="0"
                  />
                </div>

                {/* Percentile Filter */}
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                    Top Percentile
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      value={percentile}
                      onChange={(e) => setPercentile(parseInt(e.target.value))}
                      className="flex-1"
                      min="0"
                      max="100"
                      step="5"
                    />
                    <span className="text-cyan-400 font-mono font-bold text-sm w-12 text-right">{percentile}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart Axes */}
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
              <h3 className="text-sm font-bold text-purple-400 font-mono mb-4 uppercase tracking-wider">Chart Axes</h3>
              <div className="space-y-4">
                {/* X Axis */}
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                    X-Axis
                  </label>
                  <select
                    value={xStat}
                    onChange={(e) => setXStat(e.target.value as keyof Player)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-600/50 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-400/50 transition-colors"
                  >
                    {statOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Y Axis */}
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                    Y-Axis
                  </label>
                  <select
                    value={yStat}
                    onChange={(e) => setYStat(e.target.value as keyof Player)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-600/50 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-400/50 transition-colors"
                  >
                    {statOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Size */}
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                    Bubble Size
                  </label>
                  <select
                    value={sizeStat}
                    onChange={(e) => setSizeStat(e.target.value as keyof Player)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-600/50 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-400/50 transition-colors"
                  >
                    {statOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Bubble Chart */}
        <div className="flex-1 backdrop-blur-sm bg-slate-900/10 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-cyan-400 font-mono text-lg animate-pulse">Loading data...</div>
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

        {/* Right Side - Empty space for future content */}
        <div className="flex-1 overflow-auto"></div>
      </div>
    </div>
  );
}
