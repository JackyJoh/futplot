import { NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err: any) => {
  console.error('Unexpected pool error:', err);
});


export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }
) {
    try {
        // return specific player (defaults to closest player to name using ILIKE)
        const { name: playerName } = await params;
        
        const result = await pool.query(
        `SELECT * FROM players WHERE player ILIKE $1 LIMIT 1`,
        [`%${playerName}%`]);

        console.log('Query result:', result.rows);
        
        if (result.rows.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Player not found',
                data: null,
            },  { status: 404});
        }
        
        return NextResponse.json({
            success: true,
            data: result.rows[0], // Show metrics for player
        });

    } catch (error) {
        console.error('Database error details:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch player', details: error},
            { status: 500 }
        );
    }


}