"""
FutPlot WhoScored Scraper
==========================
Scrapes comprehensive player statistics from WhoScored match events
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
        return f"{year-1}-{year}"
    else:
        return f"{year}-{year+1}"


def scrape_whoscored_data():
    """Scrape player stats from WhoScored events"""
    print("=" * 60)
    print("FutPlot Scraper - WhoScored")
    print("=" * 60)
    
    leagues = ['ENG-Premier League', 'ESP-La Liga', 'GER-Bundesliga', 'ITA-Serie A', 'FRA-Ligue 1']
    current_season = get_current_season()
    
    print(f"\nLeagues: {len(leagues)} top European leagues")
    print(f"Season: {current_season}")
    print("\n--- Fetching Data ---\n")
    
    try:
        # Initialize WhoScored scraper
        ws = sd.WhoScored(leagues=leagues, seasons=current_season, headless=True)
        
        print("Fetching match events (this may take a while)...\n")
        
        # Get all match events
        df = ws.read_events()
        
        # Flatten multi-index if needed
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = ['_'.join(str(c) for c in col if c).strip() 
                         if isinstance(col, tuple) else str(col) 
                         for col in df.columns]
        
        df = df.reset_index()
        
        print(f"✓ Events fetched: {len(df):,}")
        
        # Aggregate events by player to get season stats
        if 'player' in df.columns or any('player' in str(col).lower() for col in df.columns):
            player_col = next((col for col in df.columns if 'player' in col.lower()), 'player')
            
            print("Aggregating player stats...", end=" ")
            
            # Group by player and aggregate
            numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
            groupby_cols = [col for col in [player_col, 'season', 'team'] if col in df.columns]
            
            if groupby_cols:
                df_agg = df.groupby(groupby_cols, as_index=False).agg({
                    col: 'sum' for col in numeric_cols
                })
                
                print(f"✓ {len(df_agg):,} players")
                return df_agg
        
        return df
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return pd.DataFrame()


def main():
    try:
        df_players = scrape_whoscored_data()
        
        if df_players.empty:
            print("\n✗ No data to save")
            return
        
        # Save CSV
        output_file = 'data/whoscored_current_season.csv'
        os.makedirs('data', exist_ok=True)
        df_players.to_csv(output_file, index=False)
        
        print(f"\n✅ Saved: {output_file}")
        print(f"📊 Columns ({len(df_players.columns)}): {list(df_players.columns[:15])}...")
        
        print("\n" + "=" * 60)
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
