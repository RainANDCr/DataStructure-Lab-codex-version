import { afterEach, describe, expect, it, vi } from 'vitest'
import { save } from './storage'

afterEach(() => vi.unstubAllGlobals())
describe('旧设置兼容写入', () => {
  it('does not overwrite malformed or future legacy data', () => {
    const data = new Map([['datastruct-completed', '{"version":2,"ids":["bubble"]}'], ['datastruct-theme', '{bad']])
    vi.stubGlobal('localStorage', { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) })
    expect(save('datastruct-completed', ['bubble'])).toBe(false)
    expect(save('datastruct-theme', 'dark')).toBe(false)
    expect(data.get('datastruct-completed')).toBe('{"version":2,"ids":["bubble"]}')
    expect(data.get('datastruct-theme')).toBe('{bad')
  })
  it('still saves the known formats', () => {
    const data = new Map([['datastruct-completed', '["bubble"]'], ['datastruct-theme', '"light"']])
    vi.stubGlobal('localStorage', { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) })
    expect(save('datastruct-completed', ['bubble', 'quick'])).toBe(true)
    expect(save('datastruct-theme', 'dark')).toBe(true)
    expect(data.get('datastruct-theme')).toBe('"dark"')
  })
})
