import fs from 'fs'
import path from 'path'

describe('design tokens', () => {
  const tokensPath = path.join(__dirname, '../../src/styles/design-tokens.css')

  it('design-tokens.css file exists', () => {
    expect(fs.existsSync(tokensPath)).toBe(true)
  })

  it('contains kraken purple token', () => {
    const content = fs.readFileSync(tokensPath, 'utf-8')
    expect(content).toContain('#7132f5')
  })

  it('contains near-black token', () => {
    const content = fs.readFileSync(tokensPath, 'utf-8')
    expect(content).toContain('#101114')
  })
})
