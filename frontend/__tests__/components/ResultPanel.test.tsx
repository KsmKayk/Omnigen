import { render, screen } from '@testing-library/react'
import { ResultPanel } from '../../src/components/ResultPanel'

const PROPS = {
  title: 'Zeus: O Rei dos Deuses',
  videoPath: '/api/generation/gen1/video',
  thumbnails: [
    '/api/generation/gen1/thumb1',
    '/api/generation/gen1/thumb2',
    '/api/generation/gen1/thumb3',
  ],
  tags: ['Zeus', 'mitologia', 'deuses gregos'],
  description: 'Descubra os segredos de Zeus, rei do Olimpo.',
}

describe('ResultPanel', () => {
  it('renders the video title', () => {
    render(<ResultPanel {...PROPS} />)
    expect(screen.getByText('Zeus: O Rei dos Deuses')).toBeInTheDocument()
  })

  it('renders a video element with correct src', () => {
    render(<ResultPanel {...PROPS} />)
    const video = screen.getByTestId('result-video') as HTMLVideoElement
    expect(video).toBeInTheDocument()
    expect(video.src).toContain('/api/generation/gen1/video')
  })

  it('renders all 3 thumbnails', () => {
    render(<ResultPanel {...PROPS} />)
    const thumbs = screen.getAllByTestId('result-thumbnail')
    expect(thumbs).toHaveLength(3)
  })

  it('renders all tags as badges', () => {
    render(<ResultPanel {...PROPS} />)
    expect(screen.getByText('Zeus')).toBeInTheDocument()
    expect(screen.getByText('mitologia')).toBeInTheDocument()
    expect(screen.getByText('deuses gregos')).toBeInTheDocument()
  })

  it('renders the description text', () => {
    render(<ResultPanel {...PROPS} />)
    expect(screen.getByText(PROPS.description)).toBeInTheDocument()
  })

  it('renders a download link for the video', () => {
    render(<ResultPanel {...PROPS} />)
    const link = screen.getByRole('link', { name: /baixar vídeo/i })
    expect(link).toHaveAttribute('href', PROPS.videoPath)
    expect(link).toHaveAttribute('download')
  })
})
