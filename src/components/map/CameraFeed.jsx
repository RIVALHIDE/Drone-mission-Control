import { useMission } from '../../context/MissionContext'

const BACKEND_URL = 'http://localhost:5000'

export default function CameraFeed() {
  const { mode, connectedDrones, telemetry, activeGroup } = useMission()

  // Filter to active group's drones only
  let activeDrones = (connectedDrones || []).filter(d => d.status === 'active')
  if (activeGroup && mode === 'live') {
    activeDrones = activeDrones.filter(d => activeGroup.droneIds.has(d.drone_id))
  }
  const hasLiveFeeds = mode === 'live' && activeDrones.length > 0

  if (hasLiveFeeds) {
    return <LiveFeeds drones={activeDrones} telemetry={telemetry} />
  }

  return <SimulatedFeed telemetry={telemetry} />
}

/** Renders one CAM panel per connected drone, stacked vertically from bottom-left */
function LiveFeeds({ drones, telemetry }) {
  return (
    <div className="absolute bottom-4 left-4 z-[1000] flex flex-col-reverse gap-2">
      {drones.map((drone, idx) => (
        <div
          key={drone.drone_id}
          className="w-64 h-44 rounded-lg overflow-hidden border border-gray-700/50 shadow-lg shadow-black/50 relative"
        >
          {/* Real MJPEG video stream */}
          <img
            src={`${BACKEND_URL}/video-feed/${drone.drone_id}`}
            alt={`${drone.name} feed`}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Scanline overlay on real feed */}
          <div className="absolute inset-0 pointer-events-none scanlines" />

          {/* Camera label */}
          <div className="absolute top-2 left-2.5 z-10 flex items-center gap-2">
            <span className="text-[9px] font-bold text-green-400 tracking-wider drop-shadow-lg">
              CAM {String(idx + 1).padStart(2, '0')}
            </span>
            <span className="text-[8px] text-cyan-400/80 drop-shadow-lg truncate max-w-[80px]">
              {drone.name}
            </span>
          </div>

          {/* LIVE + REC indicator */}
          <div className="absolute top-2 right-2.5 z-10 flex items-center gap-2">
            <span className="text-[8px] font-bold text-green-400/80 bg-black/40 px-1 rounded">LIVE</span>
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
            </span>
            <span className="text-[9px] font-bold text-red-400/80 drop-shadow-lg">REC</span>
          </div>

          {/* FPS indicator */}
          {drone.fps > 0 && (
            <div className="absolute top-7 right-2.5 z-10">
              <span className="text-[8px] text-gray-400 bg-black/40 px-1 rounded tabular-nums">
                {drone.fps} FPS
              </span>
            </div>
          )}

          {/* Crosshair overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-5 pointer-events-none">
            <div className="w-14 h-14 border border-cyan-500/15 rounded-full" />
            <div className="absolute w-px h-6 bg-cyan-500/10" />
            <div className="absolute w-6 h-px bg-cyan-500/10" />
          </div>

          {/* Bottom telemetry bar */}
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/60 px-2.5 py-1 flex justify-between">
            <span className="text-[8px] text-green-400/60 tabular-nums">
              {drone.drone_id}
            </span>
            <span className="text-[8px] text-green-400/60 tabular-nums">
              {drone.total_detections || 0} detections
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Simulated IR camera feed (original behavior for simulation mode) */
function SimulatedFeed({ telemetry }) {
  return (
    <div className="absolute bottom-4 left-4 z-[1000] w-60 h-40 rounded-lg overflow-hidden border border-gray-700/50 shadow-lg shadow-black/50">
      <div className="relative w-full h-full bg-gray-950 scanlines">
        {/* Simulated thermal gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(circle at ${50 + Math.sin(Date.now() / 2000) * 20}% ${50 + Math.cos(Date.now() / 3000) * 15}%, rgba(6, 182, 212, 0.3), transparent 60%)`,
            }}
          />
        </div>

        {/* Scan line */}
        <div className="scan-line" />

        {/* Camera label */}
        <div className="absolute top-2 left-2.5 z-10 flex items-center gap-2">
          <span className="text-[9px] font-bold text-green-400/80 tracking-wider">CAM 01</span>
          <span className="text-[8px] text-gray-500">IR SIM</span>
        </div>

        {/* REC indicator */}
        <div className="absolute top-2 right-2.5 z-10 flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
          </span>
          <span className="text-[9px] font-bold text-red-400/80">REC</span>
        </div>

        {/* Crosshair overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-5 pointer-events-none">
          <div className="w-16 h-16 border border-cyan-500/20 rounded-full" />
          <div className="absolute w-px h-8 bg-cyan-500/15" />
          <div className="absolute w-8 h-px bg-cyan-500/15" />
        </div>

        {/* Bottom telemetry bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/60 px-2.5 py-1 flex justify-between">
          <span className="text-[8px] text-green-400/60 tabular-nums">
            {telemetry.lat.toFixed(4)}N {telemetry.lng.toFixed(4)}E
          </span>
          <span className="text-[8px] text-green-400/60 tabular-nums">
            {telemetry.altitude.toFixed(0)}m AGL
          </span>
        </div>
      </div>
    </div>
  )
}
