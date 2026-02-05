'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export default function Home() {
  const queryClient = useQueryClient();
  const [hasVisited, setHasVisited] = useState(true); // Default true to prevent flash

  useEffect(() => {
    // Check if user has visited before in this session
    const visited = sessionStorage.getItem('hasVisitedHome');
    setHasVisited(!!visited);
    
    if (!visited) {
      sessionStorage.setItem('hasVisitedHome', 'true');
    }
  }, []);

  // Prefetch player data on mount so it's instant when navigating to analytics/plots
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ['players', 'v2'], // Match the new cache key
      queryFn: async () => {
        const response = await fetch('/api/players');
        if (!response.ok) throw new Error('Failed to fetch players');
        return response.json();
      },
    });
  }, [queryClient]);

  return (
    <div className="relative min-h-screen bg-[#0a0e1a] text-white overflow-hidden">
      {/* Animated background grid */}
      <div className={`fixed top-0 left-0 w-full h-full bg-[length:50px_50px] opacity-100 z-0 ${!hasVisited ? 'animate-[gridMove_20s_linear_infinite]' : ''}`}
           style={{
             backgroundImage: 'linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)',
           }}>
      </div>

      {/* Gradient orbs */}
      <div className={`fixed top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full blur-[80px] opacity-30 z-[1] ${!hasVisited ? 'animate-[float_15s_ease-in-out_infinite]' : ''}`}
           style={{ background: 'radial-gradient(circle, #667eea, transparent)' }}>
      </div>
      <div className={`fixed bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full blur-[80px] opacity-30 z-[1] ${!hasVisited ? 'animate-[float_15s_ease-in-out_infinite_3s]' : ''}`}
           style={{ background: 'radial-gradient(circle, #764ba2, transparent)' }}>
      </div>
      <div className={`fixed top-1/2 left-1/2 w-[300px] h-[300px] rounded-full blur-[80px] opacity-30 z-[1] ${!hasVisited ? 'animate-[float_15s_ease-in-out_infinite_6s]' : ''}`}
           style={{ background: 'radial-gradient(circle, #00d4ff, transparent)' }}>
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-8 max-w-[1400px] pt-6 pb-4 flex justify-between items-center">
        <div className="relative">
          <h1 className="text-2xl font-black tracking-tight">
            <a href="/" className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
              FUTPLOT
            </a>
          </h1>
          <div className="absolute bottom-[-4px] left-0 w-[4.1rem] h-[3px] bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
        </div>
        <nav className="flex gap-6">
          <a href="/analytics" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm uppercase tracking-wider font-medium">
            Analytics
          </a>
          <a href="/plots" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm uppercase tracking-wider font-medium">
            Visualizations
          </a>
          <a href="#about" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm uppercase tracking-wider font-medium">
            About
          </a>
        </nav>
      </header>

      <div className="container relative z-10 mx-auto px-8 max-w-[1400px] flex flex-col min-h-[calc(100vh-120px)]">
        <div className="flex-1 flex flex-col justify-center">
        {/* Hero Section */}
        <section className={`text-center pt-12 pb-6 ${!hasVisited ? 'animate-[fadeInUp_1s_ease-out_0.2s_both]' : ''}`}>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4 tracking-tight">
            Football Analytics<br />
            <span className="bg-gradient-to-r from-[#00d4ff] to-[#a855f7] bg-clip-text text-transparent">
              Redefined
            </span>
          </h2>
          <p className="text-lg md:text-xl text-slate-300 max-w-[700px] mx-auto mb-6 leading-relaxed tracking-wide font-light font-sans">
            Explore player performance from Europe&apos;s top 5 leagues through 
            interactive visualizations and advanced metrics. Data-driven insights 
            for the modern game.
          </p>
        </section>

        {/* Navigation Buttons */}
        <section className={`my-10 ${!hasVisited ? 'animate-[fadeInUp_1s_ease-out_0.6s_both]' : ''}`}>
          <div className="flex flex-col md:flex-row justify-center gap-5 max-w-[700px] mx-auto">
            <a
              href="/analytics"
              className="flex-1 px-8 py-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white text-lg font-medium rounded-lg border border-slate-700/50 text-center transition-all duration-300 tracking-wide hover:border-cyan-400/50 hover:shadow-[0_8px_30px_rgba(6,182,212,0.3)] hover:scale-[1.02] backdrop-blur-sm font-mono uppercase"
            >
              Analytics
            </a>
            <a
              href="/plots"
              className="flex-1 px-8 py-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white text-lg font-medium rounded-lg border border-slate-700/50 text-center transition-all duration-300 tracking-wide hover:border-purple-400/50 hover:shadow-[0_8px_30px_rgba(168,85,247,0.3)] hover:scale-[1.02] backdrop-blur-sm font-mono uppercase"
            >
              Visualizations
            </a>
          </div>
        </section>

        {/* Stats Section */}
        <section className={`my-8 ${!hasVisited ? 'animate-[fadeInUp_1s_ease-out_0.8s_both]' : ''}`}>
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-center">
            <div className="px-4">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#00d4ff] to-[#a855f7] bg-clip-text text-transparent mb-2">
                2,500+
              </div>
              <div className="text-slate-400 text-base uppercase tracking-wider">
                Players
              </div>
            </div>
            <div className="px-4">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#00d4ff] to-[#a855f7] bg-clip-text text-transparent mb-2">
                5
              </div>
              <div className="text-slate-400 text-base uppercase tracking-wider">
                Leagues
              </div>
            </div>
            <div className="px-4">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#00d4ff] to-[#a855f7] bg-clip-text text-transparent mb-2">
                15+
              </div>
              <div className="text-slate-400 text-base uppercase tracking-wider">
                Metrics
              </div>
            </div>
            <div className="px-4">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#00d4ff] to-[#a855f7] bg-clip-text text-transparent mb-2">
                Weekly
              </div>
              <div className="text-slate-400 text-base uppercase tracking-wider">
                Updates
              </div>
            </div>
          </div>
        </section>
        </div>

        {/* Footer */}
        <footer className="text-center py-6 border-t border-[#00d4ff]/10 text-slate-400">
          <p className="text-sm">&copy; 2026 FutPlot. Elevating football analytics through data visualization.</p>
        </footer>
      </div>

      <style jsx>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
