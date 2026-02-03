import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ league: string,
                                    stat: string}> }
) {
    try {
        // return specific question based off id
        const { league, stat } = await params; // Await the params Promise

        // Use parameterized query and correct SQL syntax
        const result = await pool.query(
            `SELECT * FROM players WHERE league = $1 ORDER BY ${stat}`,
            [league]
        );
        console.log('Query result:', result.rows);


        return NextResponse.json({
            success: true,
            data: result,
            count: result.rows.length,
        });
    } catch (error) {
        console.error('Database error details:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch questions', details: error},
            { status: 500 }
        );
    }


}