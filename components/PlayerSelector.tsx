'use client'

interface PlayerSelectorProps {
  players: Array<{
    id: number
    name: string
  }>
  selectedPlayerId?: number
  onPlayerSelect: (playerId: number) => void
}

export default function PlayerSelector({ players, selectedPlayerId, onPlayerSelect }: PlayerSelectorProps) {
  return (
    <div className="w-full">
      <label className="block text-emerald-400 font-michroma mb-2">
        Select Player
      </label>
      <select
        value={selectedPlayerId}
        onChange={(e) => onPlayerSelect(Number(e.target.value))}
        className="w-full bg-slate-900 border border-emerald-400/30 text-emerald-400 rounded-lg px-4 py-2 focus:border-emerald-400 focus:outline-none transition-colors"
      >
        <option value="">Choose a player...</option>
        {players.map((player) => (
          <option key={player.id} value={player.id}>
            {player.name}
          </option>
        ))}
      </select>
    </div>
  )
}
