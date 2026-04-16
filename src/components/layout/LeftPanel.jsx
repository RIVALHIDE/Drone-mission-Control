import { useMission } from '../../context/MissionContext'
import DroneSelector from '../common/DroneSelector'
import DroneConnect from '../common/DroneConnect'
import AltitudeBar from '../telemetry/AltitudeBar'
import BatteryGauge from '../telemetry/BatteryGauge'
import SignalStrength from '../telemetry/SignalStrength'
import VelocityReadout from '../telemetry/VelocityReadout'
import CoordinateDisplay from '../telemetry/CoordinateDisplay'

export default function LeftPanel() {
  const { mode } = useMission()

  return (
    <div className="w-72 flex flex-col gap-3 p-3 overflow-y-auto">
      {/* Live mode: show drone connection panel */}
      {mode === 'live' && <DroneConnect />}

      {/* Fleet selector (both modes) */}
      <DroneSelector />

      <div className="text-[10px] uppercase tracking-[0.25em] text-gray-500 font-medium px-1">
        Telemetry
      </div>
      <AltitudeBar />
      <BatteryGauge />
      <SignalStrength />
      <VelocityReadout />
      <CoordinateDisplay />
    </div>
  )
}
