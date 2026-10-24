import { describe, expect, it } from 'vitest'
import { comparisonRun, comparisons, timedComparisonRun, type CompareId } from './comparison'

describe('算法对比共用输入', () => {
  it.each(Object.keys(comparisons) as CompareId[])('%s 两侧都生成可同步播放的步骤', id => {
    const config = comparisons[id]
    const [left, right] = comparisonRun(id, config.input, config.target ?? 0, config.edges ?? '')
    expect(left.length).toBeGreaterThan(1)
    expect(right.length).toBeGreaterThan(1)
    expect(left[0].state.values).toEqual(right[0].state.values)
    expect(left.at(-1)?.state.values).toEqual(right.at(-1)?.state.values)
  })

  it('折半查找拒绝未排序输入', () => {
    expect(() => comparisonRun('search', '3, 1, 2', 2, '')).toThrow('升序')
  })
  it('浏览器计算耗时与两侧步骤分开记录', () => {
    const result = timedComparisonRun('stableSort', '3, 1, 2', 0, '')
    expect(result.runs[0].at(-1)?.state.values).toEqual([1, 2, 3])
    expect(result.runs[1].at(-1)?.state.values).toEqual([1, 2, 3])
    expect(result.milliseconds.every(value => Number.isFinite(value) && value >= 0)).toBe(true)
  })
})
