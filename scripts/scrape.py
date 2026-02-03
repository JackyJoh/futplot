"""
FutPlot Data Scraper
====================
Scrapes player statistics from Understat for Top 5 European leagues
"""
import psycopg2
from psycopg2.extras import execute_batch
from dotenv import load_dotenv
import os
import pandas as pd
import soccerdata as sd
from datetime import datetime

load_dotenv()

def get_current_season():
    """Determine current football season (e.g., 2025 for 2025-26 season)"""
    now = datetime.now()
    return now.year - 1 if now.month < 7 else now.year


def scrape_player_data():
    """Scrape player stats from Understat for Top 5 leagues"""
    print("=" * 60)
    print("FutPlot Data Scraper")
    print("=" * 60)
    
    leagues = [
        'ENG-Premier League',
        'ESP-La Liga', 
        'GER-Bundesliga',
        'ITA-Serie A',
        'FRA-Ligue 1'
    ]
    season = get_current_season()
    
    print(f"\nSeason: {season}-{season + 1}")
    print(f"Leagues: {len(leagues)}")
    print("\n--- Fetching Data ---\n")
    
    # Initialize Understat scraper
    scraper = sd.Understat(leagues=leagues, seasons=str(season))
    
    try:
        # Fetch all player season stats at once
        df = scraper.read_player_season_stats()
        df = df.reset_index()
        
        print(f"✓ Fetched {len(df):,} players")
        print(f"✓ {len(df.columns)} columns")
        
        # Calculate derived metrics
        print("\n--- Calculating Metrics ---")
        df['90s'] = (df['minutes'] / 90).round(2)
        df['penalties'] = df['goals'] - df['np_goals']
        df['G+A'] = df['goals'] + df['assists']
        df['npG+A'] = df['np_goals'] + df['assists']
        
        # Per-90 stats (only for players with >90 minutes)
        df['goals_per90'] = ((df['goals'] / df['minutes']) * 90).round(3)
        df['assists_per90'] = ((df['assists'] / df['minutes']) * 90).round(3)
        df['xG_per90'] = ((df['xg'] / df['minutes']) * 90).round(3)
        df['xA_per90'] = ((df['xa'] / df['minutes']) * 90).round(3)
        
        print(f"✓ Added {4 + 4} calculated columns")
        
        return df
        
    except Exception as e:
        print(f"✗ Error fetching data: {str(e)}")
        return pd.DataFrame()

def connect_db():
    """Connect to Neon DB"""
    try:
        conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        print("Connected to DB")
        return conn
    except Exception as e:
        print(f"Database connection failed {e}")
        return None

def update_db(df):
    """Update Neon DB w player data"""
    conn = connect_db()
    if not conn:
        return False
    
    try:
        cursor =  conn.cursor()

        query = """
            INSERT INTO players (
                league, team, player, league_id, team_id, player_id, position,
                matches, minutes, goals, xg, np_goals, np_xg, penalties,
                assists, xa, "G+A", "npG+A", shots, key_passes,
                yellow_cards, red_cards, xg_chain, xg_buildup,
                "90s", goals_per90, assists_per90, xg_per90, xa_per90
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s, %s, %s
            )
            ON CONFLICT (player_id)
            DO UPDATE SET
                team = EXCLUDED.team,
                position = EXCLUDED.position,
                matches = EXCLUDED.matches,
                minutes = EXCLUDED.minutes,
                goals = EXCLUDED.goals,
                xg = EXCLUDED.xg,
                np_goals = EXCLUDED.np_goals,
                np_xg = EXCLUDED.np_xg,
                penalties = EXCLUDED.penalties,
                assists = EXCLUDED.assists,
                xa = EXCLUDED.xa,
                "G+A" = EXCLUDED."G+A",
                "npG+A" = EXCLUDED."npG+A",
                shots = EXCLUDED.shots,
                key_passes = EXCLUDED.key_passes,
                yellow_cards = EXCLUDED.yellow_cards,
                red_cards = EXCLUDED.red_cards,
                xg_chain = EXCLUDED.xg_chain,
                xg_buildup = EXCLUDED.xg_buildup,
                "90s" = EXCLUDED."90s",
                goals_per90 = EXCLUDED.goals_per90,
                assists_per90 = EXCLUDED.assists_per90,
                xg_per90 = EXCLUDED.xg_per90,
                xa_per90 = EXCLUDED.xa_per90,
                updated_at = CURRENT_TIMESTAMP
            """
        
        # Convert DataFrame to list of tuples
        data = [tuple(row) for row in df[[
                'league', 'team', 'player', 'league_id', 'team_id', 'player_id', 'position',
                'matches', 'minutes', 'goals', 'xg', 'np_goals', 'np_xg', 'penalties',
                'assists', 'xa', 'G+A', 'npG+A', 'shots', 'key_passes',
                'yellow_cards', 'red_cards', 'xg_chain', 'xg_buildup',
                '90s', 'goals_per90', 'assists_per90', 'xG_per90', 'xA_per90'
        ]].values]

        execute_batch(cursor, query, data, page_size = 500)
        conn.commit()

        print(f"Updated {len(data)} players")
        cursor.close()
        conn.close()
        return True

    except Exception as e:
        print(f"✗ DB update failed: {e}")
        if conn:
            conn.rollback()
        return False
    


def main():
    """Main execution"""
    try:
        df = scrape_player_data()
        
        if df.empty:
            print("\nNo data collected")
            return
        
        # Update DB
        update_db(df)


        # Save to CSV
        # output_file = 'data/understat_current_season.csv'
        # os.makedirs('data', exist_ok=True)
        # df.to_csv(output_file, index=False)
        
       # print(f"\nSaved: {output_file}")
        # print(f"Total players: {len(df):,}")
        # print(f"Total columns: {len(df.columns)}")
        # print("\n" + "=" * 60)
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
