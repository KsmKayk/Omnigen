import { render, screen } from '@testing-library/react'
import Home from '../../src/app/page'

describe('Home page', () => {
  it('renders the Omnigen heading', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { name: /omnigen/i })).toBeInTheDocument()
  })
})
