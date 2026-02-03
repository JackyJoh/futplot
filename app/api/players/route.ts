import { NextResponse } from 'next/server'
import { Pool } from 'pg'

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET(request: Request) {
  try {
    const result = await pool.query('SELECT * FROM players')
    
    // Convert numeric fields from strings to numbers
    const players = result.rows.map((row: any) => ({
      ...row,
      minutes: parseInt(row.minutes) || 0,
      goals: parseInt(row.goals) || 0,
      assists: parseInt(row.assists) || 0,
      xa: parseFloat(row.xa) || 0,
      xg: parseFloat(row.xg) || 0,
      goals_per90: parseFloat(row.goals_per90) || 0,
      assists_per90: parseFloat(row.assists_per90) || 0,
      xg_per90: parseFloat(row.xg_per90) || 0,
      xa_per90: parseFloat(row.xa_per90) || 0,
      shots: parseInt(row.shots) || 0,
      key_passes: parseInt(row.key_passes) || 0,
      xg_chain: parseFloat(row.xg_chain) || 0,
      xg_buildup: parseFloat(row.xg_buildup) || 0,
    }))
    
    return NextResponse.json(players)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch players',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
