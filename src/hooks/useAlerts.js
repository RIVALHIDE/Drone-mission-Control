import { useState, useEffect, useRef, useCallback } from 'react'
import { pickAlertType, MAX_ALERTS, ALERT_INTERVAL_MIN, ALERT_INTERVAL_MAX } from '../lib/alertTypes'

let alertIdCounter = 0

export default function useAlerts(getFleetTelemetryRef) {
  const [alerts, setAlerts] = useState([])
  const [latestAlertTime, setLatestAlertTime] = useState(0)
  const timeoutRef = useRef(null)

  const scheduleNext = useCallback(() => {
    const delay = ALERT_INTERVAL_MIN + Math.random() * (ALERT_INTERVAL_MAX - ALERT_INTERVAL_MIN)
    timeoutRef.current = setTimeout(() => {
      const alertType = pickAlertType()

      // Pick a random drone from the fleet
      const drones = getFleetTelemetryRef()
      const droneIdx = Math.floor(Math.random() * drones.length)
      const drone = drones[droneIdx] || { id: 'UAV-01', lat: 28.6120, lng: 77.2270 }

      const alert = {
        id: ++alertIdCounter,
        type: alertType.type,
        color: alertType.color,
        confidence: 0.65 + Math.random() * 0.34,
        lat: drone.lat + (Math.random() - 0.5) * 0.002,
        lng: drone.lng + (Math.random() - 0.5) * 0.002,
        timestamp: Date.now(),
        droneId: drone.id,
        source: 'simulation',
      }

      setAlerts(prev => {
        const next = [alert, ...prev]
        return next.length > MAX_ALERTS ? next.slice(0, MAX_ALERTS) : next
      })
      setLatestAlertTime(Date.now())

      scheduleNext()
    }, delay)
  }, [getFleetTelemetryRef])

  useEffect(() => {
    scheduleNext()
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [scheduleNext])

  return { alerts, latestAlertTime }
}
