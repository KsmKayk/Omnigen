import { render, screen } from '@testing-library/react'
import { HistoryList } from '../../src/components/HistoryList'
import type { GenerationRecord } from '../../src/types'

const RECORDS: GenerationRecord[] = [
  {
    id: 'gen1',
    theme: 'Zeus',
    videoType: 'short',
    suggestedTitles: '["T1","T2","T3"]',
    selectedTitle: 'Zeus: O Rei dos Deuses',
    script: null,
    videoPath: '/storage/output/gen1/video.mp4',
    thumbnailsJson: '["/t1.jpg"]',
    tags: '["Zeus"]',
    description: 'Descrição do vídeo.',
    status: 'completed',
    error: null,
    createdAt: 1700000000000,
    updatedAt: 1700000001000,
  },
  {
    id: 'gen2',
    theme: 'Cleopatra',
    videoType: 'long',
    suggestedTitles: null,
    selectedTitle: null,
    script: null,
    videoPath: null,
    thumbnailsJson: null,
    tags: null,
    description: null,
    status: 'failed',
    error: 'FFmpeg not found',
    createdAt: 1700000002000,
    updatedAt: 1700000003000,
  },
]

describe('HistoryList', () => {
  it('renders both records', () => {
    render(<HistoryList records={RECORDS} />)
    expect(screen.getByText('Zeus')).toBeInTheDocument()
    expect(screen.getByText('Cleopatra')).toBeInTheDocument()
  })

  it('shows completed badge for completed records', () => {
    render(<HistoryList records={RECORDS} />)
    expect(screen.getByText('Concluído')).toBeInTheDocument()
  })

  it('shows failed badge for failed records', () => {
    render(<HistoryList records={RECORDS} />)
    expect(screen.getByText('Falhou')).toBeInTheDocument()
  })

  it('shows empty state when no records', () => {
    render(<HistoryList records={[]} />)
    expect(screen.getByText(/nenhum vídeo gerado/i)).toBeInTheDocument()
  })
})
