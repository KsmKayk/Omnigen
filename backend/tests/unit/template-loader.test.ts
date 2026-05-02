import path from 'path'
import fs from 'fs'
import { loadTemplate } from '../../src/lib/template-loader'

describe('loadTemplate', () => {
  const tmpFile = path.join(__dirname, 'test_template.txt')

  beforeAll(() => {
    fs.writeFileSync(tmpFile, 'Hello {{name}}, your type is {{type}}.')
  })

  afterAll(() => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile)
  })

  it('fills all placeholders', () => {
    const fill = loadTemplate(tmpFile)
    const result = fill({ name: 'Zeus', type: 'short' })
    expect(result).toBe('Hello Zeus, your type is short.')
  })

  it('throws if template file does not exist', () => {
    expect(() => loadTemplate('/nonexistent/path.txt')).toThrow()
  })

  it('leaves unreplaced placeholders when key is missing', () => {
    const fill = loadTemplate(tmpFile)
    const result = fill({ name: 'Zeus' })
    expect(result).toContain('{{type}}')
  })

  it('returns same result on multiple calls (content cached at load time)', () => {
    const fill = loadTemplate(tmpFile)
    expect(fill({ name: 'A', type: 'B' })).toBe(fill({ name: 'A', type: 'B' }))
  })
})
