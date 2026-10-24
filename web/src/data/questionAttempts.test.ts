import { afterEach, describe, expect, it, vi } from 'vitest'
import { appendAttempts, loadAttempts, parseAttemptHistory, serializeAttemptHistory } from './questionAttempts'

describe('作答记录兼容性', () => {
  const record = { questionId: 'q-linear-01', answer: ['O(1)'], correct: true, mode: 'learn' as const, timestamp: '2026-10-24T00:00:00.000Z', version: 1 as const }
  afterEach(() => vi.unstubAllGlobals())
  it('空记录和合法版本可读取，未知旧题 ID 不丢失', () => {
    expect(parseAttemptHistory(null)).toEqual([])
    expect(parseAttemptHistory(serializeAttemptHistory([record, { ...record, questionId: 'retired-question' }]))).toHaveLength(2)
  })
  it('非法或未来格式不被静默当成空记录', () => {
    expect(parseAttemptHistory('{bad')).toBeNull()
    expect(parseAttemptHistory(JSON.stringify({ version: 2, records: [] }))).toBeNull()
    expect(parseAttemptHistory(JSON.stringify({ version: 1, records: [{ ...record, answer: 'O(1)' }] }))).toBeNull()
  })
  it('写入失败或已有格式损坏时不会覆盖用户记录', () => {
    const setItem = vi.fn()
    vi.stubGlobal('localStorage', { getItem: () => '{bad', setItem })
    expect(loadAttempts()).toBeNull()
    expect(appendAttempts([record])).toBe(false)
    expect(setItem).not.toHaveBeenCalled()
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => { throw new Error('quota') } })
    expect(appendAttempts([record])).toBe(false)
  })
})
