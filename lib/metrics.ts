export interface Player {
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

export interface AxisInsight {
  positive: string; // label for high/positive end (e.g. "Clinical")
  negative: string; // label for low/negative end (e.g. "Wasteful")
}

export type MetricType = 'raw' | 'differential';

export interface MetricConfig {
  id: string;
  label: string;
  type: MetricType;
  getValue: (p: Player) => number;
}

export const rawMetrics: MetricConfig[] = [
  { id: 'goals', label: 'Goals', type: 'raw', getValue: (p) => p.goals },
  { id: 'assists', label: 'Assists', type: 'raw', getValue: (p) => p.assists },
  { id: 'G+A', label: 'G+A', type: 'raw', getValue: (p) => p['G+A'] },
  { id: 'npG+A', label: 'npG+A', type: 'raw', getValue: (p) => p['npG+A'] },
  { id: 'xg', label: 'xG', type: 'raw', getValue: (p) => p.xg },
  { id: 'xa', label: 'xA', type: 'raw', getValue: (p) => p.xa },
  { id: 'np_goals', label: 'Non-Penalty Goals', type: 'raw', getValue: (p) => p.np_goals },
  { id: 'np_xg', label: 'Non-Penalty xG', type: 'raw', getValue: (p) => p.np_xg },
  { id: 'shots', label: 'Shots', type: 'raw', getValue: (p) => p.shots },
  { id: 'key_passes', label: 'Key Passes', type: 'raw', getValue: (p) => p.key_passes },
  { id: 'minutes', label: 'Minutes', type: 'raw', getValue: (p) => p.minutes },
  { id: 'goals_per90', label: 'Goals per 90', type: 'raw', getValue: (p) => p.goals_per90 },
  { id: 'assists_per90', label: 'Assists per 90', type: 'raw', getValue: (p) => p.assists_per90 },
  { id: 'xg_per90', label: 'xG per 90', type: 'raw', getValue: (p) => p.xg_per90 },
  { id: 'xa_per90', label: 'xA per 90', type: 'raw', getValue: (p) => p.xa_per90 },
  { id: 'xg_chain', label: 'xG Chain', type: 'raw', getValue: (p) => p.xg_chain },
  { id: 'xg_buildup', label: 'xG Buildup', type: 'raw', getValue: (p) => p.xg_buildup },
  { id : 'matches', label: 'Matches', type: 'raw', getValue: (p) => p.matches},
];

export const differentialMetrics: MetricConfig[] = [
    {
      id: 'shots/goals',
      label: 'Shots / G',
      type: 'differential',
      getValue: (p) => p.goals> 0 ? p.shots / p.goals : 0,
    },
    {
      id: 'keypasses/assists',
      label: 'KP / A',
      type: 'differential',
      getValue: (p) => p.assists > 0 ? p.key_passes / p.assists : 0,
    },
    {
      id: 'minutes_per_match',
      label: 'Minutes / Matches',
      type: 'differential',
      getValue: (p) => p.matches > 0 ? p.minutes / p.matches : 0,
    },
  {
    id: 'goals_minus_xg',
    label: 'G - xG',
    type: 'differential',
    getValue: (p) => p.goals - p.xg,
  },
  {
    id: 'assists_minus_xa',
    label: 'A - xA',
    type: 'differential',
    getValue: (p) => p.assists - p.xa,
  },
  {
    id: 'npgoals_minus_npxg',
    label: 'npG - npxG',
    type: 'differential',
    getValue: (p) => p.np_goals - p.np_xg,
  },
  {
    id: 'gper90_minus_xgper90',
    label: 'G/90 - xG/90',
    type: 'differential',
    getValue: (p) => p.goals_per90 - p.xg_per90,
  },
  {
    id: 'aper90_minus_xaper90',
    label: 'A/90 - xA/90',
    type: 'differential',
    getValue: (p) => p.assists_per90 - p.xa_per90,
  },
  {
    id: 'npga_minus_npxgxa',
    label: 'npG+A - npxG+xA',
    type: 'differential',
    getValue: (p) => p['npG+A'] - (p.np_xg + p.xa),
  },
  {
    id: 'xg_minus_xa',
    label: 'xG - xA',
    type: 'differential',
    getValue: (p) => p.xg - p.xa,
  },
  {
    id: 'goals_minus_assists',
    label: 'G - A',
    type: 'differential',
    getValue: (p) => p.goals - p.assists,
  },
];

// Only expose differential metrics for axis options
export const axisMetrics: MetricConfig[] = [...differentialMetrics];

// Keep all metrics for internal use
export const allMetrics: MetricConfig[] = [...rawMetrics, ...differentialMetrics];

export function getMetric(id: string): MetricConfig {
  const m = allMetrics.find(m => m.id === id);
  if (!m) throw new Error(`Unknown metric: ${id}`);
  return m;
}
