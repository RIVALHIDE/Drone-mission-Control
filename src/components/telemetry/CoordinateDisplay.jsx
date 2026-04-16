import { useMission } from '../../context/MissionContext'
import TelemetryCard from './TelemetryCard'
import { MapPin } from 'lucide-react'
import { formatCoord } from '../../lib/utils'

export default function CoordinateDisplay() {
  const { telemetry } = useMission()

  return (
    <TelemetryCard label="Position">
      <div className="flex items-start gap-2.5">
        <MapPin className="w-4 h-4 text-tactical-cyan opacity-50 mt-0.5 shrink-0" />
        <div className="space-y-1.5 font-mono">
          <CoordRow label="LAT" value={formatCoord(telemetry.lat)} suffix="N" />
          <CoordRow label="LNG" value={formatCoord(telemetry.lng)} suffix="E" />
          <CoordRow label="HDG" value={telemetry.heading.toFixed(1)} suffix="°" />
        </div>
      </div>
    </TelemetryCard>
  )
}

function CoordRow({ label, value, suffix }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-600 w-7">{label}</span>
      <span className="text-gray-300 tabular-nums">{value}</span>
      <span className="text-gray-600 text-[10px]">{suffix}</span>
    </div>
  )
}
