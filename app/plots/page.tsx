'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import BubbleChart from '@/components/BubbleChart';
import Link from 'next/link';
import { Player, rawMetrics, axisMetrics, getMetric, AxisInsight } from '@/lib/metrics';

export default function PlotsPage() {
  const [league, setLeague] = useState<string>('all');
  const [position, setPosition] = useState<string>('FWD+MID');
  const [minGames, setMinGames] = useState<number>(5);
  const [topCount, setTopCount] = useState<number>(50);
  const [xStatId, setXStatId] = useState<string>('goals_minus_xg');
  const [yStatId, setYStatId] = useState<string>('assists_minus_xa');
  const [sizeStatId, setSizeStatId] = useState<string>('minutes');

  const xMetric = getMetric(xStatId);
  const yMetric = getMetric(yStatId);
  const sizeMetric = getMetric(sizeStatId);

  // Temp hardcoded insights — will be replaced by Gemini API call
  const tempInsights: Record<string, AxisInsight> = {
    'goals_minus_xg': { positive: 'Clinical', negative: 'Wasteful' },
    'assists_minus_xa': { positive: 'Creative', negative: 'Underperforming' },
    'npgoals_minus_npxg': { positive: 'Clinical', negative: 'Wasteful' },
    'gper90_minus_xgper90': { positive: 'Clinical', negative: 'Wasteful' },
    'aper90_minus_xaper90': { positive: 'Creative', negative: 'Underperforming' },
    'npga_minus_npxgxa': { positive: 'Overperforming', negative: 'Underperforming' },
    'xg_minus_xa': { positive: 'Goal Threat', negative: 'Playmaker' },
    'goals_minus_assists': { positive: 'Scorer', negative: 'Provider' },
    'shots/goals': { positive: 'Inefficient', negative: 'Efficient' },
    'keypasses/assists': { positive: 'Unlucky', negative: 'Efficient' },
    'minutes_per_match': { positive: 'Starter', negative: 'Rotation' },
  };

  const xInsight = tempInsights[xStatId];
  const yInsight = tempInsights[yStatId];

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

  // Limit to top N players by sum of absolute values of core stats used in axis metrics
  function getCoreStatsSum(player: Player) {
    const coreStats: Record<string, [string, string]> = {
      'goals_minus_xg': ['goals', 'xg'],
      'assists_minus_xa': ['assists', 'xa'],
      'npgoals_minus_npxg': ['np_goals', 'np_xg'],
      'gper90_minus_xgper90': ['goals_per90', 'xg_per90'],
      'aper90_minus_xaper90': ['assists_per90', 'xa_per90'],
      'npga_minus_npxgxa': ['npG+A', 'np_xg'],
      'xg_minus_xa': ['xg', 'xa'],
      'goals_minus_assists': ['goals', 'assists'],
    };
    const xStats = coreStats[xStatId] || [];
    const yStats = coreStats[yStatId] || [];
    const allStats = [...xStats, ...yStats];
    // Only include stat keys that exist on Player
    const playerKeys = Object.keys(player) as (keyof Player)[];
    return allStats
      .filter((stat): stat is keyof Player => playerKeys.includes(stat as keyof Player))
      .reduce((sum, stat) => sum + Math.abs(Number(player[stat as keyof Player]) || 0), 0);
  }

  const topPlayers = [...baseFilteredPlayers]
    .sort((a, b) => getCoreStatsSum(b) - getCoreStatsSum(a))
    .slice(0, topCount);

  const leagues = ['ENG-Premier League', 'ESP-La Liga', 'GER-Bundesliga', 'ITA-Serie A', 'FRA-Ligue 1'];
  const positions = ['FWD', 'MID', 'FWD+MID', 'DEF', 'GK'];

  // Calculate median values for reference lines
  const xValues = baseFilteredPlayers.map(p => xMetric.getValue(p)).sort((a, b) => a - b);
  const yValues = baseFilteredPlayers.map(p => yMetric.getValue(p)).sort((a, b) => a - b);
  const medianX = xValues.length > 0 ? xValues[Math.floor(xValues.length / 2)] : 0;
  const medianY = yValues.length > 0 ? yValues[Math.floor(yValues.length / 2)] : 0;

  const isConversionX = xMetric.id === 'shots/goals' || xMetric.id === 'keypasses/assists';
  const isConversionY = yMetric.id === 'shots/goals' || yMetric.id === 'keypasses/assists';

  // For conversion metrics, use 10th percentile (closer to 0 is better)
  // For other stats, use 95th percentile (higher is better)
  const labelThresholdX = xValues.length > 0
    ? (isConversionX
        ? xValues[Math.floor(xValues.length * 0.60)]
        : xValues[Math.floor(xValues.length * 0.93)])
    : 0;
  const labelThresholdY = yValues.length > 0
    ? (isConversionY
        ? yValues[Math.floor(yValues.length * 0.60)]
        : yValues[Math.floor(yValues.length * 0.93)])
    : 0;

  return (
    <div className="h-screen flex flex-col bg-[#1a1f3a] text-white overflow-hidden">
      {/* Header */}
      <header className="border-b border-white/10 flex-shrink-0 bg-[#1a1f3a]/95 backdrop-blur-sm">
        <div className="px-6 py-3 flex justify-between items-center">
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
      <div className="flex-1 min-h-0 px-6 py-4">
        <div className="flex gap-6 h-full">
          {/* Left Sidebar - Filters */}
          <aside className="w-56 flex-shrink-0 space-y-6 overflow-y-auto">
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

            {/* Top N Filter */}
            <div>
              <h3 className="text-xs font-heading font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Top Players
              </h3>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  value={topCount}
                  onChange={(e) => setTopCount(parseInt(e.target.value))}
                  className="flex-1"
                  min="5"
                  max="100"
                  step="1"
                />
                <span className="text-cyan-400 font-heading font-bold text-sm w-12 text-right tabular-nums">
                  {topCount}
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
                    value={xStatId}
                    onChange={(e) => setXStatId(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                  >
                    {axisMetrics.map(m => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>

                {/* Y Axis */}
                <div>
                  <label className="block text-xs text-slate-500 mb-2 uppercase tracking-wider">
                    Y-Axis
                  </label>
                  <select
                    value={yStatId}
                    onChange={(e) => setYStatId(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                  >
                    {axisMetrics.map(m => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>

                {/* Size — raw metrics only */}
                <div>
                  <label className="block text-xs text-slate-500 mb-2 uppercase tracking-wider">
                    Bubble Size
                  </label>
                  <select
                    value={sizeStatId}
                    onChange={(e) => setSizeStatId(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                  >
                    {rawMetrics.map(m => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="pt-6 border-t border-white/10">
              <p className="text-xs text-slate-400">
                {baseFilteredPlayers.length} of {players.length} players
              </p>
            </div>
          </aside>

          {/* Center - Bubble Chart */}
          <div className="flex-1 min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-96 bg-white/5 rounded-lg border border-white/10">
                <div className="flex flex-col items-center">
                  <div className="inline-block animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mb-4"></div>
                  <p className="text-slate-400">Loading data...</p>
                </div>
              </div>
            ) : (
              <BubbleChart
                players={topPlayers}
                xMetric={xMetric}
                yMetric={yMetric}
                sizeMetric={sizeMetric}
                medianX={medianX}
                medianY={medianY}
                top25PercentileX={labelThresholdX}
                top25PercentileY={labelThresholdY}
                xInsight={xInsight}
                yInsight={yInsight}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
