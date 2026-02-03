'use client'

import { ResponsiveScatterPlot } from '@nivo/scatterplot'

interface ScatterPlotProps {
  data: Array<{
    id: string
    data: Array<{
      x: number
      y: number
      label?: string
    }>
  }>
}

export default function ScatterPlot({ data }: ScatterPlotProps) {
  return (
    <div className="h-96 w-full bg-slate-900 border border-emerald-400/30 rounded-lg p-4">
      <ResponsiveScatterPlot
        data={data}
        margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
        xScale={{ type: 'linear', min: 0, max: 'auto' }}
        yScale={{ type: 'linear', min: 0, max: 'auto' }}
        colors={{ scheme: 'nivo' }}
        blendMode="multiply"
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'X Axis',
          legendPosition: 'middle',
          legendOffset: 40,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Y Axis',
          legendPosition: 'middle',
          legendOffset: -50,
        }}
        theme={{
          text: {
            fill: '#34d399',
          },
          grid: {
            line: {
              stroke: '#34d399',
              strokeOpacity: 0.2,
            },
          },
          axis: {
            ticks: {
              text: {
                fill: '#34d399',
              },
            },
          },
        }}
      />
    </div>
  )
}
