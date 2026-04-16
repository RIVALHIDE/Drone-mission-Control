import { useMission } from '../../context/MissionContext'
import AlertCard from './AlertCard'

export default function AlertFeed() {
  const { alerts } = useMission()

  if (alerts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-xs">No detections yet</div>
          <div className="text-gray-700 text-[10px] mt-1">Monitoring in progress...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ contain: 'content' }}>
      {alerts.map(alert => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  )
}
