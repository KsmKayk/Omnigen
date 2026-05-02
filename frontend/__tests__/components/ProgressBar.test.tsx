import { render, screen } from '@testing-library/react'
import { ProgressBar } from '../../src/components/ProgressBar'
import type { StepState, PipelineStep } from '../../src/types'

const STEPS: Partial<Record<PipelineStep, StepState>> = {
  script: { status: 'done', message: 'Roteiro gerado' },
  tts: { status: 'processing', message: 'Gerando narração...' },
}

describe('ProgressBar', () => {
  it('renders progress percentage', () => {
    render(<ProgressBar progress={42} steps={STEPS} />)
    expect(screen.getByText('42%')).toBeInTheDocument()
  })

  it('renders progress bar fill at correct width', () => {
    render(<ProgressBar progress={60} steps={STEPS} />)
    const fill = document.querySelector('[data-testid="progress-fill"]')
    expect(fill).toHaveStyle({ width: '60%' })
  })

  it('shows completed steps with checkmark', () => {
    render(<ProgressBar progress={50} steps={STEPS} />)
    const doneItems = screen.getAllByTestId('step-done')
    expect(doneItems.length).toBeGreaterThan(0)
  })

  it('shows active step with spinner', () => {
    render(<ProgressBar progress={50} steps={STEPS} />)
    expect(screen.getByTestId('step-processing')).toBeInTheDocument()
  })

  it('shows step error message', () => {
    const stepsWithError: Partial<Record<PipelineStep, StepState>> = {
      render: { status: 'error', error: 'FFmpeg not found' },
    }
    render(<ProgressBar progress={65} steps={stepsWithError} />)
    expect(screen.getByText('FFmpeg not found')).toBeInTheDocument()
  })
})
