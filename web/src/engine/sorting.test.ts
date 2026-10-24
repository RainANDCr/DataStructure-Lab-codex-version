import { describe, expect, it } from 'vitest'
import { sortAlgorithms, type SortId } from './sorting'

const newSorts: SortId[] = ['selection', 'insertion', 'quick', 'shell', 'heap', 'merge', 'radix']

describe('排序算法步骤', () => {
  it.each(newSorts)('%s 对边界、重复值和负数正确排序且不修改输入', id => {
    for (const input of [[], [7], [3, 2, 1], [0, -4, 3, 3, -4], [1, 2, 3]]) {
      const original = [...input]
      const steps = sortAlgorithms[id].generate(input)
      expect(input).toEqual(original)
      expect(steps[0].state.values).toEqual(original)
      expect(steps.at(-1)?.state.values).toEqual([...original].sort((a, b) => a - b))
      expect(steps.at(-1)?.description).toContain('完成')
    }
  })

  it.each(newSorts)('%s 每个步骤都是独立快照且有三种语言代码行', id => {
    const steps = sortAlgorithms[id].generate([3, 1, 2])
    const code = sortAlgorithms[id].code
    for (const step of steps) for (const language of ['C', 'C++', 'Python'] as const) {
      expect(step.highlightedLines[language].length).toBeGreaterThan(0)
      for (const line of step.highlightedLines[language]) expect(code[language][line - 1]).toBeTruthy()
    }
    steps.at(-1)!.state.values[0] = 99
    expect(steps[0].state.values).toEqual([3, 1, 2])
  })

  it.each(newSorts)('%s 拒绝越界整数和稀疏数组', id => {
    for (const input of [[100], [1.5], new Array<number>(2), Array(17).fill(1)]) {
      expect(() => sortAlgorithms[id].generate(input)).toThrow()
    }
  })

  it('排序步骤反映选择、插入和快速排序各自的真实比较路径', () => {
    expect(sortAlgorithms.selection.generate([1, 2, 3, 4]).at(-1)?.state.comparisons).toBe(6)
    expect(sortAlgorithms.insertion.generate([1, 2, 3, 4]).at(-1)?.state.comparisons).toBe(3)
    expect(sortAlgorithms.quick.generate([1, 2, 3, 4]).at(-1)?.state.comparisons).toBe(6)
  })

  it('多组数组的最终状态都与数值升序排序一致', () => {
    for (let seed = 0; seed < 60; seed++) {
      const input = Array.from({ length: seed % 11 }, (_, index) => ((seed * 19 + index * 37) % 21) - 10)
      for (const id of newSorts) {
        expect(sortAlgorithms[id].generate(input).at(-1)?.state.values).toEqual([...input].sort((a, b) => a - b))
      }
    }
  })

  it('归并步骤保存临时数组，堆步骤显示剩余堆区间', () => {
    expect(sortAlgorithms.merge.generate([3, 1, 2]).some(step => step.state.temp?.some(value => value !== null))).toBe(true)
    expect(sortAlgorithms.heap.generate([3, 1, 2]).some(step => step.state.heapSize === 2)).toBe(true)
    expect(sortAlgorithms.radix.generate([-99, 0, 99]).at(-1)?.state.values).toEqual([-99, 0, 99])
  })
})
