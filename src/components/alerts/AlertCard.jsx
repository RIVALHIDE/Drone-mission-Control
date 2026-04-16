import { useState, useEffect } from 'react'
import { User, Car, ShieldAlert, CircleAlert } from 'lucide-react'
import { getConfidenceColor } from '../../lib/alertTypes'
import { formatTimeAgo } from '../../lib/utils'

const ICON_MAP = {
  'Person Detected': User,
  'Vehicle Detected': Car,
  'Unauthorized Entry': ShieldAlert,
  'Anomalous Object': CircleAlert,
}

export default function AlertCard({ alert }) {
  const [, forceUpdate] = useState(0)
  const Icon = ICON_MAP[alert.type] || CircleAlert
  const confColor = getConfidenceColor(alert.confidence)
  const isUrgent = alert.type === 'Unauthorized Entry'

  // Re-render every 5s to update relative time
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`
      animate-slide-in
      bg-gray-900/60 border rounded-lg p-3
      ${isUrgent ? 'border-l-2 border-l-red-500 border-gray-700/30' : 'border-gray-700/30'}
      hover:bg-gray-800/50 transition-colors
    `}>
      <div className="flex items-start gap-2.5">
        {/* Icon */}
        <div
          className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center mt-0.5"
          style={{ backgroundColor: `${alert.color}15`, border: `1px solid ${alert.color}30` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: alert.color }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-gray-200 truncate">
              {alert.type}
            </span>
            <span className="text-[9px] text-gray-500 shrink-0 tabular-nums">
              {formatTimeAgo(alert.timestamp)}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            {/* Confidence badge */}
            <span
              className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
              style={{
                color: confColor,
                backgroundColor: `${confColor}15`,
                border: `1px solid ${confColor}30`,
              }}
            >
              {(alert.confidence * 100).toFixed(0)}%
            </span>

            {/* Coordinates */}
            <span className="text-[8px] text-gray-600 tabular-nums truncate">
              {alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
