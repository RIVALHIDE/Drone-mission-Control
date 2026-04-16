import { useMission } from '../../context/MissionContext'
import TelemetryCard from './TelemetryCard'
import { getStatusColor } from '../../lib/utils'

const MAX_ALTITUDE = 200
const TICK_MARKS = [0, 50, 100, 150, 200]

export default function AltitudeBar() {
  const { telemetry } = useMission()
  const altitude = telemetry.altitude
  const pct = Math.min(100, Math.max(0, (altitude / MAX_ALTITUDE) * 100))
  const color = getStatusColor(altitude, 60, 30)

  return (
    <TelemetryCard label="Altitude">
      <div className="flex items-end gap-3">
        {/* Vertical bar */}
        <div className="relative w-8 h-40 bg-gray-800/80 rounded-sm overflow-hidden border border-gray-700/30">
          {/* Fill from bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 rounded-sm transition-all duration-300"
            style={{
              height: `${pct}%`,
              background: `linear-gradient(to top, ${color}, ${color}88)`,
              boxShadow: `0 0 8px ${color}40`,
            }}
          />
          {/* Tick marks */}
          {TICK_MARKS.map(tick => (
            <div
              key={tick}
              className="absolute left-0 right-0 border-t border-gray-600/30"
              style={{ bottom: `${(tick / MAX_ALTITUDE) * 100}%` }}
            >
              <span className="absolute -right-7 -top-1.5 text-[7px] text-gray-600 tabular-nums">
                {tick}
              </span>
            </div>
          ))}
        </div>

        {/* Value readout */}
        <div className="flex-1">
          <div className="text-2xl font-semibold tabular-nums" style={{ color }}>
            {altitude.toFixed(0)}
          </div>
          <div className="text-[10px] text-gray-500">meters AGL</div>
        </div>
      </div>
    </TelemetryCard>
  )
}
