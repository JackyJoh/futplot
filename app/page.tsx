export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full">
        <h1 className="text-4xl md:text-6xl font-michroma text-center mb-8 text-emerald-400">
          FutPlot
        </h1>
        <p className="text-center text-xl mb-12 text-emerald-300">
          Football Analytics & Visualization Platform
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-emerald-400/30 rounded-lg p-6 hover:border-emerald-400 transition-colors">
            <h2 className="text-2xl font-michroma mb-4">Data Collection</h2>
            <p className="text-emerald-300/80">
              Automated weekly scraping of player statistics and performance data
            </p>
          </div>
          
          <div className="border border-emerald-400/30 rounded-lg p-6 hover:border-emerald-400 transition-colors">
            <h2 className="text-2xl font-michroma mb-4">Analytics</h2>
            <p className="text-emerald-300/80">
              Advanced metrics and insights from PostgreSQL database
            </p>
          </div>
          
          <div className="border border-emerald-400/30 rounded-lg p-6 hover:border-emerald-400 transition-colors">
            <h2 className="text-2xl font-michroma mb-4">Visualization</h2>
            <p className="text-emerald-300/80">
              Interactive charts and plots powered by Nivo
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
