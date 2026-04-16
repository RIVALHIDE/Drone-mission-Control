import { useEffect, useRef, useMemo } from 'react'
import { Marker, Polyline, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useMission } from '../../context/MissionContext'

const LIVE_COLOR = '#f59e0b'

function createLiveIcon(heading, color) {
  const svg = `
    <div style="transform: rotate(${heading || 0}deg); filter: drop-shadow(0 0 8px ${color}cc); transition: transform 0.15s linear;">
      <svg width="42" height="42" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Outer live ring -->
        <circle cx="18" cy="18" r="17" stroke="${color}" stroke-width="1" stroke-dasharray="4 3" opacity="0.5"/>
        <!-- Body -->
        <circle cx="18" cy="18" r="4" fill="${color}" opacity="0.9"/>
        <circle cx="18" cy="18" r="6" stroke="${color}" stroke-width="1" opacity="0.5"/>
        <!-- Arms -->
        <line x1="18" y1="18" x2="8" y2="8" stroke="${color}" stroke-width="1.5" opacity="0.7"/>
        <line x1="18" y1="18" x2="28" y2="8" stroke="${color}" stroke-width="1.5" opacity="0.7"/>
        <line x1="18" y1="18" x2="8" y2="28" stroke="${color}" stroke-width="1.5" opacity="0.7"/>
        <line x1="18" y1="18" x2="28" y2="28" stroke="${color}" stroke-width="1.5" opacity="0.7"/>
        <!-- Rotors -->
        <circle cx="8" cy="8" r="4" stroke="${color}" stroke-width="1" fill="${color}" fill-opacity="0.2"/>
        <circle cx="28" cy="8" r="4" stroke="${color}" stroke-width="1" fill="${color}" fill-opacity="0.2"/>
        <circle cx="8" cy="28" r="4" stroke="${color}" stroke-width="1" fill="${color}" fill-opacity="0.2"/>
        <circle cx="28" cy="28" r="4" stroke="${color}" stroke-width="1" fill="${color}" fill-opacity="0.2"/>
        <!-- Nose -->
        <polygon points="18,3 15,9 21,9" fill="${color}" opacity="0.8"/>
        <!-- LIVE label -->
        <rect x="10" y="26" width="16" height="7" rx="1" fill="${color}" opacity="0.9"/>
        <text x="18" y="31.5" text-anchor="middle" fill="#000" font-size="5" font-weight="bold" font-family="monospace">LIVE</text>
      </svg>
    </div>`

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  })
}

function LiveMarker({ drone }) {
  const markerRef = useRef(null)
  const heading = drone.heading || 0

  const icon = useMemo(
    () => createLiveIcon(heading, LIVE_COLOR),
    [Math.round(heading / 5) * 5]
  )

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([drone.lat, drone.lng])
    }
  }, [drone.lat, drone.lng])

  return (
    <Marker
      ref={markerRef}
      position={[drone.lat, drone.lng]}
      icon={icon}
      interactive={true}
    >
      <Tooltip direction="top" offset={[0, -24]} permanent={false}>
        <div className="font-mono text-[10px]">
          <span className="font-bold text-amber-500">{drone.name}</span>
          <span className="text-green-500 ml-1">LIVE</span>
          <div className="text-gray-400 text-[8px]">{drone.drone_id}</div>
        </div>
      </Tooltip>
    </Marker>
  )
}

function LiveTrail({ drone }) {
  const positions = useMemo(
    () => (drone.positionHistory || []).map(p => [p.lat, p.lng]),
    [(drone.positionHistory || []).length]
  )

  if (positions.length < 2) return null

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: LIVE_COLOR,
        weight: 3,
        opacity: 0.6,
        dashArray: '4 6',
      }}
    />
  )
}

/** Auto-centers the map whenever a new live drone with GPS appears */
function MapAutoCenter({ drones }) {
  const map = useMap()
  const centeredDronesRef = useRef(new Set())

  useEffect(() => {
    for (const drone of drones) {
      if (drone.lat != null && drone.lng != null && !centeredDronesRef.current.has(drone.drone_id)) {
        centeredDronesRef.current.add(drone.drone_id)
        map.flyTo([drone.lat, drone.lng], 16, { duration: 1.5 })
        break // fly to the newest uncentered drone
      }
    }
  }, [drones, map])

  // Clean up removed drones from the tracking set
  useEffect(() => {
    const currentIds = new Set(drones.map(d => d.drone_id))
    for (const id of centeredDronesRef.current) {
      if (!currentIds.has(id)) centeredDronesRef.current.delete(id)
    }
  }, [drones])

  return null
}

export default function LiveDroneMarkers() {
  const { mode, connectedDrones, activeGroup } = useMission()

  if (mode !== 'live') return null

  const withGps = (connectedDrones || []).filter(d => d.lat != null && d.lng != null && d.status === 'active')

  if (withGps.length === 0) return null

  // Filter to active group if groups exist
  const visibleDrones = activeGroup
    ? withGps.filter(d => activeGroup.droneIds.has(d.drone_id))
    : withGps

  return (
    <>
      <MapAutoCenter drones={visibleDrones} />
      {visibleDrones.map(drone => (
        <LiveTrail key={`trail-${drone.drone_id}`} drone={drone} />
      ))}
      {visibleDrones.map(drone => (
        <LiveMarker key={drone.drone_id} drone={drone} />
      ))}
    </>
  )
}
