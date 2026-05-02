import { render, screen } from '@testing-library/react'
import { AppHeader } from '../../src/components/AppHeader'

jest.mock('next/navigation', () => ({ usePathname: () => '/' }))

describe('AppHeader', () => {
  it('renders Omnigen brand name', () => {
    render(<AppHeader />)
    expect(screen.getByText('Omnigen')).toBeInTheDocument()
  })

  it('renders all 3 navigation tabs', () => {
    render(<AppHeader />)
    expect(screen.getByText('Gerador')).toBeInTheDocument()
    expect(screen.getByText('Histórico')).toBeInTheDocument()
    expect(screen.getByText('Logs')).toBeInTheDocument()
  })
})
