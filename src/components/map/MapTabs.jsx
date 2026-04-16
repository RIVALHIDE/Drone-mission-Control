import { MapPin } from 'lucide-react'
import { useMission } from '../../context/MissionContext'

export default function MapTabs() {
  const { droneGroups, activeGroupId, setActiveGroupId } = useMission()

  // Hide tab bar when there's only 1 group
  if (!droneGroups || droneGroups.length <= 1) return null

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-900/60 border-b border-gray-700/30 overflow-x-auto shrink-0">
      {droneGroups.map(group => {
        const isActive = group.id === activeGroupId
        return (
          <button
            key={group.id}
            onClick={() => setActiveGroupId(group.id)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px]
              transition-all duration-200 shrink-0
              ${isActive
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 border border-transparent'
              }
            `}
          >
            <MapPin className="w-3 h-3" />
            <span className="font-medium truncate max-w-[100px]">{group.label}</span>

            {/* Drone count badge */}
            {group.drones.length > 1 && (
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full tabular-nums
                ${isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-gray-800 text-gray-500'}`}>
                {group.drones.length}
              </span>
            )}

            {/* Drone color dots */}
            <div className="flex gap-0.5">
              {group.drones.slice(0, 4).map((drone, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: drone.color || '#f59e0b' }}
                />
              ))}
            </div>
          </button>
        )
      })}
    </div>
  )
}
