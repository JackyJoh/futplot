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
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string>('All');

  // Pagination for lazy loading
  const [displayCount, setDisplayCount] = useState(50);
  const loadMoreRef = useRef<HTMLTableRowElement>(null);

  // Fetch all players data
  const { data: players = [], isLoading, error } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const response = await fetch('/api/players');
      if (!response.ok) {
        throw new Error('Failed to fetch players');
      }
      return response.json();
    },
    placeholderData: (previousData) => previousData,
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
    <div className="min-h-screen lg:h-screen bg-[#1a1f3a] text-white flex flex-col lg:overflow-hidden">
      {/* Header */}
      <header className="border-b border-white/10 z-50 bg-[#1a1f3a]/95 backdrop-blur-sm flex-shrink-0 sticky top-0">
        <div className="px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-bold tracking-tight">
              FutPlot
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">Table Analytics</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowFilters(f => !f)}
              className="lg:hidden px-3 py-2 text-sm font-medium text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filters
              {(selectedLeagues.length > 0 || selectedPosition !== 'All') && (
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
              )}
            </button>
            <Link
              href="/"
              className="px-3 md:px-4 py-2 text-sm font-medium text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Back</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile filters panel */}
      {showFilters && (
        <div className="lg:hidden border-b border-white/10 bg-[#1a1f3a]/95 backdrop-blur-sm px-4 py-4 flex gap-6 overflow-x-auto flex-shrink-0">
          <div className="flex-shrink-0">
            <p className="text-[10px] font-heading font-semibold text-slate-400 uppercase tracking-wider mb-2">League</p>
            <div className="flex gap-1.5">
              {leagues.map(league => (
                <button key={league.id} onClick={() => toggleLeague(league.id)}
                  className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-all ${
                    (league.id === 'all' && selectedLeagues.length === 0) || (league.id !== 'all' && selectedLeagues.includes(league.id))
                      ? 'bg-cyan-500 text-white' : 'bg-white/5 text-slate-300 border border-white/10'
                  }`}>{league.name}</button>
              ))}
            </div>
          </div>
          <div className="flex-shrink-0">
            <p className="text-[10px] font-heading font-semibold text-slate-400 uppercase tracking-wider mb-2">Position</p>
            <div className="flex gap-1.5">
              {positions.map(pos => (
                <button key={pos} onClick={() => setSelectedPosition(pos)}
                  className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-all ${
                    selectedPosition === pos ? 'bg-cyan-500 text-white' : 'bg-white/5 text-slate-300 border border-white/10'
                  }`}>{pos}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:overflow-hidden">
        <div className="lg:h-full flex gap-6 px-4 md:px-6 py-4 md:py-6">
          {/* Left Sidebar - Filters (desktop only) */}
          <aside className="hidden lg:block w-56 flex-shrink-0 space-y-6 overflow-y-auto pr-2">
            {/* League Filters */}
            <div>
              <h3 className="text-xs font-heading font-semibold text-slate-400 uppercase tracking-wider mb-3">
                League
              </h3>
              <div className="space-y-2">
                {leagues.map(league => (
                  <button
                    key={league.id}
                    onClick={() => toggleLeague(league.id)}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-all ${
                      (league.id === 'all' && selectedLeagues.length === 0) ||
                      (league.id !== 'all' && selectedLeagues.includes(league.id))
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {league.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Position Filter */}
            <div>
              <h3 className="text-xs font-heading font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Position
              </h3>
              <div className="space-y-2">
                {positions.map(pos => (
                  <button
                    key={pos}
                    onClick={() => setSelectedPosition(pos)}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-all ${
                      selectedPosition === pos
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="pt-6 border-t border-white/10">
              <p className="text-xs text-slate-400 mb-2">
                Showing {visiblePlayers.length} of {sortedPlayers.length} players
              </p>
              <p className="text-xs text-slate-500">
                Last Updated: {currentDate}
              </p>
            </div>
          </aside>

          {/* Right Side - Data Table */}
          <div className="flex-1 min-h-[400px] lg:min-h-0 bg-white/5 rounded-lg border border-white/10 overflow-hidden flex flex-col">
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-[#1e2444] border-b border-white/10 sticky top-0 z-10">
                  <tr>
                    <th
                      onClick={() => handleSort('player')}
                      className={`px-4 py-3 text-left text-xs font-heading font-semibold uppercase tracking-wider cursor-pointer hover:text-cyan-400 transition-colors ${
                        sortKey === 'player' ? 'text-cyan-400' : 'text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        Player
                        {sortKey === 'player' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-slate-400 uppercase tracking-wider">
                      League
                    </th>
                    <th
                      onClick={() => handleSort('minutes')}
                      className={`px-4 py-3 text-center text-xs font-heading font-semibold uppercase tracking-wider cursor-pointer hover:text-cyan-400 transition-colors ${
                        sortKey === 'minutes' ? 'text-cyan-400' : 'text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Minutes
                        {sortKey === 'minutes' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('goals')}
                      className={`px-4 py-3 text-center text-xs font-heading font-semibold uppercase tracking-wider cursor-pointer hover:text-cyan-400 transition-colors ${
                        sortKey === 'goals' ? 'text-cyan-400' : 'text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Goals
                        {sortKey === 'goals' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('assists')}
                      className={`px-4 py-3 text-center text-xs font-heading font-semibold uppercase tracking-wider cursor-pointer hover:text-cyan-400 transition-colors ${
                        sortKey === 'assists' ? 'text-cyan-400' : 'text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Assists
                        {sortKey === 'assists' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('goals_assists')}
                      className={`px-4 py-3 text-center text-xs font-heading font-semibold uppercase tracking-wider cursor-pointer hover:text-cyan-400 transition-colors ${
                        sortKey === 'goals_assists' ? 'text-cyan-400' : 'text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        G+A
                        {sortKey === 'goals_assists' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('xa')}
                      className={`px-4 py-3 text-center text-xs font-heading font-semibold uppercase tracking-wider cursor-pointer hover:text-cyan-400 transition-colors ${
                        sortKey === 'xa' ? 'text-cyan-400' : 'text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        xA
                        {sortKey === 'xa' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('goals_per90')}
                      className={`px-4 py-3 text-center text-xs font-heading font-semibold uppercase tracking-wider cursor-pointer hover:text-cyan-400 transition-colors ${
                        sortKey === 'goals_per90' ? 'text-cyan-400' : 'text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        G/90
                        {sortKey === 'goals_per90' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('shots')}
                      className={`px-4 py-3 text-center text-xs font-heading font-semibold uppercase tracking-wider cursor-pointer hover:text-cyan-400 transition-colors ${
                        sortKey === 'shots' ? 'text-cyan-400' : 'text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Shots
                        {sortKey === 'shots' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('penalties')}
                      className={`px-4 py-3 text-center text-xs font-heading font-semibold uppercase tracking-wider cursor-pointer hover:text-cyan-400 transition-colors ${
                        sortKey === 'penalties' ? 'text-cyan-400' : 'text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Penalties
                        {sortKey === 'penalties' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className="inline-block animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mb-4"></div>
                          <p className="text-slate-400">Loading players...</p>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-16 text-center">
                        <div className="text-red-400">Failed to load players</div>
                        <p className="text-sm text-slate-400 mt-2">Please try refreshing the page</p>
                      </td>
                    </tr>
                  ) : sortedPlayers.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-16 text-center">
                        <p className="text-slate-400">No players match your filters</p>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {visiblePlayers.map((player) => (
                        <tr
                          key={player.id}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium">{player.player}</div>
                              <div className="text-xs text-slate-400">{player.team}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-300 text-sm">
                            {player.league.split('-')[1] || player.league}
                          </td>
                          <td className={`px-4 py-3 text-center tabular-nums ${sortKey === 'minutes' ? 'font-semibold text-cyan-400' : 'text-slate-300'}`}>
                            {player.minutes?.toLocaleString() || 0}
                          </td>
                          <td className={`px-4 py-3 text-center tabular-nums ${sortKey === 'goals' ? 'font-semibold text-cyan-400' : 'text-slate-300'}`}>
                            {player.goals || 0}
                          </td>
                          <td className={`px-4 py-3 text-center tabular-nums ${sortKey === 'assists' ? 'font-semibold text-cyan-400' : 'text-slate-300'}`}>
                            {player.assists || 0}
                          </td>
                          <td className={`px-4 py-3 text-center tabular-nums ${sortKey === 'goals_assists' ? 'font-semibold text-cyan-400' : 'text-slate-300'}`}>
                            {(player.goals || 0) + (player.assists || 0)}
                          </td>
                          <td className={`px-4 py-3 text-center tabular-nums ${sortKey === 'xa' ? 'font-semibold text-cyan-400' : 'text-slate-300'}`}>
                            {player.xa ? player.xa.toFixed(1) : '-'}
                          </td>
                          <td className={`px-4 py-3 text-center tabular-nums ${sortKey === 'goals_per90' ? 'font-semibold text-cyan-400' : 'text-slate-300'}`}>
                            {player.goals_per90 ? player.goals_per90.toFixed(2) : '-'}
                          </td>
                          <td className={`px-4 py-3 text-center tabular-nums ${sortKey === 'shots' ? 'font-semibold text-cyan-400' : 'text-slate-300'}`}>
                            {player.shots || 0}
                          </td>
                          <td className={`px-4 py-3 text-center tabular-nums ${sortKey === 'penalties' ? 'font-semibold text-cyan-400' : 'text-slate-300'}`}>
                            {player.penalties || 0}
                          </td>
                        </tr>
                      ))}
                      {displayCount < sortedPlayers.length && (
                        <tr ref={loadMoreRef}>
                          <td colSpan={10} className="px-4 py-8 text-center">
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
  );
}
