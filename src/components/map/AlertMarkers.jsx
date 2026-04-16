import { CircleMarker, Popup } from 'react-leaflet'
import { useMission } from '../../context/MissionContext'
import { getConfidenceColor } from '../../lib/alertTypes'

export default function AlertMarkers() {
  const { alerts } = useMission()

  // Only show last 20 on map
  const visible = alerts.slice(0, 20)

  return (
    <>
      {visible.map((alert) => (
        <CircleMarker
          key={alert.id}
          center={[alert.lat, alert.lng]}
          radius={6}
          pathOptions={{
            fillColor: alert.color,
            fillOpacity: 0.5,
            color: alert.color,
            weight: 1,
            opacity: 0.7,
          }}
        >
          <Popup className="dark-popup">
            <div className="text-xs font-mono">
              <div className="font-bold">{alert.type}</div>
              <div style={{ color: getConfidenceColor(alert.confidence) }}>
                Confidence: {(alert.confidence * 100).toFixed(0)}%
              </div>
              <div className="text-gray-400">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  )
}
