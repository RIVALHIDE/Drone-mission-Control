import { useState } from 'react'
import { Plug, Unplug, Camera, Video, Wifi, WifiOff, Plus, Loader2, AlertTriangle } from 'lucide-react'
import { useMission } from '../../context/MissionContext'

const PRESETS = [
  { label: 'Webcam', value: '0', icon: Camera },
  { label: 'RTSP Stream', value: 'rtsp://', icon: Video },
  { label: 'HTTP Stream', value: 'http://', icon: Wifi },
]

export default function DroneConnect() {
  const { wsConnected, connectedDrones, connectDrone, disconnectDrone } = useMission()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    streamUrl: '0',
    telemetryUrl: '',
    lat: '',
    lng: '',
  })
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')

  const handlePreset = (value) => {
    setFormData(prev => ({ ...prev, streamUrl: value }))
  }

  const handleConnect = async () => {
    if (!formData.streamUrl) {
      setError('Stream URL is required')
      return
    }
    setError('')
    setConnecting(true)

    try {
      await connectDrone({
        name: formData.name || `Drone-${(connectedDrones?.length || 0) + 1}`,
        stream_url: formData.streamUrl,
        telemetry_url: formData.telemetryUrl || null,
        lat: formData.lat !== '' ? formData.lat : null,
        lng: formData.lng !== '' ? formData.lng : null,
      })
      setFormData({ name: '', streamUrl: '0', telemetryUrl: '', lat: '', lng: '' })
      setShowForm(false)
    } catch (err) {
      setError(err.message || 'Connection failed')
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async (droneId) => {
    try {
      await disconnectDrone(droneId)
    } catch (err) {
      setError(err.message || 'Disconnect failed')
    }
  }

  return (
    <div className="bg-gray-900/50 border border-gray-700/40 rounded-xl p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-medium">
            Drone Connections
          </span>
          <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-[9px] text-cyan-400 hover:text-cyan-300 transition-colors px-1.5 py-0.5 rounded border border-cyan-500/20 hover:border-cyan-500/40"
          >
            <Plus className="w-2.5 h-2.5" />
            Connect
          </button>
        )}
      </div>

      {/* Backend status */}
      {!wsConnected && (
        <div className="flex items-center gap-2 p-2 mb-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <WifiOff className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <div>
            <div className="text-[10px] text-red-400 font-medium">Backend Offline</div>
            <div className="text-[8px] text-red-400/60">
              Start the backend: cd backend && python app.py
            </div>
          </div>
        </div>
      )}

      {/* Connection form */}
      {showForm && (
        <div className="mb-3 p-2.5 rounded-lg bg-gray-800/60 border border-gray-700/30 space-y-2.5">
          <div className="text-[9px] text-gray-400 uppercase tracking-wider font-medium">New Connection</div>

          {/* Presets */}
          <div className="flex gap-1.5">
            {PRESETS.map(preset => {
              const Icon = preset.icon
              const active = formData.streamUrl === preset.value
              return (
                <button
                  key={preset.label}
                  onClick={() => handlePreset(preset.value)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] transition-all
                    ${active
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                      : 'text-gray-500 hover:text-gray-300 bg-gray-800/50 border border-gray-700/30'
                    }`}
                >
                  <Icon className="w-3 h-3" />
                  {preset.label}
                </button>
              )
            })}
          </div>

          {/* Name */}
          <input
            type="text"
            placeholder="Drone name (optional)"
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full bg-gray-900/80 border border-gray-700/50 rounded-md px-2.5 py-1.5 text-[10px] text-gray-300 placeholder-gray-600 focus:border-cyan-500/40 focus:outline-none"
          />

          {/* Stream URL */}
          <input
            type="text"
            placeholder="Stream URL (rtsp://ip:port/path, http://..., or 0 for webcam)"
            value={formData.streamUrl}
            onChange={e => setFormData(prev => ({ ...prev, streamUrl: e.target.value }))}
            className="w-full bg-gray-900/80 border border-gray-700/50 rounded-md px-2.5 py-1.5 text-[10px] text-gray-300 placeholder-gray-600 focus:border-cyan-500/40 focus:outline-none font-mono"
          />

          {/* Telemetry URL (optional) */}
          <input
            type="text"
            placeholder="Telemetry endpoint (optional, e.g., mavlink://...)"
            value={formData.telemetryUrl}
            onChange={e => setFormData(prev => ({ ...prev, telemetryUrl: e.target.value }))}
            className="w-full bg-gray-900/80 border border-gray-700/50 rounded-md px-2.5 py-1.5 text-[10px] text-gray-300 placeholder-gray-600 focus:border-cyan-500/40 focus:outline-none font-mono"
          />

          {/* GPS Coordinates */}
          <div className="rounded-md bg-gray-900/50 border border-gray-700/30 p-2.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] text-gray-500 uppercase tracking-wider font-medium">GPS Position</span>
              <span className="text-[7px] text-gray-600">optional</span>
            </div>

            {/* Lat / Lng inputs with inline labels */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] text-cyan-500/60 font-medium pointer-events-none">LAT</span>
                <input
                  type="text"
                  placeholder="0.0000"
                  value={formData.lat}
                  onChange={e => setFormData(prev => ({ ...prev, lat: e.target.value }))}
                  className="w-full bg-gray-800/80 border border-gray-700/40 rounded px-2 py-1.5 pl-8 text-[10px] text-gray-200 placeholder-gray-700 focus:border-cyan-500/40 focus:outline-none font-mono tabular-nums text-right"
                />
              </div>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] text-cyan-500/60 font-medium pointer-events-none">LNG</span>
                <input
                  type="text"
                  placeholder="0.0000"
                  value={formData.lng}
                  onChange={e => setFormData(prev => ({ ...prev, lng: e.target.value }))}
                  className="w-full bg-gray-800/80 border border-gray-700/40 rounded px-2 py-1.5 pl-8 text-[10px] text-gray-200 placeholder-gray-700 focus:border-cyan-500/40 focus:outline-none font-mono tabular-nums text-right"
                />
              </div>
            </div>

            {/* Quick location presets */}
            <div className="flex gap-1.5 flex-wrap">
              {[
                { label: 'New Delhi', lat: '28.6139', lng: '77.2090' },
                { label: 'Mumbai', lat: '19.0760', lng: '72.8777' },
                { label: 'New York', lat: '40.7128', lng: '-74.0060' },
                { label: 'London', lat: '51.5074', lng: '-0.1278' },
              ].map(loc => {
                const isActive = formData.lat === loc.lat && formData.lng === loc.lng
                return (
                  <button
                    key={loc.label}
                    onClick={() => setFormData(prev => ({ ...prev, lat: loc.lat, lng: loc.lng }))}
                    className={`text-[8px] rounded-full px-2 py-0.5 transition-all border
                      ${isActive
                        ? 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30'
                        : 'text-gray-500 hover:text-cyan-400 bg-gray-800/40 border-gray-700/30 hover:border-cyan-500/20'
                      }`}
                  >
                    {loc.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-1.5 text-[9px] text-red-400">
              <AlertTriangle className="w-3 h-3" />
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleConnect}
              disabled={connecting || !wsConnected}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-medium
                bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition-all
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {connecting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Plug className="w-3 h-3" />
              )}
              {connecting ? 'Connecting...' : 'Connect Stream'}
            </button>
            <button
              onClick={() => { setShowForm(false); setError('') }}
              className="px-3 py-1.5 rounded-md text-[10px] text-gray-500 hover:text-gray-300 border border-gray-700/30 hover:border-gray-600/50 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Connected drones list */}
      <div className="space-y-1">
        {(!connectedDrones || connectedDrones.length === 0) ? (
          <div className="text-center py-3">
            <Camera className="w-5 h-5 text-gray-700 mx-auto mb-1.5" />
            <div className="text-[10px] text-gray-600">No drones connected</div>
            <div className="text-[8px] text-gray-700 mt-0.5">
              Connect a video stream to start live detection
            </div>
          </div>
        ) : (
          connectedDrones.map(drone => (
            <div
              key={drone.drone_id}
              className="flex items-center gap-2 px-2 py-2 rounded-lg bg-gray-800/40 border border-gray-700/30"
            >
              {/* Status indicator */}
              <div className="relative shrink-0">
                <Video className="w-3.5 h-3.5 text-cyan-400" />
                <span className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-gray-800
                  ${drone.status === 'active' ? 'bg-green-500' : drone.status === 'connecting' ? 'bg-amber-500' : 'bg-red-500'}`}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium text-gray-300 truncate">{drone.name}</div>
                <div className="text-[8px] text-gray-600 font-mono truncate">
                  {drone.lat != null ? `${drone.lat.toFixed(4)}, ${drone.lng.toFixed(4)}` : drone.stream_url}
                </div>
              </div>

              {/* Stats */}
              {drone.fps > 0 && (
                <span className="text-[8px] text-gray-500 tabular-nums">{drone.fps} FPS</span>
              )}

              {/* Disconnect */}
              <button
                onClick={() => handleDisconnect(drone.drone_id)}
                className="text-gray-600 hover:text-red-400 transition-colors p-0.5"
                title="Disconnect"
              >
                <Unplug className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
