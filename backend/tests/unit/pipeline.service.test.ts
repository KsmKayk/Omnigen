process.env.OPENROUTER_API_KEY = 'test'
process.env.PEXELS_API_KEY = 'test'

import { runPipeline } from '../../src/services/pipeline.service'
import * as scriptSvc from '../../src/services/script.service'
import * as assetSearchSvc from '../../src/services/asset-search.service'
import * as assetDownloadSvc from '../../src/services/asset-download.service'
import * as ttsSvc from '../../src/services/tts.service'
import * as subtitleSvc from '../../src/services/subtitle.service'
import * as renderSvc from '../../src/services/render.service'
import * as thumbnailSvc from '../../src/services/thumbnail.service'
import * as tagsSvc from '../../src/services/tags.service'
import * as descSvc from '../../src/services/description.service'
import type { ProgressEvent, SceneBlock, AssetRecord } from '../../src/types'

jest.mock('../../src/services/script.service')
jest.mock('../../src/services/asset-search.service')
jest.mock('../../src/services/asset-download.service')
jest.mock('../../src/services/tts.service')
jest.mock('../../src/services/subtitle.service')
jest.mock('../../src/services/render.service')
jest.mock('../../src/services/thumbnail.service')
jest.mock('../../src/services/tags.service')
jest.mock('../../src/services/description.service')

const MOCK_SCENES: SceneBlock[] = [
  { sceneId: 1, description: 'Abertura', narration: 'Zeus governava o olimpo.' },
]

const MOCK_ASSETS: AssetRecord[] = [
  { sceneId: 1, type: 'image', url: 'https://example.com/1.jpg', localPath: '/tmp/scene_1.jpg', width: 1080, height: 1920 },
]

;(scriptSvc.generateScript as jest.Mock).mockResolvedValue(MOCK_SCENES)
;(assetSearchSvc.searchImages as jest.Mock).mockResolvedValue({ url: 'https://example.com/1.jpg', width: 1080, height: 1920 })
;(assetSearchSvc.searchVideos as jest.Mock).mockResolvedValue(null)
;(assetDownloadSvc.downloadAsset as jest.Mock).mockResolvedValue(undefined)
;(assetDownloadSvc.ensureDir as jest.Mock).mockReturnValue(undefined)
;(ttsSvc.synthesizeSpeech as jest.Mock).mockResolvedValue('/tmp/narration.wav')
;(ttsSvc.buildNarrationText as jest.Mock).mockReturnValue('Zeus governava o olimpo.')
;(subtitleSvc.generateSubtitles as jest.Mock).mockResolvedValue('/tmp/subtitles.srt')
;(renderSvc.renderVideo as jest.Mock).mockResolvedValue('/tmp/video.mp4')
;(thumbnailSvc.generateThumbnails as jest.Mock).mockResolvedValue(['/tmp/thumb1.jpg', '/tmp/thumb2.jpg', '/tmp/thumb3.jpg'])
;(tagsSvc.generateTags as jest.Mock).mockResolvedValue(['Zeus', 'mitologia'])
;(descSvc.generateDescription as jest.Mock).mockResolvedValue('Descrição do vídeo.')

describe('runPipeline', () => {
  it('emits progress events in order and returns result', async () => {
    const events: ProgressEvent[] = []
    const emit = (e: ProgressEvent) => events.push(e)

    const result = await runPipeline({
      generationId: 'gen1',
      theme: 'Zeus',
      videoType: 'short',
      selectedTitle: 'Zeus: O Rei dos Deuses',
      storagePath: '/tmp',
      emit,
    })

    const steps = events.map((e) => e.step)
    expect(steps).toContain('script')
    expect(steps).toContain('tts')
    expect(steps).toContain('render')
    expect(steps).toContain('completed')

    expect(result.videoPath).toBe('/tmp/video.mp4')
    expect(result.tags).toContain('Zeus')
  })

  it('emits error event when a service throws', async () => {
    ;(scriptSvc.generateScript as jest.Mock).mockRejectedValueOnce(
      new Error('LLM failed')
    )
    const events: ProgressEvent[] = []
    await expect(
      runPipeline({
        generationId: 'gen2',
        theme: 'Zeus',
        videoType: 'short',
        selectedTitle: 'Título',
        storagePath: '/tmp',
        emit: (e) => events.push(e),
      })
    ).rejects.toThrow('LLM failed')

    const errorEvent = events.find((e) => e.status === 'error')
    expect(errorEvent).toBeDefined()
    expect(errorEvent!.step).toBe('script')
  })
})
