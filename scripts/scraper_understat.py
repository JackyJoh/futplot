"""
FutPlot Understat Scraper
==========================
Scrapes player statistics from Understat for current season
"""

import os
import pandas as pd
import soccerdata as sd
from datetime import datetime

def get_current_season():
    """Determine current football season"""
    now = datetime.now()
    year = now.year
    if now.month < 7:
        return year - 1
    else:
        return year


def scrape_understat_data():
    """Scrape player stats from Understat (less aggressive blocking)"""
    print("=" * 60)
    print("FutPlot Scraper - Understat")
    print("=" * 60)
    
    # Understat leagues (use FBref format)
    leagues = ['ENG-Premier League', 'ESP-La Liga', 'GER-Bundesliga', 'ITA-Serie A', 'FRA-Ligue 1']
    current_season = get_current_season()
    
    print(f"\nLeagues: {', '.join(leagues)}")
    print(f"Season: {current_season}")
    print("\n--- Fetching Data ---\n")
    
    # Initialize Understat scraper
    understat = sd.Understat(leagues=leagues, seasons=str(current_season))
    
    all_players = []
    
    for league in leagues:
        try:
            print(f"{league}...", end=" ")
            df = understat.read_player_season_stats()
            
            # Filter for current league
            league_df = df[df.index.get_level_values('league') == league]
            
            if not league_df.empty:
                league_df = league_df.reset_index()
                all_players.append(league_df)
                print(f"✓ ({len(league_df)} players)")
            else:
                print("✓ (no data)")
                
        except Exception as e:
            print(f"✗ Error: {str(e)[:50]}")
            continue
    
    if not all_players:
        print("\n✗ No data collected")
        return pd.DataFrame()
    
    # Combine all leagues
    df_combined = pd.concat(all_players, ignore_index=True)
    
    print(f"\n--- Complete ---")
    print(f"Total players: {len(df_combined):,}")
    print(f"Columns: {len(df_combined.columns)}")
    
    return df_combined


def main():
    try:
        df_players = scrape_understat_data()
        
        if df_players.empty:
            print("\n✗ No data to save")
            return
        
        # Save CSV
        output_file = 'data/understat_current_season.csv'
        os.makedirs('data', exist_ok=True)
        df_players.to_csv(output_file, index=False)
        
        print(f"\n✅ Saved: {output_file}")
        print(f"📊 Preview columns: {list(df_players.columns[:10])}")
        
        print("\n" + "=" * 60)
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
