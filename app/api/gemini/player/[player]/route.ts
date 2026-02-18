import { NextResponse } from 'next/server'
import { Pool } from '@neondatabase/serverless'
import { runGeminiPrompt } from '@/lib/gemini';
import { buildPlayerInsightPrompt } from '@/lib/prompts';
import { client } from '@/lib/redis';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

export async function GET(request: Request, { params }: { params: Promise<{ player: string }> }) {
    try {
        const { player: playerName } = await params;

        const result = await pool.query(
            `SELECT * FROM players WHERE player ILIKE $1 LIMIT 1`,
            [`%${playerName}%`]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Player not found' },
                { status: 404 }
            );
        }

        // check redis before calling AI
        const cacheKey = `player:${playerName}`;
        const cached = await client.get(cacheKey);

        if (cached) {
            return NextResponse.json(JSON.parse(cached));
        }


        const playerData = result.rows[0];
        const prompt = buildPlayerInsightPrompt(playerData);
        const geminiResult = await runGeminiPrompt(prompt);
        const rawText: string | undefined = geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
            return NextResponse.json(
                { success: false, error: 'No text in Gemini response' },
                { status: 502 }
            );
        }

        // Strip markdown fences and parse JSON
        const cleaned = rawText.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (
            typeof parsed.summary !== 'string' ||
            !Array.isArray(parsed.strengths) ||
            !Array.isArray(parsed.weaknesses) ||
            typeof parsed.playerType !== 'string' ||
            typeof parsed.rating !== 'number'
        ) {
            return NextResponse.json(
                { success: false, error: 'Invalid response shape from Gemini' },
                { status: 502 }
            );
        }

        const responseData = {
            player: playerData.player,
            team: playerData.team,
            league: playerData.league,
            position: playerData.position,
            summary: parsed.summary,
            strengths: parsed.strengths,
            weaknesses: parsed.weaknesses,
            playerType: parsed.playerType,
            rating: parsed.rating,
        };

        await client.set(cacheKey, JSON.stringify({ success: true, data: responseData }), { EX: 24 * 3600 }); // cache for a day

        return NextResponse.json({ success: true, data: responseData });

    } catch (error) {
        console.error('Gemini player insight error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch player analysis', details: error instanceof Error ? error.message : error },
            { status: 500 }
        );
    }
}
