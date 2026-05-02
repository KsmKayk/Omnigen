import { render, screen } from '@testing-library/react'
import { TabNav } from '../../../src/components/ui/TabNav'

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

describe('TabNav', () => {
  it('renders all three tabs', () => {
    render(<TabNav />)
    expect(screen.getByText('Gerador')).toBeInTheDocument()
    expect(screen.getByText('Histórico')).toBeInTheDocument()
    expect(screen.getByText('Logs')).toBeInTheDocument()
  })

  it('marks current tab as active', () => {
    render(<TabNav />)
    const activeLink = screen.getByText('Gerador').closest('a')
    expect(activeLink).toHaveClass('text-brand')
  })
})
