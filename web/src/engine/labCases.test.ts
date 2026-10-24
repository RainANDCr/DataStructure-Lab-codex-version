import { describe, expect, it, vi } from 'vitest'
import { parseLabCase, readLabCases, saveLabCase } from './labCases'

describe('版本化算法案例', () => {
  it('导入前验证算法、版本、输入与选项', () => {
    const valid = { version: 1, algorithmId: 'graph', input: '0, 1', options: { order: 'bfs', edges: '0-1:4', start: 0 } }
    expect(parseLabCase(JSON.stringify(valid))).toEqual(valid)
    expect(() => parseLabCase(JSON.stringify({ ...valid, version: 2 }))).toThrow('版本')
    expect(() => parseLabCase(JSON.stringify({ ...valid, options: { ...valid.options, edges: '0-3' } }))).toThrow('越界')
    expect(() => parseLabCase(JSON.stringify({ ...valid, options: { hacked: true } }))).toThrow('选项')
    expect(parseLabCase(JSON.stringify({ ...valid, positions: { 0: { x: 100, y: 40 } } })).positions?.[0]).toEqual({ x: 100, y: 40 })
    expect(() => parseLabCase(JSON.stringify({ ...valid, positions: { 0: { x: 1000, y: 40 } } }))).toThrow('位置')
    expect(parseLabCase(JSON.stringify({ version: 1, algorithmId: 'merge', input: '3, 1', options: {} })).algorithmId).toBe('merge')
  })
  it('拒绝覆盖损坏的案例记录，且不影响旧学习进度', () => {
    const data = new Map<string, string>([['datastruct-cases-v1', '{bad'], ['datastruct-completed', '["bubble"]']])
    vi.stubGlobal('localStorage', { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) })
    expect(readLabCases()).toEqual([])
    expect(() => saveLabCase({ version: 1, algorithmId: 'bubble', input: '2, 1', options: {} })).toThrow('已有案例数据无法读取')
    expect(data.get('datastruct-cases-v1')).toBe('{bad')
    expect(data.get('datastruct-completed')).toBe('["bubble"]')
    vi.unstubAllGlobals()
  })
  it('拒绝覆盖未来版本案例', () => {
    const data = new Map([['datastruct-cases-v1', JSON.stringify([{ version: 2, algorithmId: 'bubble', input: '2, 1', options: {} }])]])
    vi.stubGlobal('localStorage', { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) })
    expect(() => saveLabCase({ version: 1, algorithmId: 'bubble', input: '2, 1', options: {} })).toThrow('不兼容')
    expect(JSON.parse(data.get('datastruct-cases-v1')!)[0].version).toBe(2)
    vi.unstubAllGlobals()
  })
})
