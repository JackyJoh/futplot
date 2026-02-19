/**
 * Prewarm script — run after scraper.py to flush player cache and pre-warm top 10 by G+A.
 * Usage: npx tsx scripts/prewarm.ts
 */

import { createClient } from 'redis';
import { Pool } from '@neondatabase/serverless';
import { runGeminiPrompt } from '../lib/gemini';
import { buildPlayerInsightPrompt } from '../lib/prompts';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    const redis = createClient({ url: process.env.REDIS_URL });
    redis.on('error', (err) => console.error('Redis error:', err));
    await redis.connect();

    console.log('='.repeat(50));
    console.log('FutPlot Cache Prewarm');
    console.log('='.repeat(50));

    // Flush all player cache entries
    const keys = await redis.keys('player:*');
    if (keys.length > 0) {
        await redis.del(keys);
        console.log(`\nFlushed ${keys.length} cached player entries`);
    } else {
        console.log('\nNo existing player cache to flush');
    }

    // Top 10 players by G+A
    const result = await pool.query(`SELECT * FROM players ORDER BY "G+A" DESC LIMIT 10`);
    console.log(`\nPre-warming top ${result.rows.length} players by G+A:\n`);

    let succeeded = 0;
    for (const playerData of result.rows) {
        const cacheKey = `player:${playerData.player}`;
        try {
            const prompt = buildPlayerInsightPrompt(playerData);
            const geminiResult = await runGeminiPrompt(prompt);
            const rawText: string | undefined = geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!rawText) throw new Error('No text from Gemini');

            const cleaned = rawText.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
            const parsed = JSON.parse(cleaned);

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

            await redis.set(cacheKey, JSON.stringify({ success: true, data: responseData }), { EX: 7 * 24 * 3600 });
            console.log(`  ✓ ${playerData.player} (${playerData.team})`);
            succeeded++;
        } catch (err: any) {
            console.error(`  ✗ ${playerData.player} — ${err.message}`);
        }

        // Delay between calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    await redis.disconnect();
    await pool.end();

    console.log(`\nDone: ${succeeded}/${result.rows.length} players cached`);
    console.log('='.repeat(50));
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
