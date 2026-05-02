import fs from 'fs'
import path from 'path'

const README = path.join(__dirname, '../../../README.md')

describe('README.md', () => {
  it('exists at repo root', () => {
    expect(fs.existsSync(README)).toBe(true)
  })

  it('contains product name Omnigen', () => {
    const content = fs.readFileSync(README, 'utf-8')
    expect(content).toContain('Omnigen')
  })

  it('contains setup instructions', () => {
    const content = fs.readFileSync(README, 'utf-8')
    expect(content).toContain('pnpm install')
  })

  it('contains architecture section', () => {
    const content = fs.readFileSync(README, 'utf-8')
    expect(content.toLowerCase()).toContain('architecture')
  })
})
