import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GenerationForm } from '../../src/components/GenerationForm'

const mockOnSubmit = jest.fn()

describe('GenerationForm', () => {
  beforeEach(() => mockOnSubmit.mockReset())

  it('renders theme input and video type selector', () => {
    render(<GenerationForm onSubmit={mockOnSubmit} disabled={false} />)
    expect(screen.getByPlaceholderText(/ex: zeus/i)).toBeInTheDocument()
    expect(screen.getByText('Vídeo Curto')).toBeInTheDocument()
    expect(screen.getByText('Vídeo Longo')).toBeInTheDocument()
  })

  it('calls onSubmit with theme and videoType', async () => {
    const user = userEvent.setup()
    render(<GenerationForm onSubmit={mockOnSubmit} disabled={false} />)

    await user.type(screen.getByPlaceholderText(/ex: zeus/i), 'Cleopatra')
    fireEvent.click(screen.getByText('Vídeo Longo'))
    fireEvent.click(screen.getByRole('button', { name: /gerar/i }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('Cleopatra', 'long')
    })
  })

  it('defaults to short video type', async () => {
    render(<GenerationForm onSubmit={mockOnSubmit} disabled={false} />)
    await userEvent.type(screen.getByPlaceholderText(/ex: zeus/i), 'Zeus')
    fireEvent.click(screen.getByRole('button', { name: /gerar/i }))
    await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledWith('Zeus', 'short'))
  })

  it('does not submit when theme is empty', async () => {
    render(<GenerationForm onSubmit={mockOnSubmit} disabled={false} />)
    fireEvent.click(screen.getByRole('button', { name: /gerar/i }))
    expect(mockOnSubmit).not.toHaveBeenCalled()
    expect(screen.getByText(/informe um tema/i)).toBeInTheDocument()
  })

  it('disables form when disabled=true', () => {
    render(<GenerationForm onSubmit={mockOnSubmit} disabled={true} />)
    expect(screen.getByRole('button', { name: /gerar/i })).toBeDisabled()
  })
})
