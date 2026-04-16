import { Plus, X, ChevronRight } from 'lucide-react'
import { useMission } from '../../context/MissionContext'

export default function DroneSelector() {
  const { fleet, selectedId, setSelectedId, addDrone, removeDrone, maxDrones } = useMission()

  return (
    <div className="bg-gray-900/50 border border-gray-700/40 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-medium">
          Fleet ({fleet.length}/{maxDrones})
        </span>
        {fleet.length < maxDrones && (
          <button
            onClick={addDrone}
            className="flex items-center gap-1 text-[9px] text-cyan-400 hover:text-cyan-300 transition-colors px-1.5 py-0.5 rounded border border-cyan-500/20 hover:border-cyan-500/40"
          >
            <Plus className="w-2.5 h-2.5" />
            Add
          </button>
        )}
      </div>

      <div className="space-y-1">
        {fleet.map(drone => {
          const isSelected = drone.id === selectedId
          return (
            <div
              key={drone.id}
              onClick={() => setSelectedId(drone.id)}
              className={`
                flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer
                transition-all duration-150
                ${isSelected
                  ? 'bg-gray-800/80 border border-gray-600/50'
                  : 'hover:bg-gray-800/40 border border-transparent'
                }
              `}
            >
              {/* Drone color dot */}
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: drone.color,
                  boxShadow: isSelected ? `0 0 6px ${drone.color}60` : 'none',
                }}
              />

              {/* Name + ID */}
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium text-gray-300 truncate">
                  {drone.name}
                </div>
                <div className="text-[8px] text-gray-600">{drone.id}</div>
              </div>

              {/* Battery quick indicator */}
              <span className={`text-[9px] tabular-nums ${
                drone.telemetry.battery < 20 ? 'text-red-400' : 'text-gray-500'
              }`}>
                {drone.telemetry.battery.toFixed(0)}%
              </span>

              {/* Remove button (only if more than 1 drone) */}
              {fleet.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeDrone(drone.id) }}
                  className="text-gray-600 hover:text-red-400 transition-colors p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}

              {isSelected && <ChevronRight className="w-3 h-3 text-gray-600 shrink-0" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
