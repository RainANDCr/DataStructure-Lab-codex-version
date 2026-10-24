import { describe, expect, it } from 'vitest'
import { complexityCounts } from './complexity'

describe('复杂度增长模型', () => {
  it('输入规模翻倍时保持各类别的增长关系', () => {
    expect(complexityCounts(1)).toEqual([1, 1, 1, 1, 1])
    expect(complexityCounts(16)).toEqual([1, 4, 16, 64, 256])
    expect(complexityCounts(32)).toEqual([1, 5, 32, 160, 1024])
  })
  it('拒绝范围外的规模', () => {
    expect(() => complexityCounts(0)).toThrow()
    expect(() => complexityCounts(129)).toThrow()
    expect(() => complexityCounts(1.5)).toThrow()
  })
})
