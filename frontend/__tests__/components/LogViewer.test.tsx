import { render, screen, fireEvent } from '@testing-library/react'
import { LogViewer } from '../../src/components/LogViewer'
import type { LogRecord } from '../../src/types'

const LOGS: LogRecord[] = [
  { id: 1, level: 'info', message: 'Server started', source: 'backend', contextJson: null, createdAt: 1700000000000 },
  { id: 2, level: 'error', message: 'FFmpeg not found', source: 'backend', contextJson: '{"path":"/usr/bin/ffmpeg"}', createdAt: 1700000001000 },
  { id: 3, level: 'info', message: 'Title picker shown', source: 'frontend', contextJson: null, createdAt: 1700000002000 },
]

describe('LogViewer', () => {
  it('renders all log entries', () => {
    render(<LogViewer logs={LOGS} />)
    expect(screen.getByText('Server started')).toBeInTheDocument()
    expect(screen.getByText('FFmpeg not found')).toBeInTheDocument()
    expect(screen.getByText('Title picker shown')).toBeInTheDocument()
  })

  it('filters logs by search term', () => {
    render(<LogViewer logs={LOGS} />)
    fireEvent.change(screen.getByPlaceholderText(/pesquisar/i), { target: { value: 'FFmpeg' } })
    expect(screen.getByText('FFmpeg not found')).toBeInTheDocument()
    expect(screen.queryByText('Server started')).not.toBeInTheDocument()
  })

  it('filters logs by level', () => {
    render(<LogViewer logs={LOGS} />)
    fireEvent.change(screen.getByRole('combobox', { name: /nível/i }), { target: { value: 'error' } })
    expect(screen.getByText('FFmpeg not found')).toBeInTheDocument()
    expect(screen.queryByText('Server started')).not.toBeInTheDocument()
  })

  it('filters logs by source', () => {
    render(<LogViewer logs={LOGS} />)
    fireEvent.change(screen.getByRole('combobox', { name: /origem/i }), { target: { value: 'frontend' } })
    expect(screen.getByText('Title picker shown')).toBeInTheDocument()
    expect(screen.queryByText('Server started')).not.toBeInTheDocument()
  })

  it('shows empty state when no logs match filter', () => {
    render(<LogViewer logs={LOGS} />)
    fireEvent.change(screen.getByPlaceholderText(/pesquisar/i), { target: { value: 'xyznonexistent' } })
    expect(screen.getByText(/nenhum log encontrado/i)).toBeInTheDocument()
  })
})
