"""
FutPlot FBref Scraper
=====================
Scrapes comprehensive player statistics from FBref for Top 5 European leagues
"""

import os
import pandas as pd
import soccerdata as sd
from datetime import datetime
import time


def scrape_player_data():
    """Scrape comprehensive player stats from FBref"""
    print("=" * 60)
    print("FutPlot Scraper - FBref")
    print("=" * 60)
    
    LEAGUE = 'Big 5 European Leagues Combined'
    TARGET_SEASON = '2025-2026'  # Use completed season to avoid blocking
    STAT_TYPES = ['standard', 'shooting', 'passing', 'defense', 'misc', 'keeper']
    
    print(f"\nLeague: {LEAGUE}")
    print(f"Season: {TARGET_SEASON}")
    print(f"Stats: {len(STAT_TYPES)} types")
    print("\n--- Fetching Data ---\n")
    
    # Initialize scraper with caching enabled
    scraper = sd.FBref(
        leagues=[LEAGUE], 
        seasons=TARGET_SEASON, 
        no_cache=False
    )
    
    print("--- Fetching Data ---")
    
    all_dfs = {}
    merge_cols = ['player', 'season', 'team']
    
    for stat_type in STAT_TYPES:
        try:
            print(f"{stat_type}...", end=" ", flush=True)
            df = scraper.read_player_season_stats(stat_type=stat_type)
            
            # Flatten MultiIndex columns
            df.columns = [
                "_".join(str(c) for c in col if c).strip()
                if isinstance(col, tuple) else str(col)
                for col in df.columns
            ]
            
            df = df.reset_index()
            all_dfs[stat_type] = df
            print(f"✓ ({len(df):,} players)")
            
            # Small delay to be respectful
            time.sleep(2)
            
        except Exception as e:
            print(f"✗ Skipped")
            time.sleep(3)
            continue
    
    if not all_dfs:
        print("\n✗ No data collected")
        return pd.DataFrame()
    
    # Merge all stat types
    print("\n--- Merging Stats ---")
    df_merged = all_dfs.get('standard', list(all_dfs.values())[0])
    
    for stat_type, df in all_dfs.items():
        if stat_type != 'standard' and stat_type in all_dfs:
            df_merged = df_merged.merge(
                df, 
                on=merge_cols, 
                how='left', 
                suffixes=('', f'_{stat_type}')
            )
    
    print(f"✓ Complete: {len(df_merged):,} players, {len(df_merged.columns)} columns")
    return df_merged


def main():
    """Main execution"""
    try:
        df_players = scrape_player_data()
        
        if df_players.empty:
            print("\n✗ No data to save")
            return
        
        # Save CSV
        output_file = 'data/fbref_2023_2024.csv'
        os.makedirs('data', exist_ok=True)
        df_players.to_csv(output_file, index=False)
        
        print(f"\n✅ Saved: {output_file}")
        print(f"📊 Players: {len(df_players):,}")
        print(f"📊 Columns: {len(df_players.columns)}")
        print(f"📊 Sample columns: {list(df_players.columns[:10])}")
        
        print("\n" + "=" * 60)
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()