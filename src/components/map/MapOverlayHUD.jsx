import { useMission } from '../../context/MissionContext'

export default function MapOverlayHUD() {
  const { telemetry } = useMission()

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
      <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/40 rounded-lg px-4 py-2 flex items-center gap-4">
        <HUDItem label="ALT" value={`${telemetry.altitude.toFixed(0)}m`} />
        <div className="w-px h-4 bg-gray-700/50" />
        <HUDItem label="SPD" value={`${telemetry.speed.toFixed(1)} m/s`} />
        <div className="w-px h-4 bg-gray-700/50" />
        <HUDItem label="HDG" value={`${telemetry.heading.toFixed(0).padStart(3, '0')}°`} />
      </div>
    </div>
  )
}

function HUDItem({ label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] uppercase tracking-widest text-gray-500">{label}</span>
      <span className="text-xs text-cyan-400 tabular-nums font-medium">{value}</span>
    </div>
  )
}
