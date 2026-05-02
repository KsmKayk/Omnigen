import { TabNav } from './ui/TabNav'

export function AppHeader() {
  return (
    <header>
      <div className="mx-auto max-w-5xl px-6 py-4 flex items-center gap-3">
        <span className="text-xl font-bold tracking-tight text-near-black">Omnigen</span>
        <span className="text-xs font-medium text-silver-blue bg-[rgba(104,107,130,0.08)] px-2 py-0.5 rounded-badge">
          beta
        </span>
      </div>
      <TabNav />
    </header>
  )
}
