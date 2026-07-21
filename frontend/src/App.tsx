import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageContainer, PageHeader } from '@/components/layout/PageContainer'
import { ContactsPage } from '@/pages/ContactsPage'

function Placeholder({ title }: { title: string }) {
  return (
    <PageContainer>
      <PageHeader title={title} subtitle="Coming soon." />
      <div className="rounded-card bg-surface px-6 py-16 text-center text-sm text-text-secondary shadow-sm">
        This section is not built yet.
      </div>
    </PageContainer>
  )
}

const TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  interactions: 'Interactions',
  circles: 'Circles',
  reminders: 'Reminders',
}

function App() {
  const [active, setActive] = useState('contacts')

  return (
    <AppLayout active={active} onNavigate={setActive}>
      {active === 'contacts' ? <ContactsPage /> : <Placeholder title={TITLES[active] ?? 'orbit'} />}
    </AppLayout>
  )
}

export default App
