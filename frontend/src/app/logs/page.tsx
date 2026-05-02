'use client'

import { useState, useEffect, useCallback } from 'react'
import { LogViewer } from '../../components/LogViewer'
import { getLogs } from '../../lib/api'
import type { LogRecord } from '../../types'

export default function LogsPage() {
  const [logs, setLogs] = useState<LogRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(() => {
    setLoading(true)
    getLogs(200)
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-near-black">Logs</h1>
        <p className="text-cool-gray text-sm mt-1">
          Logs do backend e do frontend em tempo real.
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <svg className="h-5 w-5 animate-spin text-brand" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      )}

      {!loading && <LogViewer logs={logs} onRefresh={fetchLogs} />}
    </div>
  )
}
