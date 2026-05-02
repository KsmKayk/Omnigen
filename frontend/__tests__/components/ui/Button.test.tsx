import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../../../src/components/ui/Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Gerar</Button>)
    expect(screen.getByRole('button', { name: 'Gerar' })).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = jest.fn()
    render(<Button onClick={onClick}>Clique</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('shows disabled state', () => {
    render(<Button disabled>Desabilitado</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows loading state with aria-busy', () => {
    render(<Button loading>Carregando</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('applies variant=outline styles', () => {
    render(<Button variant="outline">Outline</Button>)
    expect(screen.getByRole('button')).toHaveClass('border-brand-dark')
  })
})
