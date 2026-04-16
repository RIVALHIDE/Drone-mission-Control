import { useMission } from '../../context/MissionContext'
import TelemetryCard from './TelemetryCard'
import { Zap } from 'lucide-react'

const RADIUS = 45
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const STROKE_WIDTH = 7

function getBatteryColor(battery) {
  if (battery > 50) return '#22c55e'
  if (battery > 20) return '#f59e0b'
  return '#ef4444'
}

export default function BatteryGauge() {
  const { telemetry } = useMission()
  const battery = telemetry.battery
  const color = getBatteryColor(battery)
  const offset = CIRCUMFERENCE * (1 - battery / 100)

  return (
    <TelemetryCard label="Battery">
      <div className="flex justify-center">
        <svg width="120" height="120" viewBox="0 0 120 120">
          {/* Background track */}
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="#1f2937"
            strokeWidth={STROKE_WIDTH}
          />
          {/* Foreground arc */}
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
            style={{
              transition: 'stroke-dashoffset 0.5s ease, stroke 0.5s ease',
              filter: `drop-shadow(0 0 4px ${color}60)`,
            }}
          />
          {/* Center percentage */}
          <text
            x="60"
            y="55"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={color}
            fontSize="22"
            fontFamily="JetBrains Mono, monospace"
            fontWeight="600"
          >
            {battery.toFixed(0)}
          </text>
          <text
            x="60"
            y="72"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#6b7280"
            fontSize="9"
            fontFamily="JetBrains Mono, monospace"
          >
            PERCENT
          </text>
        </svg>
      </div>
      {/* Bottom indicator */}
      <div className="flex items-center justify-center gap-1.5 mt-1">
        <Zap className="w-3 h-3" style={{ color }} />
        <span className="text-[10px] tabular-nums" style={{ color }}>
          {battery.toFixed(1)}%
        </span>
        <span className="text-[10px] text-gray-600">
          {battery > 20 ? 'Nominal' : battery > 10 ? 'Low' : 'Critical'}
        </span>
      </div>
    </TelemetryCard>
  )
}
