interface TitlePickerProps {
  titles: string[]
  onSelect: (index: number) => void
  loading: boolean
  selectedIndex?: number
}

export function TitlePicker({ titles, onSelect, loading, selectedIndex }: TitlePickerProps) {
  return (
    <div className="w-full space-y-3">
      <p className="text-sm font-medium text-cool-gray">
        Escolha um título para o seu vídeo
      </p>
      <ol className="space-y-2">
        {titles.map((title, i) => {
          const isSelected = selectedIndex === i
          return (
            <li key={i}>
              <button
                type="button"
                data-testid="title-card"
                onClick={() => !loading && onSelect(i)}
                disabled={loading && !isSelected}
                className={`w-full rounded-button border-2 px-5 py-4 text-left text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  isSelected
                    ? 'border-brand bg-brand-subtle text-brand'
                    : 'border-border-gray bg-white text-near-black hover:border-silver-blue'
                } ${loading && !isSelected ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span>{title}</span>
                  {isSelected && loading && (
                    <span data-testid="title-loading" className="flex-shrink-0">
                      <svg className="h-4 w-4 animate-spin text-brand" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    </span>
                  )}
                  {isSelected && !loading && (
                    <svg className="h-4 w-4 flex-shrink-0 text-brand" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                    </svg>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
