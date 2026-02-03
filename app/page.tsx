export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 bg-[#0a1628]">
      <div className="max-w-6xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-michroma mb-6 text-white">
            FutPlot
          </h1>
          <p className="text-xl md:text-2xl mb-4 text-gray-300 font-light">
            Football Analytics & Visualization Platform
          </p>
          <p className="text-sm text-gray-400">
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
            <div className="px-8 py-4 bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors">
              <span className="text-white text-lg font-michroma">
                Explore Visualizations
              </span>
            </div>
          </a>
          
          {/* Secondary CTA - Analytics */}
          <a
            href="/analytics"
            className="group w-full md:w-auto"
          >
            <div className="px-8 py-4 border-2 border-blue-500/50 hover:border-blue-500 rounded-lg transition-colors">
              <span className="text-blue-400 group-hover:text-blue-300 transition duration-200 text-lg font-michroma">
                View Analytics
              </span>
            </div>
          </a>
        </div>
        
        {/* Feature Pills */}
        <div className="flex flex-wrap gap-3 justify-center text-sm">
          <div className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300">
            Real-time Data
          </div>
          <div className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300">
            Interactive Charts
          </div>
          <div className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300">
            Advanced Metrics
          </div>
        </div>
      </div>
    </main>
  )
}
