import { getMetric } from '@/lib/metrics';
import columnDescriptions from '@/column_descriptions.json';

// Map each axis metric to the raw columns it's derived from
const metricComponents: Record<string, string[]> = {
  'goals_minus_xg': ['goals', 'xg'],
  'assists_minus_xa': ['assists', 'xa'],
  'npgoals_minus_npxg': ['np_goals', 'np_xg'],
  'gper90_minus_xgper90': ['goals_per90', 'xG_per90'],
  'aper90_minus_xaper90': ['assists_per90', 'xA_per90'],
  'npga_minus_npxgxa': ['npG+A', 'np_xg', 'xa'],
  'xg_minus_xa': ['xg', 'xa'],
  'goals_minus_assists': ['goals', 'assists'],
  'shots/goals': ['shots', 'goals'],
  'keypasses/assists': ['key_passes', 'assists'],
  'minutes_per_match': ['minutes', 'matches'],
};

function getRelevantDescriptions(statIds: string[]): string {
  const cols = columnDescriptions.columns as Record<string, string>;
  const seen = new Set<string>();
  const lines: string[] = [];

  for (const statId of statIds) {
    for (const col of metricComponents[statId] ?? []) {
      if (seen.has(col)) continue;
      seen.add(col);
      if (cols[col]) {
        lines.push(`- ${col}: ${cols[col]}`);
      }
    }
  }

  return lines.join('\n');
}

export function buildAxisInsightsPrompt(xStatId: string, yStatId: string): string {
  const xMetric = getMetric(xStatId);
  const yMetric = getMetric(yStatId);

  const relevantDescs = getRelevantDescriptions([xStatId, yStatId]);

  return `You are a football analytics expert. I have a scatter plot with two axes showing player statistics.

Relevant column descriptions:
${relevantDescs}

X-AXIS metric: "${xMetric.label}" (type: ${xMetric.type})
Y-AXIS metric: "${yMetric.label}" (type: ${yMetric.type})

For each axis, provide a SHORT descriptor (3 words max, shorter if possible) for the POSITIVE end (high/right/top) and NEGATIVE end (low/left/bottom). Use intuitive football terms.

Example: For "G - xG", positive = "Clinical", negative = "Wasteful".

Respond with ONLY valid JSON: {"xPositive":"...","xNegative":"...","yPositive":"...","yNegative":"..."}`;
}
