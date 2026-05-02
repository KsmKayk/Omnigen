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

function parseTags(raw: string | null): string[] {
  try {
    const parsed = JSON.parse(raw ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function thumbnailUrls(id: string): string[] {
  return [1, 2, 3].map((n) => `/output/${id}/thumb${n}.jpg`)
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
    <ul className="space-y-4">
      {records.map((record) => {
        const tags = parseTags(record.tags)
        const thumbs = thumbnailUrls(record.id)
        const videoUrl = `/output/${record.id}/video.mp4`

        return (
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
              <div className="flex-shrink-0 flex items-center gap-2">
                {record.status === 'completed' && (
                  <>
                    <a
                      href={videoUrl}
                      download
                      className="inline-flex items-center gap-1 rounded-button border border-brand bg-white px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand hover:text-white transition-colors"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Baixar
                    </a>
                    <Badge variant="success">Concluído</Badge>
                  </>
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

            {record.status === 'completed' && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {thumbs.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`Thumbnail ${i + 1}`}
                      className="w-full aspect-video object-cover rounded-button border border-border-gray"
                    />
                  ))}
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block rounded-badge bg-soft-lavender px-2 py-0.5 text-xs font-medium text-brand"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {record.description && (
                  <p className="text-sm text-cool-gray line-clamp-3">{record.description}</p>
                )}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
