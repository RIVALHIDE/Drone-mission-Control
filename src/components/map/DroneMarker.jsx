import { useEffect, useRef, useMemo } from 'react'
import { Marker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useMission } from '../../context/MissionContext'

function createDroneIcon(heading, color, isAlert, isSelected) {
  const glowColor = isAlert ? 'rgba(239, 68, 68, 0.8)' : `${color}99`
  const fillColor = isAlert ? '#ef4444' : color
  const ringOpacity = isSelected ? '0.6' : '0.2'
  const size = isSelected ? 40 : 32

  const svg = `
    <div style="transform: rotate(${heading}deg); filter: drop-shadow(0 0 6px ${glowColor}); transition: transform 0.1s linear;">
      <svg width="${size}" height="${size}" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="18" cy="18" r="4" fill="${fillColor}" opacity="0.9"/>
        <circle cx="18" cy="18" r="6" stroke="${fillColor}" stroke-width="1" opacity="${ringOpacity}"/>
        <line x1="18" y1="18" x2="8" y2="8" stroke="${fillColor}" stroke-width="1.5" opacity="0.7"/>
        <line x1="18" y1="18" x2="28" y2="8" stroke="${fillColor}" stroke-width="1.5" opacity="0.7"/>
        <line x1="18" y1="18" x2="8" y2="28" stroke="${fillColor}" stroke-width="1.5" opacity="0.7"/>
        <line x1="18" y1="18" x2="28" y2="28" stroke="${fillColor}" stroke-width="1.5" opacity="0.7"/>
        <circle cx="8" cy="8" r="4" stroke="${fillColor}" stroke-width="1" fill="${fillColor}" fill-opacity="0.15"/>
        <circle cx="28" cy="8" r="4" stroke="${fillColor}" stroke-width="1" fill="${fillColor}" fill-opacity="0.15"/>
        <circle cx="8" cy="28" r="4" stroke="${fillColor}" stroke-width="1" fill="${fillColor}" fill-opacity="0.15"/>
        <circle cx="28" cy="28" r="4" stroke="${fillColor}" stroke-width="1" fill="${fillColor}" fill-opacity="0.15"/>
        <polygon points="18,4 15,10 21,10" fill="${fillColor}" opacity="0.8"/>
      </svg>
    </div>`

  const half = size / 2
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size],
    iconAnchor: [half, half],
  })
}

function SingleDroneMarker({ drone, isSelected, isAlert }) {
  const markerRef = useRef(null)

  const icon = useMemo(
    () => createDroneIcon(drone.telemetry.heading, drone.color, isAlert, isSelected),
    [Math.round(drone.telemetry.heading / 3) * 3, drone.color, isAlert, isSelected]
  )

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([drone.telemetry.lat, drone.telemetry.lng])
    }
  }, [drone.telemetry.lat, drone.telemetry.lng])

  return (
    <Marker
      ref={markerRef}
      position={[drone.telemetry.lat, drone.telemetry.lng]}
      icon={icon}
      interactive={true}
    >
      <Tooltip
        direction="top"
        offset={[0, -20]}
        className="drone-tooltip"
        permanent={false}
      >
        <div className="font-mono text-[10px]">
          <span style={{ color: drone.color }} className="font-bold">{drone.name}</span>
          <span className="text-gray-400 ml-1">{drone.id}</span>
        </div>
      </Tooltip>
    </Marker>
  )
}

export default function DroneMarker() {
  const { fleet, selectedId, latestAlertTime, activeGroup, mode } = useMission()
  const isAlert = Date.now() - latestAlertTime < 2000

  // Filter to only show drones in the active group (simulation mode)
  const visibleDrones = (mode === 'simulation' && activeGroup)
    ? fleet.filter(d => activeGroup.droneIds.has(d.id))
    : fleet

  return (
    <>
      {visibleDrones.map(drone => (
        <SingleDroneMarker
          key={drone.id}
          drone={drone}
          isSelected={drone.id === selectedId}
          isAlert={isAlert}
        />
      ))}
    </>
  )
}
