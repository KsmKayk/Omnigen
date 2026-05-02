import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from '../../src/app/page'
import * as api from '../../src/lib/api'

jest.mock('../../src/lib/api')
jest.mock('../../src/hooks/useSSE', () => ({
  useSSE: () => ({
    isStreaming: false,
    progress: 0,
    steps: {},
    error: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
    reset: jest.fn(),
  }),
}))
jest.mock('../../src/lib/logger', () => ({
  frontendLogger: {
    info: jest.fn().mockResolvedValue(undefined),
    error: jest.fn().mockResolvedValue(undefined),
  },
}))

const mockStartGeneration = api.startGeneration as jest.MockedFunction<typeof api.startGeneration>
const mockSelectTitle = api.selectTitle as jest.MockedFunction<typeof api.selectTitle>

describe('Home page', () => {
  beforeEach(() => {
    mockStartGeneration.mockReset()
    mockSelectTitle.mockReset()
  })

  it('shows GenerationForm initially', () => {
    render(<Home />)
    expect(screen.getByPlaceholderText(/ex: zeus/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /gerar vídeo/i })).toBeInTheDocument()
  })

  it('shows title picker after successful generation start', async () => {
    mockStartGeneration.mockResolvedValueOnce({
      generationId: 'gen1',
      titles: ['Título 1', 'Título 2', 'Título 3'],
    })

    render(<Home />)
    await userEvent.type(screen.getByPlaceholderText(/ex: zeus/i), 'Zeus')
    fireEvent.click(screen.getByRole('button', { name: /gerar vídeo/i }))

    await waitFor(() => {
      expect(screen.getByText('Título 1')).toBeInTheDocument()
      expect(screen.getByText('Título 2')).toBeInTheDocument()
      expect(screen.getByText('Título 3')).toBeInTheDocument()
    })
  })

  it('shows error message when API fails', async () => {
    mockStartGeneration.mockRejectedValueOnce(new Error('API Key inválida'))

    render(<Home />)
    await userEvent.type(screen.getByPlaceholderText(/ex: zeus/i), 'Zeus')
    fireEvent.click(screen.getByRole('button', { name: /gerar vídeo/i }))

    await waitFor(() => {
      expect(screen.getByText(/API Key inválida/i)).toBeInTheDocument()
    })
  })
})
