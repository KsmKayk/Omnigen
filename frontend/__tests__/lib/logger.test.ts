import { frontendLogger } from '../../src/lib/logger'
import * as api from '../../src/lib/api'

jest.mock('../../src/lib/api')
const mockPostLog = api.postFrontendLog as jest.MockedFunction<typeof api.postFrontendLog>

describe('frontendLogger', () => {
  beforeEach(() => mockPostLog.mockResolvedValue({ ok: true }))

  it('info sends log with level info', async () => {
    await frontendLogger.info('test message', { key: 'value' })
    expect(mockPostLog).toHaveBeenCalledWith('info', 'test message', { key: 'value' })
  })

  it('error sends log with level error', async () => {
    await frontendLogger.error('something failed')
    expect(mockPostLog).toHaveBeenCalledWith('error', 'something failed', undefined)
  })

  it('does not throw if API call fails', async () => {
    mockPostLog.mockRejectedValueOnce(new Error('network error'))
    await expect(frontendLogger.warn('warning')).resolves.not.toThrow()
  })
})
