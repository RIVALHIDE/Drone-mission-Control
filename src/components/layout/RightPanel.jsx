import AlertStats from '../alerts/AlertStats'
import AlertFeed from '../alerts/AlertFeed'

export default function RightPanel() {
  return (
    <div className="w-80 flex flex-col gap-3 p-3 overflow-hidden">
      <div className="text-[10px] uppercase tracking-[0.25em] text-gray-500 font-medium px-1">
        AI Detection Feed
      </div>
      <AlertStats />
      <AlertFeed />
    </div>
  )
}
