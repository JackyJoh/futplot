'use client'

import { TrendingUp, BarChart3, Users } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: 'trending' | 'chart' | 'users'
  change?: string
}

export default function StatsCard({ title, value, icon, change }: StatsCardProps) {
  const IconComponent = icon === 'trending' ? TrendingUp : icon === 'chart' ? BarChart3 : Users
  
  return (
    <div className="bg-slate-900 border border-emerald-400/30 rounded-lg p-6 hover:border-emerald-400 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-michroma text-emerald-400">{title}</h3>
        <IconComponent className="h-6 w-6 text-emerald-400" />
      </div>
      <div className="text-3xl font-bold text-emerald-300 mb-2">{value}</div>
      {change && (
        <p className="text-sm text-emerald-400/70">{change}</p>
      )}
    </div>
  )
}
