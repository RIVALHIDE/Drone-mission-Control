import { useState, useEffect, useRef, useCallback } from 'react'
import { WAYPOINTS, SEGMENT_DURATION } from '../lib/flightPlan'
import { interpolatePosition, calculateBearing } from '../lib/utils'

const TICK_MS = 100
const HISTORY_SAMPLE_INTERVAL = 5
const MAX_HISTORY = 500
const MAX_DRONES = 6

const DRONE_NAMES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot']
const DRONE_COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#22c55e', '#ec4899', '#f97316']

let droneIdCounter = 0

function createDroneWaypoints(droneIndex) {
  const angle = (droneIndex * Math.PI * 2) / MAX_DRONES
  const offset = droneIndex * 0.0008
  return WAYPOINTS.map(wp => ({
    lat: wp.lat + Math.sin(angle) * offset,
    lng: wp.lng + Math.cos(angle) * offset,
  }))
}

function createDroneSimState(droneIndex) {
  const id = `UAV-${String(++droneIdCounter).padStart(2, '0')}`
  const waypoints = createDroneWaypoints(droneIndex)
  const startWaypoint = Math.floor((droneIndex * WAYPOINTS.length) / MAX_DRONES) % WAYPOINTS.length

  return {
    id,
    name: DRONE_NAMES[droneIndex % DRONE_NAMES.length],
    color: DRONE_COLORS[droneIndex % DRONE_COLORS.length],
    waypoints,
    waypointIndex: startWaypoint,
    segmentProgress: 0,
    battery: 95 + Math.random() * 5,
    signal: 90 + Math.random() * 10,
    signalDipUntil: 0,
    tickCount: 0,
    positionHistory: [],
    telemetry: {
      lat: waypoints[startWaypoint].lat,
      lng: waypoints[startWaypoint].lng,
      heading: 0,
      altitude: 100 + Math.random() * 40,
      speed: 8 + Math.random() * 4,
      battery: 95 + Math.random() * 5,
      signal: 90 + Math.random() * 10,
    },
  }
}

function tickDrone(drone) {
  drone.tickCount++
  const progressPerTick = TICK_MS / SEGMENT_DURATION

  drone.segmentProgress += progressPerTick
  if (drone.segmentProgress >= 1) {
    drone.segmentProgress -= 1
    drone.waypointIndex = (drone.waypointIndex + 1) % drone.waypoints.length
  }

  const fromIdx = drone.waypointIndex
  const toIdx = (fromIdx + 1) % drone.waypoints.length
  const from = drone.waypoints[fromIdx]
  const to = drone.waypoints[toIdx]

  const pos = interpolatePosition(from, to, drone.segmentProgress)
  const lat = pos.lat + (Math.random() - 0.5) * 0.00002
  const lng = pos.lng + (Math.random() - 0.5) * 0.00002
  const heading = calculateBearing(pos, to)

  const elapsed = drone.tickCount * TICK_MS / 1000
  const altitude = 115 + 35 * Math.sin(elapsed / 15 * Math.PI) + (Math.random() - 0.5) * 2
  const speed = 10 + 3 * Math.sin(elapsed / 8 * Math.PI) + (Math.random() - 0.5) * 1.5

  drone.battery = Math.max(0, drone.battery - 0.003)

  if (drone.tickCount > drone.signalDipUntil) {
    if (Math.random() < 0.002) {
      drone.signalDipUntil = drone.tickCount + 20 + Math.floor(Math.random() * 30)
      drone.signal = 40 + Math.random() * 20
    } else {
      drone.signal = Math.min(100, drone.signal + (Math.random() - 0.3) * 2)
      drone.signal = Math.max(80, drone.signal)
    }
  }

  drone.telemetry = {
    lat, lng, heading, altitude, speed,
    battery: drone.battery,
    signal: drone.signal,
  }

  if (drone.tickCount % HISTORY_SAMPLE_INTERVAL === 0) {
    drone.positionHistory.push({ lat, lng })
    if (drone.positionHistory.length > MAX_HISTORY) {
      drone.positionHistory = drone.positionHistory.slice(-MAX_HISTORY)
    }
  }
}

function snapshotDrone(drone) {
  return {
    id: drone.id,
    name: drone.name,
    color: drone.color,
    telemetry: { ...drone.telemetry },
    positionHistory: [...drone.positionHistory],
  }
}

export default function useDroneFleet() {
  const dronesRef = useRef([createDroneSimState(0)])
  const [fleet, setFleet] = useState(() => dronesRef.current.map(snapshotDrone))
  const [selectedId, setSelectedId] = useState(dronesRef.current[0].id)
  const [missionClock, setMissionClock] = useState(0)
  const globalTickRef = useRef(0)

  useEffect(() => {
    const interval = setInterval(() => {
      globalTickRef.current++

      for (const drone of dronesRef.current) {
        tickDrone(drone)
      }

      setFleet(dronesRef.current.map(snapshotDrone))

      if (globalTickRef.current % 10 === 0) {
        setMissionClock(prev => prev + 1)
      }
    }, TICK_MS)

    return () => clearInterval(interval)
  }, [])

  const addDrone = useCallback(() => {
    if (dronesRef.current.length >= MAX_DRONES) return null
    const newDrone = createDroneSimState(dronesRef.current.length)
    dronesRef.current.push(newDrone)
    return newDrone.id
  }, [])

  const removeDrone = useCallback((id) => {
    if (dronesRef.current.length <= 1) return
    dronesRef.current = dronesRef.current.filter(d => d.id !== id)
    setSelectedId(prev => prev === id ? dronesRef.current[0].id : prev)
  }, [])

  const getFleetTelemetryRef = useCallback(() => {
    return dronesRef.current.map(d => ({
      id: d.id,
      lat: d.telemetry.lat,
      lng: d.telemetry.lng,
    }))
  }, [])

  const getMissionStatus = useCallback(() => {
    for (const drone of dronesRef.current) {
      if (drone.battery < 10 || drone.signal < 30) return 'critical'
      if (drone.battery < 20 || drone.signal < 50) return 'warning'
    }
    return 'nominal'
  }, [])

  return {
    fleet,
    selectedId,
    setSelectedId,
    addDrone,
    removeDrone,
    missionClock,
    getMissionStatus,
    getFleetTelemetryRef,
    maxDrones: MAX_DRONES,
  }
}
