import { useRef } from 'react'
import { useMission } from '../../context/MissionContext'
import TelemetryCard from './TelemetryCard'
import { Gauge, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function VelocityReadout() {
  const { telemetry } = useMission()
  const prevSpeed = useRef(telemetry.speed)

  const delta = telemetry.speed - prevSpeed.current
  prevSpeed.current = telemetry.speed

  const TrendIcon = delta > 0.3 ? TrendingUp : delta < -0.3 ? TrendingDown : Minus
  const trendColor = delta > 0.3 ? '#22c55e' : delta < -0.3 ? '#f59e0b' : '#6b7280'

  return (
    <TelemetryCard label="Velocity">
      <div className="flex items-center gap-3">
        <Gauge className="w-5 h-5 text-tactical-cyan opacity-60" />
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold text-cyan-400 tabular-nums">
              {telemetry.speed.toFixed(1)}
            </span>
            <span className="text-[10px] text-gray-500">m/s</span>
          </div>
        </div>
        <TrendIcon className="w-4 h-4 ml-auto" style={{ color: trendColor }} />
      </div>
    </TelemetryCard>
  )
}
