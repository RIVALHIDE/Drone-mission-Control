import Header from '../common/Header'
import TabBar from '../common/TabBar'
import LeftPanel from './LeftPanel'
import CenterPanel from './CenterPanel'
import RightPanel from './RightPanel'

export default function DashboardShell() {
  return (
    <div className="h-screen w-screen flex flex-col bg-tactical-dark overflow-hidden">
      <Header />
      <TabBar />
      <div className="flex-1 flex overflow-hidden">
        <LeftPanel />
        <CenterPanel />
        <RightPanel />
      </div>
    </div>
  )
}
