import { Badge } from './ui/Badge'

interface ResultPanelProps {
  title: string
  videoPath: string
  thumbnails: string[]
  tags: string[]
  description: string
}

export function ResultPanel({ title, videoPath, thumbnails, tags, description }: ResultPanelProps) {
  return (
    <div className="w-full space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-silver-blue mb-1">
          Título do vídeo
        </p>
        <h2 className="text-2xl font-bold text-near-black leading-tight">{title}</h2>
      </div>

      <div className="rounded-card overflow-hidden shadow-subtle border border-border-gray bg-near-black">
        <video
          data-testid="result-video"
          src={videoPath}
          controls
          className="w-full"
          preload="metadata"
        />
      </div>

      <a
        href={videoPath}
        download
        className="inline-flex items-center gap-2 rounded-button border border-brand-dark px-4 py-[13px] text-base font-medium text-brand-dark hover:bg-brand-subtle transition-colors"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M7.47 10.78a.75.75 0 001.06 0l3.75-3.75a.75.75 0 00-1.06-1.06L8.75 8.44V1.75a.75.75 0 00-1.5 0v6.69L4.78 5.97a.75.75 0 00-1.06 1.06l3.75 3.75zM3.75 13a.75.75 0 000 1.5h8.5a.75.75 0 000-1.5h-8.5z" />
        </svg>
        Baixar vídeo
      </a>

      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-silver-blue mb-3">
          Thumbnails
        </p>
        <div className="grid grid-cols-3 gap-3">
          {thumbnails.map((src, i) => (
            <div key={i} className="rounded-card overflow-hidden border border-border-gray shadow-micro">
              <img
                data-testid="result-thumbnail"
                src={src}
                alt={`Thumbnail ${i + 1}`}
                className="w-full aspect-video object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-card border border-border-gray bg-white p-5 shadow-micro">
        <p className="text-xs font-medium uppercase tracking-wider text-silver-blue mb-2">
          Descrição
        </p>
        <p className="text-base text-near-black leading-relaxed">{description}</p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-silver-blue mb-3">
          Tags sugeridas
        </p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="neutral">{tag}</Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
