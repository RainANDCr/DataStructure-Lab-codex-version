import { describe, expect, it } from 'vitest'
import { Timeline } from './timeline'
import { generateRecursionSteps, parseRecursionInput, recursionCases, type RecursionCase } from './recursion'

describe('递归调用栈', () => {
  it.each(Object.keys(recursionCases) as RecursionCase[])('%s 步骤和代码映射可序列化', kind => {
    const steps = generateRecursionSteps(kind, parseRecursionInput(kind, recursionCases[kind].input))
    expect(steps.length).toBeGreaterThan(1)
    expect(() => JSON.stringify(steps)).not.toThrow()
    steps.forEach((step, i) => {
      expect(step.stepIndex).toBe(i)
      expect(recursionCases[kind].code[step.highlightedLines.C[0] - 1]).toBeTruthy()
      expect(step.state.frames.every(frame => frame.depth < 18)).toBe(true)
      expect(step.state.calls.every(call => call.depth < 18)).toBe(true)
    })
    expect(steps.at(-1)?.state.frames).toEqual([])
    expect(steps.some(step => step.operations[0].type === 'RETURN')).toBe(true)
    expect(steps.some(step => step.operations[0].type === 'FRAME_POP')).toBe(true)
  })

  it('前中后序同步输出，回退恢复调用树、栈帧和当前节点', () => {
    const values = [8, 4, 12, 2, 6, 10, 14]
    const expected = { preorder: [8, 4, 2, 6, 12, 10, 14], inorder: [2, 4, 6, 8, 10, 12, 14], postorder: [2, 6, 4, 10, 14, 12, 8] }
    for (const kind of ['preorder', 'inorder', 'postorder'] as const) {
      const steps = generateRecursionSteps(kind, values)
      expect(steps.at(-1)?.state.output).toEqual(expected[kind])
      expect([...steps].reverse().find(step => step.phase === 'FRAME_POP')?.state.active).toEqual([])
      const firstVisit = steps.findIndex(step => step.phase === 'VISIT')
      const timeline = new Timeline(steps)
      timeline.seek(firstVisit + 4)
      const after = timeline.getSnapshot().steps[timeline.getSnapshot().index].state
      timeline.seek(firstVisit)
      const before = timeline.getSnapshot().steps[timeline.getSnapshot().index].state
      expect(before.output.length).toBeLessThanOrEqual(after.output.length)
      expect(before.frames.length).toBeGreaterThan(0)
      expect(before.calls.length).toBeLessThanOrEqual(after.calls.length)
      expect(before.active).toHaveLength(1)
      timeline.seek(firstVisit + 4)
      expect(timeline.getSnapshot().steps[timeline.getSnapshot().index].state).toEqual(after)
      timeline.dispose()
    }
  })

  it('阶乘、排序和 DFS 的结果正确', () => {
    expect(generateRecursionSteps('factorial', [5]).at(-1)?.state.calls[0].result).toBe(120)
    for (const kind of ['quick', 'merge'] as const) expect(generateRecursionSteps(kind, [3, 1, 3, -2]).at(-1)?.state.values).toEqual([-2, 1, 3, 3])
    expect(generateRecursionSteps('dfs', [0, 1, 2, 3]).at(-1)?.state.output).toEqual([0, 1, 3, 2])
  })

  it('限制输入规模和格式', () => {
    expect(() => parseRecursionInput('factorial', '9')).toThrow()
    expect(() => parseRecursionInput('quick', '1,2,3,4,5,6,7,8,9')).toThrow()
    expect(() => parseRecursionInput('dfs', '1,1')).toThrow()
    expect(() => parseRecursionInput('preorder', '1,a')).toThrow()
  })
})
