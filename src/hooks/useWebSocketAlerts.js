import { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { MAX_ALERTS } from '../lib/alertTypes'

const BACKEND_URL = 'http://localhost:5000'
const MAX_POSITION_HISTORY = 500

function mapDetectionType(className) {
  const lower = (className || '').toLowerCase()
  if (lower === 'person') return { type: 'Person Detected', color: '#eab308' }
  if (['car', 'truck', 'bus', 'motorcycle', 'bicycle'].includes(lower)) {
    return { type: 'Vehicle Detected', color: '#3b82f6' }
  }
  if (['knife', 'scissors', 'gun'].includes(lower)) {
    return { type: 'Unauthorized Entry', color: '#ef4444' }
  }
  return { type: 'Anomalous Object', color: '#a855f7' }
}

let wsAlertId = 0

export default function useWebSocketAlerts(getFleetTelemetryRef) {
  const [alerts, setAlerts] = useState([])
  const [latestAlertTime, setLatestAlertTime] = useState(0)
  const [connected, setConnected] = useState(false)
  const [connectedDrones, setConnectedDrones] = useState([])
  const socketRef = useRef(null)
  // Track position history per drone (keyed by drone_id)
  const positionHistoryRef = useRef({})

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
    })
    socketRef.current = socket

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    // Detection events from YOLO
    socket.on('detection', (data) => {
      const mapped = mapDetectionType(data.type || data.class_name || 'unknown')

      // Use the drone's real GPS if available, otherwise fall back to simulated fleet
      let alertLat, alertLng
      const droneId = data.drone_id

      setConnectedDrones(prev => {
        const liveDrone = prev.find(d => d.drone_id === droneId)
        if (liveDrone && liveDrone.lat != null) {
          alertLat = liveDrone.lat + (Math.random() - 0.5) * 0.002
          alertLng = liveDrone.lng + (Math.random() - 0.5) * 0.002
        }
        return prev // no change
      })

      // Fallback to simulated fleet position if no real GPS
      if (alertLat == null) {
        const drones = getFleetTelemetryRef()
        const droneIdx = Math.floor(Math.random() * drones.length)
        const drone = drones[droneIdx] || { lat: 28.6120, lng: 77.2270 }
        alertLat = drone.lat + (Math.random() - 0.5) * 0.002
        alertLng = drone.lng + (Math.random() - 0.5) * 0.002
      }

      const alert = {
        id: ++wsAlertId,
        type: mapped.type,
        color: mapped.color,
        confidence: data.confidence || 0.5,
        lat: alertLat,
        lng: alertLng,
        timestamp: data.timestamp || Date.now(),
        droneId: data.drone_id || '',
        className: data.class_name || '',
        source: 'yolo',
      }

      setAlerts(prev => {
        const next = [alert, ...prev]
        return next.length > MAX_ALERTS ? next.slice(0, MAX_ALERTS) : next
      })
      setLatestAlertTime(Date.now())
    })

    // GPS telemetry updates from backend
    socket.on('telemetry_update', (data) => {
      const { drone_id, lat, lng, altitude, heading, speed } = data
      if (!drone_id || lat == null || lng == null) return

      // Track position history
      if (!positionHistoryRef.current[drone_id]) {
        positionHistoryRef.current[drone_id] = []
      }
      const history = positionHistoryRef.current[drone_id]
      history.push({ lat, lng })
      if (history.length > MAX_POSITION_HISTORY) {
        positionHistoryRef.current[drone_id] = history.slice(-MAX_POSITION_HISTORY)
      }

      setConnectedDrones(prev =>
        prev.map(d => d.drone_id === drone_id
          ? {
              ...d,
              lat, lng,
              altitude: altitude ?? d.altitude,
              heading: heading ?? d.heading,
              speed: speed ?? d.speed,
              positionHistory: [...positionHistoryRef.current[drone_id]],
            }
          : d
        )
      )
    })

    // Drone connection status updates
    socket.on('drone_status', (data) => {
      setConnectedDrones((data.drones || []).map(d => ({
        ...d,
        positionHistory: positionHistoryRef.current[d.drone_id] || [],
      })))
    })

    socket.on('drone_connected', (data) => {
      // Initialize position history if drone has GPS
      if (data.lat != null && data.lng != null) {
        positionHistoryRef.current[data.drone_id] = [{ lat: data.lat, lng: data.lng }]
      }
      setConnectedDrones(prev => {
        const existing = prev.find(d => d.drone_id === data.drone_id)
        const droneData = {
          ...data,
          positionHistory: positionHistoryRef.current[data.drone_id] || [],
        }
        if (existing) {
          return prev.map(d => d.drone_id === data.drone_id ? { ...d, ...droneData } : d)
        }
        return [...prev, droneData]
      })
    })

    socket.on('drone_disconnected', (data) => {
      delete positionHistoryRef.current[data.drone_id]
      setConnectedDrones(prev => prev.filter(d => d.drone_id !== data.drone_id))
    })

    socket.on('drone_error', (data) => {
      setConnectedDrones(prev =>
        prev.map(d => d.drone_id === data.drone_id ? { ...d, status: 'error', error: data.error } : d)
      )
    })

    return () => {
      socket.disconnect()
    }
  }, [getFleetTelemetryRef])

  const connectDrone = useCallback(async ({ name, stream_url, telemetry_url, lat, lng }) => {
    const res = await fetch(`${BACKEND_URL}/connect-drone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, stream_url, telemetry_url, lat, lng }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Connection failed')
    return data
  }, [])

  const disconnectDrone = useCallback(async (droneId) => {
    const res = await fetch(`${BACKEND_URL}/disconnect-drone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drone_id: droneId }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Disconnect failed')
    return data
  }, [])

  const clearAlerts = useCallback(() => setAlerts([]), [])

  return {
    alerts,
    latestAlertTime,
    connected,
    connectedDrones,
    connectDrone,
    disconnectDrone,
    clearAlerts,
  }
}
