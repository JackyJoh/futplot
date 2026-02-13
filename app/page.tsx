'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

export default function Home() {
  const queryClient = useQueryClient();

  // Prefetch player data on mount so it's instant when navigating to analytics/plots
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ['players', 'v2'],
      queryFn: async () => {
        const response = await fetch('/api/players');
        if (!response.ok) throw new Error('Failed to fetch players');
        return response.json();
      },
    });
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-[#1a1f3a] text-white">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 bg-gradient-radial from-[#1a1f3a] via-[#1a1f3a] to-[#151829] pointer-events-none" />
      {/* Center ambient glow */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-cyan-500/[0.04] rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-heading font-bold tracking-tight">
            FutPlot
          </h1>
          <nav className="flex gap-8">
            <Link href="/analytics" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors font-medium">
              Table Analytics
            </Link>
            <Link href="/plots" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors font-medium">
              Data Visualizations
            </Link>
            <Link href="/player" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors font-medium">
              Player Analysis
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-20">
          {/* Hero Section */}
          <section className="text-center mb-20">
            <h2 className="text-6xl md:text-7xl font-heading font-bold mb-6 tracking-tight">
              Football Analytics<br />
              <span className="text-cyan-400">Redefined</span>
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
              Explore player performance from Europe&apos;s top 5 leagues through
              interactive visualizations and advanced metrics. Data-driven insights
              for the modern game.
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
              <Link
                href="/analytics"
                className="group relative p-6 bg-white/5 rounded-lg border border-white/10 hover:border-cyan-400/30 hover:bg-white/[0.07] transition-all duration-200 text-left overflow-hidden"
                style={{ borderTop: '1px solid rgba(34, 211, 238, 0.15)', backgroundImage: 'linear-gradient(to bottom, rgba(34, 211, 238, 0.04) 0%, transparent 40%)' }}
              >
                <div className="text-cyan-400 mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-heading font-semibold text-white mb-1">Table Analytics</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Sort and filter 2,500+ players across every metric. Find the standouts.</p>
                <span className="inline-flex items-center gap-1 mt-3 text-xs text-cyan-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Explore
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </span>
              </Link>
              <Link
                href="/plots"
                className="group relative p-6 bg-cyan-500/10 rounded-lg border border-cyan-400/20 hover:border-cyan-400/40 hover:bg-cyan-500/15 transition-all duration-200 text-left shadow-[0_0_20px_rgba(34,211,238,0.08)]"
                style={{ borderTop: '1px solid rgba(34, 211, 238, 0.3)', backgroundImage: 'linear-gradient(to bottom, rgba(34, 211, 238, 0.08) 0%, transparent 50%)' }}
              >
                <div className="text-cyan-400 mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <h3 className="font-heading font-semibold text-white mb-1">Data Visualizations</h3>
                <p className="text-xs text-slate-300 leading-relaxed">Interactive scatter plots with AI-labeled quadrants. See who overperforms.</p>
                <span className="inline-flex items-center gap-1 mt-3 text-xs text-cyan-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Explore
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </span>
              </Link>
              <Link
                href="/player"
                className="group relative p-6 bg-white/5 rounded-lg border border-white/10 hover:border-cyan-400/30 hover:bg-white/[0.07] transition-all duration-200 text-left overflow-hidden"
                style={{ borderTop: '1px solid rgba(34, 211, 238, 0.15)', backgroundImage: 'linear-gradient(to bottom, rgba(34, 211, 238, 0.04) 0%, transparent 40%)' }}
              >
                <div className="text-cyan-400 mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="font-heading font-semibold text-white mb-1">Player Analysis</h3>
                <p className="text-xs text-slate-400 leading-relaxed">AI-powered scouting reports. Strengths, weaknesses, and ratings for any player.</p>
                <span className="inline-flex items-center gap-1 mt-3 text-xs text-cyan-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Explore
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </span>
              </Link>
            </div>
          </section>

          {/* Key Features Grid */}
          <section className="mb-12">
            <h3 className="text-sm font-heading font-semibold text-slate-400 uppercase tracking-wider mb-8 text-center">
              Key Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                {
                  title: '2,500+ Players',
                  description: 'Comprehensive data coverage across all positions',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ),
                },
                {
                  title: '5 Elite Leagues',
                  description: 'Premier League, La Liga, Serie A, Bundesliga, Ligue 1',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                },
                {
                  title: '15+ Metrics',
                  description: 'Goals, xG, assists, shots, key passes, and more',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  ),
                },
                {
                  title: 'Updated Weekly',
                  description: 'Fresh data refreshed every week throughout the season',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ),
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:border-cyan-400/30 transition-all duration-200"
                >
                  <div className="text-cyan-400 mb-4">{feature.icon}</div>
                  <h4 className="text-lg font-heading font-semibold mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="text-center py-8 border-t border-white/10">
              <p className="text-sm text-slate-400">
                &copy; 2026 FutPlot. Elevating football analytics through data visualization.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
