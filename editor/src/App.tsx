import { useEffect } from 'react'
import { AppShell } from './components/app-shell/AppShell'
import { checkBackendHealth, scheduleCompile } from './features/preview/orchestrator'
import { useDocumentStore } from './features/document/store'

export default function App() {
  // Check backend availability on mount
  useEffect(() => {
    void checkBackendHealth()
  }, [])

  // Trigger an initial compile when the app loads
  const document = useDocumentStore((s) => s.document)
  useEffect(() => {
    scheduleCompile(document)
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <AppShell />
}
