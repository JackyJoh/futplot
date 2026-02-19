import { getMetric, Player } from '@/lib/metrics';
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

// AXIS PROMPT
export function buildAxisInsightsPrompt(xStatId: string, yStatId: string): string {
  const xMetric = getMetric(xStatId);
  const yMetric = getMetric(yStatId);

  const relevantDescs = getRelevantDescriptions([xStatId, yStatId]);

  return `You are a football analytics expert. I have a scatter plot with two axes showing player statistics.

Relevant column descriptions:
${relevantDescs}

X-AXIS metric: "${xMetric.label}" (type: ${xMetric.type})
Y-AXIS metric: "${yMetric.label}" (type: ${yMetric.type})

For each axis, provide a SHORT descriptor (3 words max, shorter if possible) for the POSITIVE end (high/right/top) and NEGATIVE end (low/left/bottom). Use intuitive football terms that reflect what the metric ACTUALLY measures — not just finishing quality.

Examples:
- "G - xG" (goals minus expected goals): positive = "Clinical", negative = "Wasteful" — this is about the SCORER's finishing quality.
- "A - xA" (assists minus expected assists): positive = "Clinical Teammates", negative = "Wasteful Teammates" — this reflects how well the SCORER converts the assistant's chances, NOT the assister's skill.
- "Minutes" or "Matches": positive = "Ever-Present", negative = "Fringe Player" — this is about availability/workload, not quality.

Match the descriptor to what the metric semantically means. Do NOT default to "Clinical/Wasteful" for non-finishing metrics.

Respond with ONLY valid JSON: {"xPositive":"...","xNegative":"...","yPositive":"...","yNegative":"..."}`;
}

// INDIVIDUAL PLAYER PROMPT

const playerStatKeys: (keyof Player)[] = [
  'matches', 'minutes', 'goals', 'assists', 'xg', 'xa',
  'np_goals', 'np_xg', 'penalties', 'shots', 'key_passes',
  'xg_chain', 'xg_buildup', 'goals_per90', 'assists_per90',
  'xg_per90', 'xa_per90', 'G+A', 'npG+A',
];

function formatPlayerStats(player: Player): string {
  const cols = columnDescriptions.columns as Record<string, string>;
  return playerStatKeys
    .map(key => {
      const val = player[key];
      const desc = cols[key] ?? key;
      return `- ${key} (${desc}): ${val}`;
    })
    .join('\n');
}

export function buildPlayerInsightPrompt(player: Player): string {
  const stats = formatPlayerStats(player);
  const per90Minutes = player.matches > 0 ? (player.minutes / player.matches).toFixed(0) : '0';
  const shotConversion = player.shots > 0 ? ((player.goals / player.shots) * 100).toFixed(1) : '0';
  const npxgOverperformance = (player.np_goals - player.np_xg).toFixed(2);
  const xaOverperformance = (player.assists - player.xa).toFixed(2);

  return `You are a football analytics expert. Analyze this player's current season so far and provide a sharp, insightful breakdown.

IMPORTANT: This is the 2025-26 season which may still be in progress. The player has ${player.matches} appearances and ${player.minutes} minutes so far. Judge output and volume relative to their sample size — don't treat a 10-match sample the same as a full season. Per-90 stats are more reliable with more minutes; flag small sample sizes where relevant.

PLAYER: ${player.player}
TEAM: ${player.team}
LEAGUE: ${player.league}
POSITION: ${player.position}

STATS (season to date):
${stats}

DERIVED:
- Minutes per match: ${per90Minutes}
- Shot conversion rate: ${shotConversion}%
- npG - npxG (finishing overperformance): ${npxgOverperformance}
- A - xA (creative overperformance): ${xaOverperformance}

Write a concise analysis (3-5 sentences) that covers the player's role, standout qualities, and areas of concern. Be opinionated — don't just restate numbers. Use football language, not data science jargon. Account for how far into the season the data reflects.

Respond with ONLY valid JSON:
{
  "summary": "3-5 sentence analysis of the player",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "playerType": "a 2-3 word label for their playing style (e.g. Clinical Poacher, Creative Playmaker, Box-to-Box Engine)",
  "rating": 1-100 rating relative to position (50 = average starter, 70 = quality starter, 85 = elite, 95+ = Ballon d'Or contender). Be strict — most players should fall between 40-75.
}`;
}
