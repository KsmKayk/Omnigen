'use client'

import { useState, useEffect } from 'react'
import { HistoryList } from '../../components/HistoryList'
import { getHistory } from '../../lib/api'
import type { GenerationRecord } from '../../types'

export default function HistoryPage() {
  const [records, setRecords] = useState<GenerationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getHistory()
      .then(setRecords)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-near-black">Histórico</h1>
        <p className="text-cool-gray text-sm mt-1">Todos os vídeos gerados nesta sessão.</p>
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <svg className="h-5 w-5 animate-spin text-brand" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {!loading && !error && <HistoryList records={records} />}
    </div>
  )
}
