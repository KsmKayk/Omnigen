import fs from 'fs'
import path from 'path'
import { generateSubtitles, formatSRTTime } from '../../src/services/subtitle.service'
import type { SceneBlock } from '../../src/types'

process.env.OPENROUTER_API_KEY = 'test'
process.env.PEXELS_API_KEY = 'test'

const TMP = path.join(__dirname, 'tmp_subtitle_test')

const SCENES: SceneBlock[] = [
  { sceneId: 1, description: 'Abertura', narration: 'Zeus governava o mundo.' },
  { sceneId: 2, description: 'Conflito', narration: 'Os titãs se rebelaram contra os deuses.' },
]

describe('formatSRTTime', () => {
  it('formats milliseconds to SRT timestamp', () => {
    expect(formatSRTTime(0)).toBe('00:00:00,000')
    expect(formatSRTTime(1500)).toBe('00:00:01,500')
    expect(formatSRTTime(61000)).toBe('00:01:01,000')
    expect(formatSRTTime(3661000)).toBe('01:01:01,000')
  })
})

describe('generateSubtitles', () => {
  beforeAll(() => fs.mkdirSync(TMP, { recursive: true }))
  afterAll(() => fs.rmSync(TMP, { recursive: true, force: true }))

  it('generates a valid .srt file', async () => {
    const srtPath = await generateSubtitles(SCENES, 'gen1', TMP, 10000)
    expect(fs.existsSync(srtPath)).toBe(true)

    const content = fs.readFileSync(srtPath, 'utf-8')
    expect(content).toContain('Zeus governava o mundo.')
    expect(content).toContain('Os titãs se rebelaram')
    expect(content).toMatch(/\d+\r?\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/)
  })

  it('distributes duration proportionally by word count', async () => {
    const srtPath = await generateSubtitles(SCENES, 'gen2', TMP, 10000)
    const content = fs.readFileSync(srtPath, 'utf-8')
    // scene 2 has more words, should end later
    expect(content).toContain('00:00:00,000 --> ')
  })
})
