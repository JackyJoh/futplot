'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Player } from '@/lib/metrics';

interface AnalysisData {
  player: string;
  team: string;
  league: string;
  position: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  playerType: string;
  rating: number;
}

const COUNTRY_CODES: Record<string, string> = {
  'Afghanistan': 'AF', 'Albania': 'AL', 'Algeria': 'DZ', 'Argentina': 'AR', 'Armenia': 'AM',
  'Australia': 'AU', 'Austria': 'AT', 'Azerbaijan': 'AZ', 'Belgium': 'BE', 'Benin': 'BJ',
  'Bolivia': 'BO', 'Bosnia and Herzegovina': 'BA', 'Bosnia': 'BA', 'Brazil': 'BR', 'Bulgaria': 'BG',
  'Burkina Faso': 'BF', 'Cameroon': 'CM', 'Canada': 'CA', 'Cape Verde': 'CV', 'Central African Republic': 'CF',
  'Chad': 'TD', 'Chile': 'CL', 'China': 'CN', 'Colombia': 'CO', 'Comoros': 'KM',
  'Congo': 'CG', 'DR Congo': 'CD', 'Costa Rica': 'CR', 'Croatia': 'HR', 'Cuba': 'CU',
  'Cyprus': 'CY', 'Czech Republic': 'CZ', 'Czechia': 'CZ', 'Denmark': 'DK', 'Dominican Republic': 'DO',
  'Ecuador': 'EC', 'Egypt': 'EG', 'El Salvador': 'SV', 'England': 'GB-ENG', 'Equatorial Guinea': 'GQ',
  'Estonia': 'EE', 'Ethiopia': 'ET', 'Finland': 'FI', 'France': 'FR', 'Gabon': 'GA',
  'Gambia': 'GM', 'Georgia': 'GE', 'Germany': 'DE', 'Ghana': 'GH', 'Greece': 'GR',
  'Guatemala': 'GT', 'Guinea': 'GN', 'Guinea-Bissau': 'GW', 'Haiti': 'HT', 'Honduras': 'HN',
  'Hungary': 'HU', 'Iceland': 'IS', 'India': 'IN', 'Indonesia': 'ID', 'Iran': 'IR',
  'Iraq': 'IQ', 'Ireland': 'IE', 'Republic of Ireland': 'IE', 'Israel': 'IL', 'Italy': 'IT',
  'Ivory Coast': 'CI', "Cote d'Ivoire": 'CI', 'Jamaica': 'JM', 'Japan': 'JP', 'Jordan': 'JO',
  'Kazakhstan': 'KZ', 'Kenya': 'KE', 'Kosovo': 'XK', 'Kuwait': 'KW', 'Latvia': 'LV',
  'Lebanon': 'LB', 'Libya': 'LY', 'Lithuania': 'LT', 'Luxembourg': 'LU', 'Madagascar': 'MG',
  'Mali': 'ML', 'Malta': 'MT', 'Mauritania': 'MR', 'Mexico': 'MX', 'Moldova': 'MD',
  'Montenegro': 'ME', 'Morocco': 'MA', 'Mozambique': 'MZ', 'Namibia': 'NA', 'Netherlands': 'NL',
  'New Zealand': 'NZ', 'Nigeria': 'NG', 'North Macedonia': 'MK', 'Northern Ireland': 'GB-NIR',
  'Norway': 'NO', 'Oman': 'OM', 'Pakistan': 'PK', 'Palestine': 'PS', 'Panama': 'PA',
  'Paraguay': 'PY', 'Peru': 'PE', 'Philippines': 'PH', 'Poland': 'PL', 'Portugal': 'PT',
  'Qatar': 'QA', 'Romania': 'RO', 'Russia': 'RU', 'Rwanda': 'RW', 'Saudi Arabia': 'SA',
  'Scotland': 'GB-SCT', 'Senegal': 'SN', 'Serbia': 'RS', 'Sierra Leone': 'SL', 'Singapore': 'SG',
  'Slovakia': 'SK', 'Slovenia': 'SI', 'Somalia': 'SO', 'South Africa': 'ZA', 'South Korea': 'KR',
  'Korea Republic': 'KR', 'Spain': 'ES', 'Sudan': 'SD', 'Suriname': 'SR', 'Sweden': 'SE',
  'Switzerland': 'CH', 'Syria': 'SY', 'Tanzania': 'TZ', 'Thailand': 'TH', 'Togo': 'TG',
  'Trinidad and Tobago': 'TT', 'Tunisia': 'TN', 'Turkey': 'TR', 'Türkiye': 'TR',
  'Uganda': 'UG', 'Ukraine': 'UA', 'United Arab Emirates': 'AE', 'United States': 'US',
  'USA': 'US', 'Uruguay': 'UY', 'Uzbekistan': 'UZ', 'Venezuela': 'VE', 'Vietnam': 'VN',
  'Wales': 'GB-WLS', 'Zambia': 'ZM', 'Zimbabwe': 'ZW',
};

function countryToCode(country: string): string | null {
  return COUNTRY_CODES[country] || null;
}

function getRatingColor(rating: number): string {
  if (rating < 40) return 'text-rose-400';
  if (rating < 70) return 'text-amber-500';
  if (rating < 85) return 'text-cyan-400';
  return 'text-emerald-400';
}

function getRatingGlow(rating: number): string {
  if (rating < 40) return 'shadow-[0_0_30px_rgba(251,113,133,0.15)]';
  if (rating < 70) return 'shadow-[0_0_30px_rgba(245,158,11,0.15)]';
  if (rating < 85) return 'shadow-[0_0_30px_rgba(34,211,238,0.15)]';
  return 'shadow-[0_0_30px_rgba(52,211,153,0.15)]';
}

function getRatingBg(rating: number): string {
  if (rating < 40) return 'bg-rose-400/10 border-rose-400/20';
  if (rating < 70) return 'bg-amber-500/10 border-amber-500/20';
  if (rating < 85) return 'bg-cyan-400/10 border-cyan-400/20';
  return 'bg-emerald-400/10 border-emerald-400/20';
}

export default function PlayerPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [analysisPlayerName, setAnalysisPlayerName] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const { data: searchResults = [], isFetching: isSearching } = useQuery<Player[]>({
    queryKey: ['player-search', debouncedQuery],
    queryFn: async () => {
      const res = await fetch(`/api/players/${encodeURIComponent(debouncedQuery)}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  const { data: analysis, isFetching: isAnalyzing, refetch: fetchAnalysis } = useQuery<AnalysisData>({
    queryKey: ['player-analysis', analysisPlayerName],
    queryFn: async () => {
      if (!analysisPlayerName) throw new Error('No player selected');
      const res = await fetch(`/api/gemini/player/${encodeURIComponent(analysisPlayerName)}`);
      if (!res.ok) throw new Error('Analysis failed');
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    enabled: false,
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
  });

  const { data: teamBadge } = useQuery<string | null>({
    queryKey: ['team-badge', selectedPlayer?.team],
    queryFn: async () => {
      if (!selectedPlayer?.team) return null;
      const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(selectedPlayer.team)}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.teams?.[0]?.strBadge || null;
    },
    enabled: !!selectedPlayer?.team,
    staleTime: Infinity,
  });

  const { data: nationality } = useQuery<string | null>({
    queryKey: ['player-nationality', selectedPlayer?.player],
    queryFn: async () => {
      if (!selectedPlayer?.player) return null;
      const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(selectedPlayer.player)}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.player?.[0]?.strNationality || null;
    },
    enabled: !!selectedPlayer?.player,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (searchResults.length > 0 && debouncedQuery.length >= 2 && !selectedPlayer) {
      setShowDropdown(true);
    }
  }, [searchResults, debouncedQuery, selectedPlayer]);

  function handleSelectPlayer(player: Player) {
    setSelectedPlayer(player);
    setQuery(player.player);
    setShowDropdown(false);
    setAnalysisPlayerName(null);
  }

  function handleInputChange(value: string) {
    setQuery(value);
    if (selectedPlayer && value !== selectedPlayer.player) {
      setSelectedPlayer(null);
      setAnalysisPlayerName(null);
    }
  }

  function handleAnalyze() {
    if (!selectedPlayer) return;
    setAnalysisPlayerName(selectedPlayer.player);
    setTimeout(() => fetchAnalysis(), 0);
  }

  const hasAnalysis = analysis && !isAnalyzing;

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-[#151829] text-white overflow-y-auto lg:overflow-hidden relative">
      {/* Center ambient glow */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-cyan-500/[0.04] rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-white/10 flex-shrink-0 bg-[#1a1f3a]/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-4 md:px-6 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-bold tracking-tight">FutPlot</h1>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">Player Analysis</p>
          </div>
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
      </header>

      {/* Main Content */}
      <div className="flex-1 lg:min-h-0 flex flex-col px-4 md:px-6 py-4">
        {/* Search Row */}
        <div className="flex gap-3 flex-shrink-0" ref={dropdownRef}>
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0 && !selectedPlayer) setShowDropdown(true);
              }}
              placeholder="Search for a player..."
              className={`w-full pl-10 pr-4 py-2.5 bg-white/5 rounded-lg text-white placeholder-slate-500 focus:outline-none transition-all duration-200 text-sm ${
                !selectedPlayer && !hasAnalysis
                  ? 'border border-cyan-400/40 shadow-[0_0_18px_rgba(34,211,238,0.12)] focus:border-cyan-400/70 focus:shadow-[0_0_24px_rgba(34,211,238,0.2)]'
                  : 'border border-white/10 focus:border-cyan-400/50 focus:shadow-[0_0_12px_rgba(34,211,238,0.15)]'
              }`}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 backdrop-blur-md bg-[#1a1f3a]/95 border border-white/10 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                {searchResults.map((player, i) => (
                  <button
                    key={`${player.player}-${player.team}-${i}`}
                    onClick={() => handleSelectPlayer(player)}
                    className="w-full text-left px-4 py-2.5 border-l-2 border-l-transparent hover:bg-[rgba(34,211,238,0.08)] hover:border-l-[rgba(34,211,238,0.7)] transition-all duration-150 flex items-center justify-between gap-2"
                  >
                    <span className="text-sm text-white font-medium truncate">{player.player}</span>
                    <span className="text-xs text-slate-400 shrink-0 hidden sm:inline">{player.team} &middot; {player.league}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleAnalyze}
            disabled={!selectedPlayer || isAnalyzing}
            className={`px-4 md:px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/30 disabled:cursor-not-allowed text-white font-heading font-semibold rounded-lg disabled:shadow-none transition-all duration-200 text-sm flex items-center gap-2 whitespace-nowrap ${
              selectedPlayer && !isAnalyzing && !hasAnalysis
                ? 'shadow-[0_0_30px_rgba(34,211,238,0.5)] ring-1 ring-cyan-400/50 animate-pulse'
                : 'shadow-[0_0_20px_rgba(34,211,238,0.15)] hover:shadow-[0_0_30px_rgba(34,211,238,0.3)]'
            }`}
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">Analyzing...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Analyze
              </>
            )}
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 lg:min-h-0 mt-4 flex flex-col gap-3 lg:overflow-y-auto">
          {/* Empty state */}
          {!selectedPlayer && !isAnalyzing && !hasAnalysis && (
            <div className="flex-1 flex items-center justify-center py-16 lg:py-0">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-white/10 mb-4">
                  <svg className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-slate-200 text-sm font-medium">Search for a player to get started</p>
                <p className="text-slate-500 text-xs mt-1">AI-powered scouting reports with strengths, weaknesses, and ratings</p>
              </div>
            </div>
          )}

          {/* Player Info + Analysis layout */}
          {selectedPlayer && (
            <>
              {/* Two-column on lg, stacked on mobile */}
              <div className="flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* LEFT COLUMN — player card + analysis */}
                <div className="col-span-1 lg:col-span-2 flex flex-col gap-3 lg:min-h-0">
                  {/* Player Info Card with Rating */}
                  <div
                    className="flex-shrink-0 lg:flex-1 lg:basis-[45%] lg:min-h-0 bg-white/5 border border-white/10 rounded-lg p-4 md:p-5"
                    style={{ borderTop: '1px solid rgba(34, 211, 238, 0.15)', backgroundImage: 'linear-gradient(to bottom, rgba(34, 211, 238, 0.04) 0%, transparent 40%)' }}
                  >
                    {/* Mobile: stacked. Desktop: 4-col grid */}
                    <div className="flex flex-col lg:grid lg:grid-cols-4 lg:gap-5 lg:h-full gap-4">
                      {/* Player info + stats */}
                      <div className="lg:col-span-3 flex flex-col">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {teamBadge && (
                              <img src={teamBadge} alt={selectedPlayer.team} className="w-8 h-8 md:w-10 md:h-10 object-contain" />
                            )}
                            {nationality && countryToCode(nationality) && (
                              <img
                                src={`https://flagcdn.com/w80/${countryToCode(nationality)!.toLowerCase().split('-')[0]}.png`}
                                alt={nationality}
                                className="w-8 h-[22px] md:w-10 md:h-7 object-cover rounded-[3px]"
                              />
                            )}
                          </div>
                          <h2 className="text-xl md:text-2xl lg:text-3xl font-heading font-bold tracking-tight text-white truncate">
                            {selectedPlayer.player}
                          </h2>
                          <span className="px-2 py-0.5 text-[10px] font-heading font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 rounded flex-shrink-0">
                            {selectedPlayer.position}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mb-3 md:mb-4">{selectedPlayer.team} &middot; {selectedPlayer.league}</p>
                        <div className="grid grid-cols-4 gap-2 md:gap-3 lg:flex-1">
                          {[
                            { label: 'Matches', value: selectedPlayer.matches },
                            { label: 'Minutes', value: Number(selectedPlayer.minutes).toLocaleString() },
                            { label: 'Goals', value: selectedPlayer.goals },
                            { label: 'Assists', value: selectedPlayer.assists },
                            { label: 'xG', value: Number(selectedPlayer.xg).toFixed(1) },
                            { label: 'xA', value: Number(selectedPlayer.xa).toFixed(1) },
                            { label: 'KP', value: selectedPlayer.key_passes },
                            { label: 'Shots', value: selectedPlayer.shots },
                          ].map(({ label, value }) => (
                            <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-1.5 md:px-3 py-2 md:py-4 flex flex-col items-center justify-center">
                              <p className="font-heading font-semibold text-[9px] md:text-[10px] uppercase tracking-wider text-slate-500 mb-0.5 md:mb-1">{label}</p>
                              <p className="text-base md:text-xl lg:text-2xl font-bold tabular-nums text-white">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Rating column — on mobile sits below stats */}
                      <div className="flex flex-row lg:flex-col items-center justify-center gap-3 lg:gap-0 py-1 lg:py-0">
                        {hasAnalysis && (
                          <>
                            <div className={`w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full border-2 ${getRatingBg(analysis.rating)} ${getRatingGlow(analysis.rating)} flex items-center justify-center`}>
                              <span className={`text-2xl md:text-3xl lg:text-4xl font-bold tabular-nums ${getRatingColor(analysis.rating)}`}>
                                {analysis.rating}
                              </span>
                            </div>
                            <p className="text-[10px] font-heading font-semibold uppercase tracking-wider text-slate-400 lg:mt-2">
                              Rating / 100
                            </p>
                          </>
                        )}
                        {isAnalyzing && (
                          <>
                            <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-white/[0.06] animate-pulse" />
                            <div className="h-3 w-16 bg-white/[0.06] rounded animate-pulse lg:mt-2" />
                          </>
                        )}
                        {!isAnalyzing && !hasAnalysis && (
                          <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full border-2 border-white/[0.06] border-dashed flex items-center justify-center">
                            <span className="text-slate-600 text-xs">--</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Analysis Summary */}
                  {hasAnalysis && (
                    <div
                      className="lg:flex-1 lg:basis-[55%] lg:min-h-0 bg-white/5 border border-white/10 rounded-lg p-4 md:p-5 flex flex-col lg:overflow-y-auto"
                      style={{ borderTop: '1px solid rgba(34, 211, 238, 0.15)', backgroundImage: 'linear-gradient(to bottom, rgba(34, 211, 238, 0.04) 0%, transparent 40%)' }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 text-xs font-heading font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 rounded">
                          {analysis.playerType}
                        </span>
                        <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-slate-400">Analysis</h3>
                      </div>
                      <p className="text-sm md:text-base text-slate-300 leading-relaxed">
                        {analysis.summary}
                      </p>
                    </div>
                  )}

                  {/* Analysis skeleton */}
                  {isAnalyzing && (
                    <div className="lg:flex-1 lg:basis-[55%] lg:min-h-0 bg-white/5 border border-white/10 rounded-lg p-4 md:p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-5 w-40 bg-white/[0.06] rounded animate-pulse" />
                        <div className="h-5 w-16 bg-white/[0.06] rounded animate-pulse" />
                      </div>
                      <div className="space-y-2.5">
                        <div className="h-3.5 w-full bg-white/[0.06] rounded animate-pulse" />
                        <div className="h-3.5 w-full bg-white/[0.06] rounded animate-pulse" />
                        <div className="h-3.5 w-5/6 bg-white/[0.06] rounded animate-pulse" />
                        <div className="h-3.5 w-4/6 bg-white/[0.06] rounded animate-pulse" />
                      </div>
                    </div>
                  )}

                  {/* Pre-analyze state */}
                  {!isAnalyzing && !hasAnalysis && (
                    <div
                      className="lg:flex-1 lg:basis-[55%] lg:min-h-0 min-h-[140px] bg-white/5 border border-white/10 rounded-lg flex items-center justify-center"
                      style={{ borderTop: '1px solid rgba(34, 211, 238, 0.15)', backgroundImage: 'linear-gradient(to bottom, rgba(34, 211, 238, 0.04) 0%, transparent 40%)' }}
                    >
                      <div className="text-center py-6 lg:py-0">
                        <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-cyan-500/10 border border-cyan-400/20 mb-3">
                          <svg className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <p className="text-slate-300 text-base md:text-lg font-medium">Ready to analyze {selectedPlayer.player}</p>
                        <p className="text-slate-400 text-sm mt-1.5">↑ Press <span className="text-cyan-400 font-semibold">Analyze</span> to generate a scouting report</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN — strengths above weaknesses */}
                <div className="flex flex-col gap-3 lg:min-h-0">
                  {/* Strengths */}
                  {hasAnalysis && (
                    <div
                      className="flex-1 lg:min-h-0 bg-white/5 border border-white/10 rounded-lg p-4 md:p-5 lg:overflow-y-auto"
                      style={{ borderTop: '1px solid rgba(34, 211, 238, 0.15)', backgroundImage: 'linear-gradient(to bottom, rgba(34, 211, 238, 0.04) 0%, transparent 40%)' }}
                    >
                      <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-cyan-400 mb-3">
                        Strengths
                      </h3>
                      <ul className="space-y-1.5">
                        {analysis.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm md:text-base text-slate-300">
                            <span className="text-cyan-400 mt-0.5 shrink-0">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {hasAnalysis && (
                    <div
                      className="flex-1 lg:min-h-0 bg-white/5 border border-white/10 rounded-lg p-4 md:p-5 lg:overflow-y-auto"
                      style={{ borderTop: '1px solid rgba(251, 113, 133, 0.15)', backgroundImage: 'linear-gradient(to bottom, rgba(251, 113, 133, 0.04) 0%, transparent 40%)' }}
                    >
                      <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-rose-400 mb-3">
                        Weaknesses
                      </h3>
                      <ul className="space-y-1.5">
                        {analysis.weaknesses.map((w, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm md:text-base text-slate-300">
                            <span className="text-rose-400 mt-0.5 shrink-0">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </span>
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Right column skeletons */}
                  {isAnalyzing && (
                    <>
                      <div className="flex-1 bg-white/5 border border-white/10 rounded-lg p-4 md:p-5">
                        <div className="h-3 w-20 bg-white/[0.06] rounded animate-pulse mb-3" />
                        <div className="space-y-2">
                          <div className="h-3 w-full bg-white/[0.06] rounded animate-pulse" />
                          <div className="h-3 w-5/6 bg-white/[0.06] rounded animate-pulse" />
                          <div className="h-3 w-4/6 bg-white/[0.06] rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="flex-1 bg-white/5 border border-white/10 rounded-lg p-4 md:p-5">
                        <div className="h-3 w-24 bg-white/[0.06] rounded animate-pulse mb-3" />
                        <div className="space-y-2">
                          <div className="h-3 w-full bg-white/[0.06] rounded animate-pulse" />
                          <div className="h-3 w-4/6 bg-white/[0.06] rounded animate-pulse" />
                          <div className="h-3 w-3/4 bg-white/[0.06] rounded animate-pulse" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Empty right column before analysis */}
                  {!isAnalyzing && !hasAnalysis && (
                    <>
                      <div
                        className="flex-1 min-h-[100px] lg:min-h-0 bg-white/5 border border-white/10 rounded-lg p-4 md:p-5 flex items-center justify-center"
                        style={{ borderTop: '1px solid rgba(34, 211, 238, 0.15)', backgroundImage: 'linear-gradient(to bottom, rgba(34, 211, 238, 0.04) 0%, transparent 40%)' }}
                      >
                        <div className="text-center">
                          <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-cyan-400/30 mb-1">Strengths</h3>
                          <p className="text-slate-600 text-xs">--</p>
                        </div>
                      </div>
                      <div
                        className="flex-1 min-h-[100px] lg:min-h-0 bg-white/5 border border-white/10 rounded-lg p-4 md:p-5 flex items-center justify-center"
                        style={{ borderTop: '1px solid rgba(251, 113, 133, 0.15)', backgroundImage: 'linear-gradient(to bottom, rgba(251, 113, 133, 0.04) 0%, transparent 40%)' }}
                      >
                        <div className="text-center">
                          <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-rose-400/30 mb-1">Weaknesses</h3>
                          <p className="text-slate-600 text-xs">--</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
