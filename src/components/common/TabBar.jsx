import { Radio, Wifi } from 'lucide-react'
import { useMission } from '../../context/MissionContext'

const TABS = [
  { id: 'simulation', label: 'Simulation', icon: Radio, desc: 'Simulated Detections' },
  { id: 'live', label: 'Live YOLO', icon: Wifi, desc: 'Real-Time Detection' },
]

export default function TabBar() {
  const { mode, setMode, wsConnected } = useMission()

  return (
    <div className="flex items-center gap-1 px-4 py-1.5 bg-gray-900/50 border-b border-gray-700/30">
      {TABS.map(tab => {
        const active = mode === tab.id
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            onClick={() => setMode(tab.id)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] uppercase tracking-wider
              transition-all duration-200
              ${active
                ? 'bg-tactical-cyan/10 text-cyan-400 border border-cyan-500/30'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 border border-transparent'
              }
            `}
          >
            <Icon className="w-3 h-3" />
            <span className="font-medium">{tab.label}</span>
            {tab.id === 'live' && (
              <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            )}
          </button>
        )
      })}

      <div className="ml-2 text-[9px] text-gray-600">
        {mode === 'simulation' ? 'Random AI alerts generated every 3-8s' : 'Detections from YOLO backend on :5000'}
      </div>
    </div>
  )
}
