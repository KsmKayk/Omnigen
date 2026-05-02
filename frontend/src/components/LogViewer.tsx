'use client'

import { useState, useMemo } from 'react'
import type { LogRecord } from '../types'

const LEVEL_COLORS: Record<string, string> = {
  info: 'text-blue-600 bg-blue-50',
  warn: 'text-amber-600 bg-amber-50',
  error: 'text-red-600 bg-red-50',
  debug: 'text-cool-gray bg-[rgba(104,107,130,0.08)]',
}

interface LogViewerProps {
  logs: LogRecord[]
  onRefresh?: () => void
}

export function LogViewer({ logs, onRefresh }: LogViewerProps) {
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = !search || log.message.toLowerCase().includes(search.toLowerCase())
      const matchesLevel = !levelFilter || log.level === levelFilter
      const matchesSource = !sourceFilter || log.source === sourceFilter
      return matchesSearch && matchesLevel && matchesSource
    })
  }, [logs, search, levelFilter, sourceFilter])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar nas mensagens..."
          className="flex-1 min-w-48 rounded-button border border-border-gray px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        <select
          aria-label="Nível"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="rounded-button border border-border-gray px-3 py-2 text-sm focus:border-brand focus:outline-none"
        >
          <option value="">Todos os níveis</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
          <option value="debug">Debug</option>
        </select>
        <select
          aria-label="Origem"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="rounded-button border border-border-gray px-3 py-2 text-sm focus:border-brand focus:outline-none"
        >
          <option value="">Todas as origens</option>
          <option value="backend">Backend</option>
          <option value="frontend">Frontend</option>
        </select>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="rounded-button border border-border-gray px-3 py-2 text-sm text-cool-gray hover:text-near-black transition-colors"
          >
            Atualizar
          </button>
        )}
      </div>

      <p className="text-xs text-silver-blue">
        {filtered.length} de {logs.length} {logs.length === 1 ? 'entrada' : 'entradas'}
      </p>

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-cool-gray text-sm">Nenhum log encontrado com os filtros atuais.</p>
        </div>
      ) : (
        <ul className="space-y-1 font-mono text-xs">
          {filtered.map((log) => (
            <li
              key={log.id}
              className="flex items-start gap-3 rounded border border-border-gray p-3"
            >
              <span className={`flex-shrink-0 rounded px-1.5 py-0.5 font-semibold uppercase ${LEVEL_COLORS[log.level] ?? ''}`}>
                {log.level}
              </span>
              <span className="flex-shrink-0 text-silver-blue">
                {new Date(log.createdAt).toLocaleTimeString('pt-BR')}
              </span>
              <span className="flex-shrink-0 text-silver-blue">
                [{log.source}]
              </span>
              <span className="text-near-black break-all">{log.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
