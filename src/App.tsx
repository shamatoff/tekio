import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAppStore } from './store/app'
import { AppShell } from './components/layout/AppShell'
import { HomeTab } from './components/tabs/HomeTab'
import { WeightsTab } from './components/tabs/weights/WeightsTab'
import { BodyWeightTab } from './components/tabs/BodyWeightTab'
import { CardioTab } from './components/tabs/CardioTab'
import { MobilityTab } from './components/tabs/MobilityTab'
import { SkillsTab } from './components/tabs/SkillsTab'
import { DonationsTab } from './components/tabs/DonationsTab'
import { WaterTab } from './components/tabs/WaterTab'
import { ProgramTab } from './components/tabs/ProgramTab'
import { ProfileTab } from './components/tabs/ProfileTab'
import { HomeSkeleton } from './components/tabs/HomeSkeleton'

const DRAWER_TABS = ['Weights', 'Body Weight', 'Cardio', 'Mobility', 'Skills', 'Donations', 'Water'] as const
type DrawerTab = typeof DRAWER_TABS[number]
type Tab = 'Home' | 'Program' | 'Profile' | DrawerTab

function TabContent({ tab, setTab }: { tab: Tab; setTab: (t: string) => void }) {
  switch (tab) {
    case 'Home': return <HomeTab setTab={setTab} />
    case 'Program': return <ProgramTab />
    case 'Weights': return <WeightsTab />
    case 'Body Weight': return <BodyWeightTab />
    case 'Cardio': return <CardioTab />
    case 'Mobility': return <MobilityTab />
    case 'Skills': return <SkillsTab />
    case 'Donations': return <DonationsTab />
    case 'Water': return <WaterTab />
    case 'Profile': return <ProfileTab />
  }
}

export default function App() {
  const [tab, setTab] = useState<Tab>('Home')
  const { loading, bootstrap } = useAppStore()

  useEffect(() => { bootstrap() }, [])

  return (
    <AppShell tab={tab} setTab={(t) => setTab(t as Tab)}>
      {loading ? (
        <HomeSkeleton />
      ) : (
        <Routes>
          <Route path="*" element={<TabContent tab={tab} setTab={(t) => setTab(t as Tab)} />} />
        </Routes>
      )}
    </AppShell>
  )
}
