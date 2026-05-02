import { Badge } from './ui/Badge'
import type { GenerationRecord } from '../types'

interface HistoryListProps {
  records: GenerationRecord[]
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts))
}

export function HistoryList({ records }: HistoryListProps) {
  if (records.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-cool-gray text-base">Nenhum vídeo gerado ainda.</p>
        <p className="text-silver-blue text-sm mt-1">
          Volte para a aba Gerador e crie seu primeiro vídeo.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {records.map((record) => (
        <li key={record.id} className="rounded-card border border-border-gray bg-white p-5 shadow-micro">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-near-black truncate">
                {record.selectedTitle ?? record.theme}
              </p>
              <p className="text-sm text-silver-blue mt-0.5">
                {record.selectedTitle && <><span>{record.theme}</span>{' · '}</>}
                <span>{record.videoType === 'short' ? 'Vídeo Curto' : 'Vídeo Longo'}</span>
                {' · '}
                <span>{formatDate(record.createdAt)}</span>
              </p>
              {record.error && (
                <p className="text-xs text-red-500 mt-1">{record.error}</p>
              )}
            </div>
            <div className="flex-shrink-0">
              {record.status === 'completed' && (
                <Badge variant="success">Concluído</Badge>
              )}
              {record.status === 'failed' && (
                <span className="inline-flex items-center rounded-badge bg-red-50 px-2 py-0.5 text-sm font-medium text-red-700">
                  Falhou
                </span>
              )}
              {(record.status === 'processing' || record.status === 'pending') && (
                <Badge variant="neutral">Em andamento</Badge>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
