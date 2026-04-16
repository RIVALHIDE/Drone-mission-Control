import { createContext, useContext, useState, useMemo, useEffect } from 'react'
import useDroneFleet from '../hooks/useDroneFleet'
import useAlerts from '../hooks/useAlerts'
import useWebSocketAlerts from '../hooks/useWebSocketAlerts'
import { groupByProximity } from '../lib/utils'

const MissionContext = createContext(null)

export function MissionProvider({ children }) {
  const [mode, setMode] = useState('simulation') // 'simulation' | 'live'
  const [activeGroupId, setActiveGroupId] = useState('group-0')

  const {
    fleet,
    selectedId,
    setSelectedId,
    addDrone,
    removeDrone,
    missionClock,
    getMissionStatus,
    getFleetTelemetryRef,
    maxDrones,
  } = useDroneFleet()

  // Simulation alerts (random)
  const simAlerts = useAlerts(getFleetTelemetryRef)

  // Live YOLO alerts (WebSocket)
  const wsAlerts = useWebSocketAlerts(getFleetTelemetryRef)

  // Pick alerts based on mode
  const alerts = mode === 'simulation' ? simAlerts.alerts : wsAlerts.alerts
  const latestAlertTime = mode === 'simulation' ? simAlerts.latestAlertTime : wsAlerts.latestAlertTime

  // --- Proximity-based drone groups ---
  const droneGroups = useMemo(() => {
    if (mode === 'simulation') {
      // Group simulated fleet drones by proximity
      const drones = fleet.map(d => ({ ...d, lat: d.telemetry.lat, lng: d.telemetry.lng }))
      return groupByProximity(drones)
    } else {
      // Group live connected drones by proximity
      const liveDrones = (wsAlerts.connectedDrones || [])
        .filter(d => d.lat != null && d.lng != null && d.status === 'active')
        .map(d => ({ ...d, id: d.drone_id }))

      if (liveDrones.length === 0) {
        // Fall back to simulated fleet groups when no live drones with GPS
        const drones = fleet.map(d => ({ ...d, lat: d.telemetry.lat, lng: d.telemetry.lng }))
        return groupByProximity(drones)
      }
      return groupByProximity(liveDrones)
    }
  }, [mode, fleet, wsAlerts.connectedDrones])

  // Ensure activeGroupId is valid
  useEffect(() => {
    if (droneGroups.length > 0 && !droneGroups.find(g => g.id === activeGroupId)) {
      setActiveGroupId(droneGroups[0].id)
    }
  }, [droneGroups, activeGroupId])

  const activeGroup = useMemo(
    () => droneGroups.find(g => g.id === activeGroupId) || droneGroups[0] || null,
    [droneGroups, activeGroupId]
  )

  // Selected drone's data — backward compatible for telemetry components
  const selectedDrone = useMemo(
    () => fleet.find(d => d.id === selectedId) || fleet[0],
    [fleet, selectedId]
  )

  // In live mode, check if there's a connected drone with GPS to show its real telemetry
  const selectedLiveDrone = useMemo(() => {
    if (mode !== 'live') return null
    const liveDrones = (wsAlerts.connectedDrones || []).filter(d => d.lat != null && d.status === 'active')
    return liveDrones.length > 0 ? liveDrones[0] : null
  }, [mode, wsAlerts.connectedDrones])

  const telemetry = selectedLiveDrone
    ? {
        lat: selectedLiveDrone.lat,
        lng: selectedLiveDrone.lng,
        heading: selectedLiveDrone.heading || 0,
        altitude: selectedLiveDrone.altitude || 0,
        speed: selectedLiveDrone.speed || 0,
        battery: selectedDrone?.telemetry?.battery ?? 100,
        signal: selectedDrone?.telemetry?.signal ?? 100,
      }
    : selectedDrone?.telemetry || { lat: 0, lng: 0, heading: 0, altitude: 0, speed: 0, battery: 100, signal: 100 }

  const positionHistory = selectedLiveDrone
    ? selectedLiveDrone.positionHistory || []
    : selectedDrone?.positionHistory || []

  const missionStatus = getMissionStatus()

  return (
    <MissionContext.Provider
      value={{
        // Selected drone telemetry (backward compatible)
        telemetry,
        positionHistory,
        missionClock,
        missionStatus,

        // Fleet management
        fleet,
        selectedId,
        setSelectedId,
        addDrone,
        removeDrone,
        maxDrones,

        // Alerts
        alerts,
        latestAlertTime,

        // Mode (tabs)
        mode,
        setMode,
        wsConnected: wsAlerts.connected,

        // Live drone connections
        connectedDrones: wsAlerts.connectedDrones,
        connectDrone: wsAlerts.connectDrone,
        disconnectDrone: wsAlerts.disconnectDrone,

        // Drone groups (proximity-based map tabs)
        droneGroups,
        activeGroupId,
        setActiveGroupId,
        activeGroup,
      }}
    >
      {children}
    </MissionContext.Provider>
  )
}

export function useMission() {
  const ctx = useContext(MissionContext)
  if (!ctx) throw new Error('useMission must be used within MissionProvider')
  return ctx
}
