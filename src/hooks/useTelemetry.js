import { useState, useEffect, useRef, useCallback } from 'react'
import { WAYPOINTS, SEGMENT_DURATION } from '../lib/flightPlan'
import { interpolatePosition, calculateBearing } from '../lib/utils'

const TICK_MS = 100
const HISTORY_SAMPLE_INTERVAL = 5 // every 5 ticks = 500ms
const MAX_HISTORY = 500

function createInitialTelemetry() {
  return {
    lat: WAYPOINTS[0].lat,
    lng: WAYPOINTS[0].lng,
    heading: 0,
    altitude: 120,
    speed: 10,
    battery: 100,
    signal: 95,
  }
}

export default function useTelemetry() {
  const [telemetry, setTelemetry] = useState(createInitialTelemetry)
  const [positionHistory, setPositionHistory] = useState([])
  const [missionClock, setMissionClock] = useState(0)

  const waypointIndex = useRef(0)
  const segmentProgress = useRef(0)
  const tickCount = useRef(0)
  const batteryRef = useRef(100)
  const signalRef = useRef(95)
  const signalDipUntil = useRef(0)

  useEffect(() => {
    const progressPerTick = TICK_MS / SEGMENT_DURATION

    const interval = setInterval(() => {
      tickCount.current++

      // Advance along flight path
      segmentProgress.current += progressPerTick

      if (segmentProgress.current >= 1) {
        segmentProgress.current -= 1
        waypointIndex.current = (waypointIndex.current + 1) % WAYPOINTS.length
      }

      const fromIdx = waypointIndex.current
      const toIdx = (fromIdx + 1) % WAYPOINTS.length
      const from = WAYPOINTS[fromIdx]
      const to = WAYPOINTS[toIdx]

      // Smooth interpolation with tiny GPS noise
      const pos = interpolatePosition(from, to, segmentProgress.current)
      const jitterLat = (Math.random() - 0.5) * 0.00002
      const jitterLng = (Math.random() - 0.5) * 0.00002
      const lat = pos.lat + jitterLat
      const lng = pos.lng + jitterLng

      // Heading from current pos toward next waypoint
      const heading = calculateBearing(pos, to)

      // Altitude: sinusoidal oscillation 80-150m
      const elapsed = tickCount.current * TICK_MS / 1000
      const altitude = 115 + 35 * Math.sin(elapsed / 15 * Math.PI) + (Math.random() - 0.5) * 2

      // Speed: 5-15 m/s with perturbation
      const speed = 10 + 3 * Math.sin(elapsed / 8 * Math.PI) + (Math.random() - 0.5) * 1.5

      // Battery: slow linear drain
      batteryRef.current = Math.max(0, batteryRef.current - 0.003)
      const battery = batteryRef.current

      // Signal: mostly high with occasional dips
      if (tickCount.current > signalDipUntil.current) {
        if (Math.random() < 0.002) {
          // Start a signal dip lasting 20-50 ticks (2-5 seconds)
          signalDipUntil.current = tickCount.current + 20 + Math.floor(Math.random() * 30)
          signalRef.current = 40 + Math.random() * 20
        } else {
          signalRef.current = Math.min(100, signalRef.current + (Math.random() - 0.3) * 2)
          signalRef.current = Math.max(80, signalRef.current)
        }
      }
      const signal = signalRef.current

      setTelemetry({ lat, lng, heading, altitude, speed, battery, signal })

      // Sample position history every 500ms
      if (tickCount.current % HISTORY_SAMPLE_INTERVAL === 0) {
        setPositionHistory(prev => {
          const next = [...prev, { lat, lng }]
          return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next
        })
      }

      // Update mission clock every second
      if (tickCount.current % 10 === 0) {
        setMissionClock(prev => prev + 1)
      }
    }, TICK_MS)

    return () => clearInterval(interval)
  }, [])

  const getMissionStatus = useCallback(() => {
    if (batteryRef.current < 10 || signalRef.current < 30) return 'critical'
    if (batteryRef.current < 20 || signalRef.current < 50) return 'warning'
    return 'nominal'
  }, [])

  return { telemetry, positionHistory, missionClock, getMissionStatus }
}
