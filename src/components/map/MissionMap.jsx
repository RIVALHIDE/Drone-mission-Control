import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { MAP_CENTER, MAP_ZOOM } from '../../lib/flightPlan'
import { useMission } from '../../context/MissionContext'
import DroneMarker from './DroneMarker'
import FlightTrail from './FlightTrail'
import AlertMarkers from './AlertMarkers'
import LiveDroneMarkers from './LiveDroneMarkers'

function MapGroupPanner() {
  const { activeGroup, droneGroups } = useMission()
  const map = useMap()
  const prevGroupId = useRef(null)

  useEffect(() => {
    if (!activeGroup || !activeGroup.center) return
    // Only fly when the user switches tabs (not on every re-render)
    if (prevGroupId.current !== null && prevGroupId.current !== activeGroup.id) {
      map.flyTo([activeGroup.center.lat, activeGroup.center.lng], 16, { duration: 1 })
    }
    prevGroupId.current = activeGroup.id
  }, [activeGroup?.id, map])

  return null
}

export default function MissionMap() {
  return (
    <MapContainer
      center={[MAP_CENTER.lat, MAP_CENTER.lng]}
      zoom={MAP_ZOOM}
      zoomControl={false}
      className="h-full w-full"
      style={{ background: '#0a0e17' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <MapGroupPanner />
      <FlightTrail />
      <AlertMarkers />
      <DroneMarker />
      <LiveDroneMarkers />
    </MapContainer>
  )
}
