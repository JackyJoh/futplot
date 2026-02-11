import { useQuery } from '@tanstack/react-query';
import { getMetric, AxisInsight } from '@/lib/metrics';
import columnDescriptions from '@/column_descriptions.json';

const fallbackInsights: Record<string, AxisInsight> = {
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

function buildPrompt(xStatId: string, yStatId: string): string {
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

interface GeminiAxisResponse {
  xPositive: string;
  xNegative: string;
  yPositive: string;
  yNegative: string;
}

async function fetchAxisInsights(
  xStatId: string,
  yStatId: string
): Promise<{ xInsight: AxisInsight; yInsight: AxisInsight }> {
  const prompt = buildPrompt(xStatId, yStatId);

  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  console.log('[useAxisInsights] Gemini raw response:', JSON.stringify(data, null, 2));

  const rawText: string = data.candidates?.[0]?.content?.parts?.[0]?.text;
  console.log('[useAxisInsights] Extracted text:', rawText);

  if (!rawText) {
    throw new Error('No text in Gemini response');
  }

  // Strip markdown code fences if present
  const cleaned = rawText.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
  console.log('[useAxisInsights] Parsed result:', cleaned);
  const parsed: GeminiAxisResponse = JSON.parse(cleaned);

  if (
    typeof parsed.xPositive !== 'string' ||
    typeof parsed.xNegative !== 'string' ||
    typeof parsed.yPositive !== 'string' ||
    typeof parsed.yNegative !== 'string'
  ) {
    throw new Error('Invalid Gemini response shape');
  }

  return {
    xInsight: { positive: parsed.xPositive, negative: parsed.xNegative },
    yInsight: { positive: parsed.yPositive, negative: parsed.yNegative },
  };
}

export function useAxisInsights(
  xStatId: string,
  yStatId: string
): { xInsight: AxisInsight | undefined; yInsight: AxisInsight | undefined } {
  const { data } = useQuery({
    queryKey: ['axis-insights', xStatId, yStatId],
    queryFn: () => fetchAxisInsights(xStatId, yStatId),
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
  });

  return {
    xInsight: data?.xInsight ?? fallbackInsights[xStatId],
    yInsight: data?.yInsight ?? fallbackInsights[yStatId],
  };
}
