import { NextResponse } from 'next/server'
import { Pool } from '@neondatabase/serverless'

// Cache for 24 hours (data updates weekly)
export const revalidate = 86400; // 24 hours in seconds

// Function to normalize position codes to simple categories
function normalizePosition(positionCode: string): string {
  const code = positionCode.trim().toUpperCase();
  
  // Goalkeeper
  if (code.includes('GK')) return 'GK';
  
  // Defenders - any position with D
  if (code.includes('D')) return 'DEF';
  
  // Forwards - any position with F but not D
  if (code.includes('F') && !code.includes('D')) return 'FWD';
  
  // Midfielders - any position with M, or just S
  if (code.includes('M') || code === 'S') return 'MID';
  
  // Default to MID for unknown positions
  return 'MID';
}

// Debug: Log if DATABASE_URL is loaded (without exposing the actual value)
console.log('DATABASE_URL loaded:', !!process.env.DATABASE_URL)

// Initialize PostgreSQL connection pool with Neon's serverless driver
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum pool size for concurrent connections
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return error after 5 seconds if unable to connect
})

// Test connection on startup
pool.on('error', (err: any) => {
  console.error('Unexpected pool error:', err)
})

export async function GET(request: Request) {
  try {
    console.log('Attempting database query...')
    
    // Optimized query - only select needed columns and add indexes
    const result = await pool.query(`
      SELECT 
        id, player, team, league, position, matches,
        minutes, goals, assists, xa, xg,
        np_goals, np_xg, penalties,
        goals_per90, assists_per90, xg_per90, xa_per90,
        shots, key_passes, xg_chain, xg_buildup
      FROM players
      ORDER BY goals DESC
    `)
    
    console.log('Query successful! Rows:', result.rows.length)
    
    // Convert numeric fields from strings to numbers and normalize positions
    const players = result.rows.map((row: any) => ({
      id: row.id,
      player: row.player,
      team: row.team,
      league: row.league,
      position: normalizePosition(row.position),
      matches: parseInt(row.matches) || 0,
      minutes: parseInt(row.minutes) || 0,
      goals: parseInt(row.goals) || 0,
      assists: parseInt(row.assists) || 0,
      xa: parseFloat(row.xa) || 0,
      xg: parseFloat(row.xg) || 0,
      np_goals: parseInt(row.np_goals) || 0,
      np_xg: parseFloat(row.np_xg) || 0,
      penalties: parseInt(row.penalties) || 0,
      goals_per90: parseFloat(row.goals_per90) || 0,
      assists_per90: parseFloat(row.assists_per90) || 0,
      xg_per90: parseFloat(row.xg_per90) || 0,
      xa_per90: parseFloat(row.xa_per90) || 0,
      shots: parseInt(row.shots) || 0,
      key_passes: parseInt(row.key_passes) || 0,
      xg_chain: parseFloat(row.xg_chain) || 0,
      xg_buildup: parseFloat(row.xg_buildup) || 0,
    }))
    
    // Return with aggressive cache headers (1 hour public cache, revalidate every 24 hours)
    return NextResponse.json(players, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
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
