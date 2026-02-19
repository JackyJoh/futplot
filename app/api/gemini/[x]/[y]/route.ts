import { NextResponse } from 'next/server';
import { getMetricId } from '@/lib/metrics';
import { buildAxisInsightsPrompt } from '@/lib/prompts';
import { runGeminiPrompt } from '@/lib/gemini';
import { client } from '@/lib/redis';
 
// Abstract the prompt building for the gemini api call
export async function GET(request: Request, { params }: { params: Promise<{ x: string, y: string }> }) {
    try {

        


        // build prompt
        const { x, y } = await params;

        // check redis for cached params before building
        const cacheKey = `params:${x}:${y}`;
        const cached = await client.get(cacheKey);

        if (cached) {
            return NextResponse.json(JSON.parse(cached));
        }

        const xID = getMetricId(x);
        const yID = getMetricId(y);

        if (!xID || !yID) {
            return NextResponse.json(
                { success: false, error: 'Invalid metric id(s)', details: { xID, yID } },
                { status: 400 }
            );
        }
        const prompt = buildAxisInsightsPrompt(xID, yID);

        // send to gemini and parse response
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
            typeof parsed.xPositive !== 'string' ||
            typeof parsed.xNegative !== 'string' ||
            typeof parsed.yPositive !== 'string' ||
            typeof parsed.yNegative !== 'string'
        ) {
            return NextResponse.json(
                { success: false, error: 'Invalid response shape from Gemini' },
                { status: 502 }
            );
        }

        const responseData = {
            xPositive: parsed.xPositive,
            xNegative: parsed.xNegative,
            yPositive: parsed.yPositive,
            yNegative: parsed.yNegative,
        };

        await client.set(cacheKey, JSON.stringify({ success: true, data: responseData }), { EX: 7 * 24 * 3600 }); // cache for a week

        return NextResponse.json({ success: true, data: responseData });

    } catch (error) {
        console.error('Gemini error details:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch insights', details: error instanceof Error ? error.message : error },
            { status: 500 }
        );
    }
}