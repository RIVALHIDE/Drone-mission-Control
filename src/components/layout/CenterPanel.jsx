import MissionMap from '../map/MissionMap'
import CameraFeed from '../map/CameraFeed'
import MapOverlayHUD from '../map/MapOverlayHUD'
import MapTabs from '../map/MapTabs'

export default function CenterPanel() {
  return (
    <div className="flex-1 relative min-w-0 flex flex-col">
      <MapTabs />
      <div className="flex-1 relative">
        <MissionMap />
        <MapOverlayHUD />
        <CameraFeed />
      </div>
    </div>
  )
}
