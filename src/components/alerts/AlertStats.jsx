import { useMemo } from 'react'
import { useMission } from '../../context/MissionContext'
import { ALERT_TYPES } from '../../lib/alertTypes'

export default function AlertStats() {
  const { alerts } = useMission()

  const counts = useMemo(() => {
    const map = {}
    for (const at of ALERT_TYPES) map[at.type] = 0
    for (const alert of alerts) {
      if (map[alert.type] !== undefined) map[alert.type]++
    }
    return map
  }, [alerts.length])

  return (
    <div className="bg-gray-900/50 border border-gray-700/40 rounded-lg p-2.5">
      <div className="grid grid-cols-2 gap-1.5">
        {ALERT_TYPES.map(at => (
          <div
            key={at.type}
            className="flex items-center gap-1.5 px-2 py-1 rounded"
            style={{ backgroundColor: `${at.color}08` }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: at.color }}
            />
            <span className="text-[9px] text-gray-400 truncate">
              {at.type.split(' ')[0]}
            </span>
            <span
              className="text-[10px] font-semibold tabular-nums ml-auto"
              style={{ color: at.color }}
            >
              {counts[at.type]}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700/30">
        <span className="text-[9px] text-gray-500 uppercase tracking-wider">Total</span>
        <span className="text-xs font-semibold text-gray-300 tabular-nums">{alerts.length}</span>
      </div>
    </div>
  )
}
