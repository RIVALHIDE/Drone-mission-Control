import { useMemo } from 'react'
import { Polyline } from 'react-leaflet'
import { useMission } from '../../context/MissionContext'

function SingleTrail({ drone, isSelected }) {
  const positions = useMemo(
    () => drone.positionHistory.map(p => [p.lat, p.lng]),
    [drone.positionHistory.length]
  )

  if (positions.length < 2) return null

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: drone.color,
        weight: isSelected ? 2.5 : 1.5,
        opacity: isSelected ? 0.5 : 0.25,
        dashArray: '6 8',
      }}
    />
  )
}

export default function FlightTrail() {
  const { fleet, selectedId, activeGroup, mode } = useMission()

  const visibleDrones = (mode === 'simulation' && activeGroup)
    ? fleet.filter(d => activeGroup.droneIds.has(d.id))
    : fleet

  return (
    <>
      {visibleDrones.map(drone => (
        <SingleTrail
          key={drone.id}
          drone={drone}
          isSelected={drone.id === selectedId}
        />
      ))}
    </>
  )
}
