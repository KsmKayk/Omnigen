import { render, screen, fireEvent } from '@testing-library/react'
import { TitlePicker } from '../../src/components/TitlePicker'

const TITLES = ['Zeus: O Rei dos Deuses', 'A Ira do Olimpo', 'Trovões e Poder']
const mockOnSelect = jest.fn()

describe('TitlePicker', () => {
  beforeEach(() => mockOnSelect.mockReset())

  it('renders all 3 titles', () => {
    render(<TitlePicker titles={TITLES} onSelect={mockOnSelect} loading={false} />)
    TITLES.forEach((t) => expect(screen.getByText(t)).toBeInTheDocument())
  })

  it('calls onSelect with correct index on click', () => {
    render(<TitlePicker titles={TITLES} onSelect={mockOnSelect} loading={false} />)
    fireEvent.click(screen.getByText('A Ira do Olimpo'))
    expect(mockOnSelect).toHaveBeenCalledWith(1)
  })

  it('highlights selected title', () => {
    render(<TitlePicker titles={TITLES} onSelect={mockOnSelect} loading={false} selectedIndex={2} />)
    const selectedCard = screen.getByText('Trovões e Poder').closest('[data-testid="title-card"]')
    expect(selectedCard).toHaveClass('border-brand')
  })

  it('shows loading state on selected title', () => {
    render(<TitlePicker titles={TITLES} onSelect={mockOnSelect} loading={true} selectedIndex={0} />)
    expect(screen.getByTestId('title-loading')).toBeInTheDocument()
  })
})
