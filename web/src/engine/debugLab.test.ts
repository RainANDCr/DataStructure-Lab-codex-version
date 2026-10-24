import { describe, expect, it } from 'vitest'
import { errorCases, errorCaseSteps, nextOperation, runBubbleBoundaries, traceExample, traceExamples, type ErrorCaseId } from './debugLab'
import { Timeline } from './timeline'

describe('代码调试与错误实验室', () => {
  it('内置冒泡与折半跟踪保留完整快照和代码映射', () => {
    for (const example of ['bubble', 'binary'] as const) {
      const { code, steps } = traceExample(example, traceExamples[example].input)
      expect(steps.length).toBeGreaterThan(1)
      expect(() => JSON.stringify(steps)).not.toThrow()
      steps.forEach((step, i) => {
        expect(step.stepIndex).toBe(i)
        for (const language of ['C', 'C++'] as const) for (const line of step.highlightedLines[language]) expect(code[language][line - 1]).toBeTruthy()
      })
      const timeline = new Timeline(steps)
      timeline.seek(steps.length - 1)
      timeline.seek(1)
      expect(timeline.getSnapshot().steps[1].state).toEqual(steps[1].state)
      timeline.dispose()
    }
  })

  it('十个错误案例有确定性步骤、错误定位和修复依据', () => {
    expect(Object.keys(errorCases)).toHaveLength(10)
    for (const id of Object.keys(errorCases) as ErrorCaseId[]) {
      const item = errorCases[id], steps = errorCaseSteps(id)
      expect(steps.length).toBeGreaterThan(1)
      expect(errorCaseSteps(id)).toEqual(steps)
      expect(() => JSON.stringify(steps)).not.toThrow()
      expect(item.expectedBehavior).toBeTruthy()
      expect(item.faultyBehavior).toBeTruthy()
      expect(item.explanation).toBeTruthy()
      expect(item.fixedCode.length).toBeGreaterThan(0)
      for (const point of item.checkpoints) expect(item.sourceCode.C[point.line - 1]).toBeTruthy()
      steps.forEach((step, i) => {
        expect(step.stepIndex).toBe(i)
        expect(item.sourceCode.C[step.highlightedLines.C[0] - 1]).toBeTruthy()
      })
    }
  })

  it('关键错误展示可追溯的错误状态', () => {
    const binary = errorCaseSteps('binaryBoundary')
    expect(binary.at(-1)?.variables).toMatchObject({ low: 2, high: 2 })
    expect(binary.at(-1)?.state.warning).toContain('目标存在')
    const linked = errorCaseSteps('linkedInsert')
    expect(linked.at(-1)?.variables).toMatchObject({ headNext: 20, freshNext: 20 })
    expect(linked.at(-1)?.state.values).toEqual([10, 20])
    expect(errorCaseSteps('useAfterFree').some(step => step.state.memory?.objects.some(object => object.status === 'freed'))).toBe(true)
  })

  it('下一步预测只依据结构化操作事件', () => {
    const steps = traceExample('bubble', '2,1').steps
    expect(nextOperation(steps.find(step => step.operations[0]?.type === 'COMPARE')!)).toBe('COMPARE')
    expect(nextOperation(steps.find(step => step.operations[0]?.type === 'SWAP')!)).toBe('SWAP')
    expect(nextOperation(steps[0])).toBe('OTHER')
  })

  it('八组边界输入按真实排序结果或校验错误判定', () => {
    const results = runBubbleBoundaries()
    expect(results).toHaveLength(8)
    expect(results.every(result => result.passed)).toBe(true)
    expect(results.find(result => result.title === '空输入')?.actual).toEqual([])
    expect(results.find(result => result.title === '非法输入')?.actual).toBeNull()
  })
})
