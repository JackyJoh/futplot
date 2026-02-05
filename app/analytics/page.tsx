'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

type SortKey = 'player' | 'minutes' | 'goals' | 'assists' | 'goals_assists' | 'xa' | 'goals_per90' | 'shots' | 'penalties';
type SortOrder = 'asc' | 'desc';

interface PlayerData {
  id: string;
  player: string;
  team: string;
  league: string;
  position: string;
  minutes: number;
  goals: number;
  assists: number;
  xa: number;
  goals_per90: number;
  shots: number;
  penalties: number;
}

const leagues = [
  { id: 'all', name: 'All' },
  { id: 'ENG-Premier League', name: 'Premier League' },
  { id: 'ESP-La Liga', name: 'La Liga' },
  { id: 'ITA-Serie A', name: 'Serie A' },
  { id: 'GER-Bundesliga', name: 'Bundesliga' },
  { id: 'FRA-Ligue 1', name: 'Ligue 1' },
];

const positions = ['All', 'FWD', 'MID', 'DEF', 'GK'];

export default function AnalyticsPage() {
  const [sortKey, setSortKey] = useState<SortKey>('goals');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Filters
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string>('All');
  
  // Pagination for lazy loading
  const [displayCount, setDisplayCount] = useState(50);
  const loadMoreRef = useRef<HTMLTableRowElement>(null);

  // Fetch all players data
  const { data: players = [], isLoading, error, isFetching } = useQuery({
    queryKey: ['players'], // Changed key to bust cache
    queryFn: async () => {
      const response = await fetch('/api/players');
      if (!response.ok) {
        throw new Error('Failed to fetch players');
      }
      const data = await response.json();
      
      // Debug: Log first player to see structure
      if (data.length > 0) {
        console.log('First player data:', data[0]);
        console.log('xa value:', data[0].xa);
        console.log('goals_per90 value:', data[0].goals_per90);
      }
      
      return data;
    },
    placeholderData: (previousData) => previousData, // Use cached data immediately while fetching
  });

  // Apply filters with useMemo to avoid infinite loops
  const filteredPlayers = useMemo(() => {
    let filtered = [...players];

    if (selectedLeagues.length > 0) {
      filtered = filtered.filter(p => selectedLeagues.includes(p.league));
    }

    if (selectedPosition !== 'All') {
      filtered = filtered.filter(p => p.position === selectedPosition);
    }

    return filtered;
  }, [players, selectedLeagues.join(','), selectedPosition]);

  // Apply sorting
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    let aValue, bValue;
    
    // Handle computed G+A field
    if (sortKey === 'goals_assists') {
      aValue = (a.goals || 0) + (a.assists || 0);
      bValue = (b.goals || 0) + (b.assists || 0);
    } else {
      aValue = a[sortKey];
      bValue = b[sortKey];
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return sortOrder === 'asc' 
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const toggleLeague = (leagueId: string) => {
    if (leagueId === 'all') {
      setSelectedLeagues([]);
    } else {
      setSelectedLeagues(prev => 
        prev.includes(leagueId)
          ? prev.filter(l => l !== leagueId)
          : [...prev, leagueId]
      );
    }
    // Reset display count when filters change
    setDisplayCount(50);
  };

  // Intersection observer for lazy loading
  useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef || displayCount >= sortedPlayers.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayCount(prev => Math.min(prev + 50, sortedPlayers.length));
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(currentRef);
    return () => observer.disconnect();
  }, [displayCount, sortedPlayers.length]);

  // Reset display count when filters or sorting changes
  useEffect(() => {
    setDisplayCount(50);
  }, [selectedPosition, sortKey, sortOrder]);

  const currentDate = new Date().toISOString().split('T')[0];

  // Get visible players for lazy loading
  const visiblePlayers = sortedPlayers.slice(0, displayCount);

  return (
    <div className="h-screen bg-[#0a0e1a] text-white relative overflow-hidden flex flex-col">
      {/* Background decorative star */}
      <div className="absolute bottom-0 right-0 w-96 h-96 opacity-10">
        <svg viewBox="0 0 100 100" className="w-full h-full text-cyan-400">
          <polygon 
            points="50,5 61,40 98,40 68,62 79,97 50,75 21,97 32,62 2,40 39,40" 
            fill="currentColor"
          />
        </svg>
      </div>

      <div className="container mx-auto px-6 py-3 relative z-10 flex-1 flex flex-col overflow-hidden">
        <div className="flex gap-6 flex-1 overflow-hidden">
          {/* Left Sidebar - Filters & Controls */}
          <div className="w-80 flex-shrink-0 space-y-2">
            {/* Header */}
            <div>
              <Link href="/" className="inline-flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors mb-2 text-xs">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Home
              </Link>
              <h1 className="text-2xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  FUTPLOT ANALYTICS
                </span>
              </h1>
              <p className="text-slate-400 text-xs mt-1 tracking-wide">
                TOP 5 LEAGUES - 2025/2026 SEASON
              </p>
            </div>

            {/* Filters Section */}
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-3">
              <div className="space-y-3">
                {/* League Filters */}
                <div>
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-3 block">League</span>
                  <div className="flex flex-col gap-2">
                    {leagues.map(league => (
                      <button
                        key={league.id}
                        onClick={() => toggleLeague(league.id)}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 text-left ${
                          (league.id === 'all' && selectedLeagues.length === 0) || 
                          (league.id !== 'all' && selectedLeagues.includes(league.id))
                            ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                            : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-600/50'
                        }`}
                      >
                        <span>{league.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Position Toggle */}
                <div>
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-3 block">Position</span>
                  <div className="flex flex-col gap-2">
                    {positions.map(pos => (
                      <button
                        key={pos}
                        onClick={() => setSelectedPosition(pos)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 text-left ${
                          selectedPosition === pos
                            ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                            : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-600/50'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats & Export */}
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-3 space-y-2">
              <div className="text-xs text-slate-500">
                <div className="mb-1">Showing {visiblePlayers.length} of {sortedPlayers.length} players</div>
                <div>Last Updated: {currentDate}</div>
              </div>
              <button className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 hover:bg-slate-700 hover:border-slate-600 transition-all duration-200 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download CSV
              </button>
            </div>
          </div>

          {/* Right Side - Data Table */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden flex-1">
              <div className="overflow-y-auto h-full [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-800/50 [&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-slate-800 hover:[&::-webkit-scrollbar-thumb]:bg-slate-500">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-slate-700/50 sticky top-0 bg-slate-900 z-10">
                  <th 
                    onClick={() => handleSort('player')}
                    className={`w-[17%] px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-white transition-colors ${
                      sortKey === 'player' ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      Player
                      {sortKey === 'player' && (
                        <span className="text-cyan-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="w-[13%] px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    League
                  </th>
                  <th 
                    onClick={() => handleSort('minutes')}
                    className={`w-[10%] px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-white transition-colors ${
                      sortKey === 'minutes' ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Minutes
                      {sortKey === 'minutes' && (
                        <span className="text-cyan-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('goals')}
                    className={`w-[8%] px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-white transition-colors ${
                      sortKey === 'goals' ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Goals
                      {sortKey === 'goals' && (
                        <span className="text-cyan-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('assists')}
                    className={`w-[8%] px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-white transition-colors ${
                      sortKey === 'assists' ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Assists
                      {sortKey === 'assists' && (
                        <span className="text-cyan-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('goals_assists')}
                    className={`w-[8%] px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-white transition-colors ${
                      sortKey === 'goals_assists' ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      G+A
                      {sortKey === 'goals_assists' && (
                        <span className="text-cyan-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('xa')}
                    className={`w-[8%] px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-white transition-colors ${
                      sortKey === 'xa' ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      xA
                      {sortKey === 'xa' && (
                        <span className="text-cyan-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('goals_per90')}
                    className={`w-[10%] px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-white transition-colors ${
                      sortKey === 'goals_per90' ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      G/90
                      {sortKey === 'goals_per90' && (
                        <span className="text-cyan-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('shots')}
                    className={`w-[8%] px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-white transition-colors ${
                      sortKey === 'shots' ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Shots
                      {sortKey === 'shots' && (
                        <span className="text-cyan-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('penalties')}
                    className={`w-[10%] px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-white transition-colors ${
                      sortKey === 'penalties' ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Penalties
                      {sortKey === 'penalties' && (
                        <span className="text-cyan-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>

                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-16 text-center">
                      <div className="text-slate-500">
                        <div className="inline-block animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mb-4"></div>
                        <div className="text-lg font-medium text-slate-400">Loading players...</div>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-16 text-center">
                      <div className="text-slate-500">
                        <svg className="w-12 h-12 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div className="text-lg font-medium text-slate-400">Failed to load players</div>
                        <div className="text-sm mt-1">Please try refreshing the page</div>
                      </div>
                    </td>
                  </tr>
                ) : sortedPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-16 text-center">
                      <div className="text-slate-500">
                        <svg className="w-12 h-12 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <div className="text-lg font-medium text-slate-400">No data available</div>
                        <div className="text-sm mt-1">Load player data to view analytics</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {visiblePlayers.map((player) => (
                      <tr 
                        key={player.id} 
                        className="hover:bg-slate-800/30 transition-colors duration-150"
                      >
                        <td className="px-6 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-white">{player.player}</span>
                            <span className="text-xs text-slate-500">{player.team}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-300 text-sm">
                            {player.league.split('-')[1] || player.league}
                          </span>
                        </td>
                        <td className={`px-6 py-3 text-center ${sortKey === 'minutes' ? 'font-bold text-white' : 'text-slate-300'}`}>{player.minutes?.toLocaleString() || 0}</td>
                        <td className={`px-0 py-3 text-center ${sortKey === 'goals' ? 'font-bold text-white' : 'text-slate-300'}`}>{player.goals || 0}</td>
                        <td className={`px-0 py-3 text-center ${sortKey === 'assists' ? 'font-bold text-white' : 'text-slate-300'}`}>{player.assists || 0}</td>
                        <td className={`px-8 py-3 text-center ${sortKey === 'goals_assists' ? 'font-bold text-white' : 'text-cyan-400'}`}>{(player.goals || 0) + (player.assists || 0)}</td>
                        <td className={`px-6 py-3 text-center ${sortKey === 'xa' ? 'font-bold text-white' : 'text-slate-300'}`}>{player.xa ? player.xa.toFixed(1) : '-'}</td>
                        <td className={`px-6 py-3 text-center ${sortKey === 'goals_per90' ? 'font-bold text-white' : 'text-slate-300'}`}>{player.goals_per90 ? player.goals_per90.toFixed(2) : '-'}</td>
                        <td className={`px-6 py-3 text-center ${sortKey === 'shots' ? 'font-bold text-white' : 'text-slate-300'}`}>{player.shots || 0}</td>
                        <td className={`px-6 py-3 text-center ${sortKey === 'penalties' ? 'font-bold text-white' : 'text-slate-300'}`}>{player.penalties || 0}</td>
                      </tr>
                    ))}
                    {/* Loading trigger for infinite scroll */}
                    {displayCount < sortedPlayers.length && (
                      <tr ref={loadMoreRef}>
                        <td colSpan={11} className="px-6 py-8 text-center">
                          <div className="inline-block animate-spin w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full"></div>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  );
}
