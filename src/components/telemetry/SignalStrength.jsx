import { useMission } from '../../context/MissionContext'
import TelemetryCard from './TelemetryCard'
import { Wifi } from 'lucide-react'
import { getStatusColor } from '../../lib/utils'

const BAR_COUNT = 5

export default function SignalStrength() {
  const { telemetry } = useMission()
  const signal = telemetry.signal
  const filledBars = Math.ceil(signal / 20)
  const color = getStatusColor(signal, 50, 30)

  return (
    <TelemetryCard label="Signal">
      <div className="flex items-end gap-3">
        {/* Signal bars */}
        <div className="flex items-end gap-1">
          {Array.from({ length: BAR_COUNT }, (_, i) => {
            const height = 8 + i * 6 // 8px to 32px
            const filled = i < filledBars
            return (
              <div
                key={i}
                className="w-3 rounded-sm transition-all duration-300"
                style={{
                  height: `${height}px`,
                  backgroundColor: filled ? color : '#1f2937',
                  boxShadow: filled ? `0 0 4px ${color}40` : 'none',
                }}
              />
            )
          })}
        </div>

        {/* Value readout */}
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5" style={{ color }} />
            <span className="text-xl font-semibold tabular-nums" style={{ color }}>
              {signal.toFixed(0)}
            </span>
            <span className="text-[10px] text-gray-500">%</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            {signal > 80 ? 'Strong' : signal > 50 ? 'Moderate' : 'Weak'}
          </div>
        </div>
      </div>
    </TelemetryCard>
  )
}
