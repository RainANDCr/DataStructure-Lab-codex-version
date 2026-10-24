import { describe, expect, it } from 'vitest'
import { bubbleCode, bubbleSort, parseBubbleInput, playbackDelay } from './bubble'

describe('冒泡排序步骤引擎', () => {
  it('接受空输入和逗号、空格分隔的整数，拒绝越界与非法输入', () => {
    expect(parseBubbleInput('  ')).toEqual([])
    expect(parseBubbleInput('3， -2  3,0')).toEqual([3, -2, 3, 0])
    for (const value of ['1,foo', '1.2', '1e2', '100', Array(17).fill('1').join(',')]) {
      expect(() => parseBubbleInput(value)).toThrow()
    }
  })

  it('以独立快照排序，不修改输入，并记录真实比较与交换', () => {
    const input = [3, 1, 1]
    const steps = bubbleSort.generate(input)
    expect(input).toEqual([3, 1, 1])
    expect(steps[0].state.values).toEqual(input)
    expect(steps.at(-1)?.state).toMatchObject({ values: [1, 1, 3], comparisons: 3, writes: 4 })
    expect(steps[0].state.values).toEqual([3, 1, 1])
    expect(steps.some(step => step.id.startsWith('swap'))).toBe(true)
  })

  it('空数组和单元素数组也有可查看的完成状态', () => {
    for (const input of [[], [7]]) {
      const steps = bubbleSort.generate(input)
      expect(steps.length).toBeGreaterThanOrEqual(2)
      expect(steps.at(-1)?.state.values).toEqual(input)
      expect(steps.at(-1)?.description).toContain('完成')
    }
  })

  it('直接调用引擎也拒绝含空位的数组', () => {
    expect(() => bubbleSort.generate(new Array<number>(2))).toThrow()
  })

  it('每一步在 C、C++、Python 中都有对应代码行', () => {
    for (const step of bubbleSort.generate([2, 1])) {
      for (const language of ['C', 'C++', 'Python'] as const) {
        expect(step.highlightedLines[language].length).toBeGreaterThan(0)
        for (const line of step.highlightedLines[language]) {
          expect(bubbleCode[language][line - 1]).toBeTruthy()
        }
      }
    }
  })

  it('调速只改变等待时间，不改变步骤', () => {
    expect(playbackDelay(800, 0.25)).toBe(3200)
    expect(playbackDelay(800, 4)).toBe(200)
    expect(bubbleSort.generate([2, 1]).at(-1)?.state.values).toEqual([1, 2])
  })
})
