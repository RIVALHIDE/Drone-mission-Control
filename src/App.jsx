import { MissionProvider } from './context/MissionContext'
import DashboardShell from './components/layout/DashboardShell'

export default function App() {
  return (
    <MissionProvider>
      <DashboardShell />
    </MissionProvider>
  )
}
