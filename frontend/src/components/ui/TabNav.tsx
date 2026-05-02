'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Gerador', href: '/' },
  { label: 'Histórico', href: '/history' },
  { label: 'Logs', href: '/logs' },
]

export function TabNav() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-border-gray bg-white sticky top-0 z-10">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex items-center gap-1">
          {TABS.map((tab) => {
            const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-brand text-brand'
                    : 'border-transparent text-cool-gray hover:text-near-black'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
