import { useState, useEffect } from 'react'
import { Shield } from 'lucide-react'
import { useMission } from '../../context/MissionContext'
import { formatMissionTime, formatUTC } from '../../lib/utils'
import LiveBadge from './LiveBadge'
import StatusDot from './StatusDot'

export default function Header() {
  const { missionClock, missionStatus, telemetry, fleet } = useMission()
  const [utcTime, setUtcTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setUtcTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="flex items-center justify-between px-5 py-2.5 bg-gray-900/70 border-b border-gray-700/50 backdrop-blur-sm">
      {/* Left: Mission ID */}
      <div className="flex items-center gap-3">
        <Shield className="w-5 h-5 text-tactical-cyan" />
        <span className="text-sm font-semibold tracking-[0.2em] text-gray-200">
          DRONE MISSION CONTROL
        </span>
        <span className="text-[10px] text-gray-500 border border-gray-700 rounded px-1.5 py-0.5">
          {fleet.length} UAV{fleet.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Center: Clocks */}
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-[9px] uppercase tracking-widest text-gray-600">Mission Time</div>
          <div className="text-sm text-tactical-cyan font-medium tabular-nums">
            {formatMissionTime(missionClock)}
          </div>
        </div>
        <div className="w-px h-6 bg-gray-700/50" />
        <div className="text-center">
          <div className="text-[9px] uppercase tracking-widest text-gray-600">UTC</div>
          <div className="text-sm text-gray-300 tabular-nums">
            {formatUTC(utcTime)}
          </div>
        </div>
        <div className="w-px h-6 bg-gray-700/50" />
        <div className="text-center">
          <div className="text-[9px] uppercase tracking-widest text-gray-600">Battery</div>
          <div className={`text-sm font-medium tabular-nums ${
            telemetry.battery < 10 ? 'text-red-400' :
            telemetry.battery < 20 ? 'text-amber-400' : 'text-green-400'
          }`}>
            {telemetry.battery.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Right: Status */}
      <div className="flex items-center gap-4">
        <StatusDot status={missionStatus} />
        <LiveBadge />
      </div>
    </header>
  )
}
