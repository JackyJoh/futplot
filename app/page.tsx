export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 bg-gradient-to-br from-gray-950 via-emerald-950/20 to-gray-950">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-michroma mb-6 text-emerald-400">
            FutPlot
          </h1>
          <p className="text-xl md:text-2xl mb-4 text-emerald-300 font-light">
            Football Analytics & Visualization Platform
          </p>
          <p className="text-sm text-emerald-300/60">
            Top 5 European Leagues • Updated Weekly
          </p>
        </div>
        
        {/* CTA Buttons */}
        <div className="flex flex-col md:flex-row gap-6 justify-center items-center mb-16">
          {/* Primary CTA - Visualization */}
          <a
            href="/plots"
            className="group w-full md:w-auto"
          >
            <div className="px-8 py-4 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors">
              <span className="text-gray-950 text-lg font-michroma">
                Explore Visualizations
              </span>
            </div>
          </a>
          
          {/* Secondary CTA - Analytics */}
          <a
            href="/analytics"
            className="group w-full md:w-auto"
          >
            <div className="px-8 py-4 border-2 border-emerald-400/50 hover:border-emerald-400 rounded-lg transition-colors">
              <span className="text-emerald-400 group-hover:text-emerald-300 transition duration-200 text-lg font-michroma">
                View Analytics
              </span>
            </div>
          </a>
        </div>
        
        {/* Feature Pills */}
        <div className="flex flex-wrap gap-3 justify-center text-sm">
          <div className="px-4 py-2 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300">
            Real-time Data
          </div>
          <div className="px-4 py-2 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300">
            Interactive Charts
          </div>
          <div className="px-4 py-2 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300">
            Advanced Metrics
          </div>
        </div>
      </div>
    </main>
  )
}
