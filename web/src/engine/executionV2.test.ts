import { afterEach, describe, expect, it, vi } from 'vitest'
import { bubbleSort } from './bubble'
import { sortAlgorithms } from './sorting'
import { toExecutionSteps } from './stepAdapter'
import { Timeline } from './timeline'
import { topicDefaults, topicIds, topicRun } from './topics'

afterEach(() => vi.useRealTimers())

describe('V2 执行步骤与旧算法适配', () => {
  it('冒泡排序记录独立、可序列化的状态与操作事件', () => {
    const first = toExecutionSteps('bubble', bubbleSort.generate([3, 1, 1]))
    const again = toExecutionSteps('bubble', bubbleSort.generate([3, 1, 1]))
    expect(first).toEqual(again)
    expect(() => JSON.stringify(first)).not.toThrow()
    expect(first.map(step => step.stepIndex)).toEqual(first.map((_, i) => i))
    const compare = first.find(step => step.operations.some(event => event.type === 'COMPARE'))!
    const swap = first.find(step => step.operations.some(event => event.type === 'SWAP'))!
    expect(compare.metrics.comparisons).toBe(1)
    expect(compare.metrics.reads).toBe(2)
    expect(swap.metrics.swaps).toBe(1)
    expect(swap.metrics.writes).toBe(2)
    expect(swap.variables.temp).toBe(3)
    expect(swap.sourceMap.lines.C.length).toBeGreaterThan(0)
    expect(swap.sourceMap.lines['C++'].length).toBeGreaterThan(0)
    expect(first[0].state.values).toEqual([3, 1, 1])
    expect(first.at(-1)?.state.values).toEqual([1, 1, 3])
  })

  it('空输入、重复元素和未迁移排序模块仍可生成完整历史', () => {
    for (const input of [[], [2, 2, 1]]) {
      const legacy = sortAlgorithms.selection.generate(input)
      const adapted = toExecutionSteps('selection', legacy)
      expect(adapted.length).toBe(legacy.length)
      expect(adapted[0].operations).toEqual([])
      expect(adapted[0].phase).toBe('legacy')
      expect(adapted.at(-1)?.state.values).toEqual([...input].sort((a, b) => a - b))
      expect(adapted[0].highlightedLines).toEqual(legacy[0].highlightedLines)
    }
  })

  it('适配器复制旧状态，后续修改原步不会改写历史', () => {
    const legacy = sortAlgorithms.selection.generate([2, 1])
    const adapted = toExecutionSteps('selection', legacy)
    legacy[0].state.values[0] = 99
    expect(adapted[0].state.values).toEqual([2, 1])
    expect(adapted[0].stepId).toBe(adapted[0].id)
  })

  it('全部旧主题与排序的默认输入都可通过适配器', () => {
    for (const id of topicIds) {
      const { input, options } = topicDefaults[id]
      const steps = toExecutionSteps(id, topicRun(id, input, options).steps)
      expect(steps.length).toBeGreaterThan(0)
      expect(steps.at(-1)?.algorithmId).toBe(id)
    }
    for (const [id, algorithm] of Object.entries(sortAlgorithms)) {
      const steps = toExecutionSteps(id, algorithm.generate([3, 1, 2]))
      expect(steps.at(-1)?.state.values).toEqual([1, 2, 3])
    }
  })
})

describe('时间轴', () => {
  const make = () => new Timeline(toExecutionSteps('bubble', bubbleSort.generate([2, 1])))

  it('播放、暂停、恢复、调速与完成后重播没有竞争计时器', () => {
    vi.useFakeTimers()
    const timeline = make()
    timeline.play()
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(800)
    expect(timeline.getSnapshot().index).toBe(1)
    timeline.pause()
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(5000)
    expect(timeline.getSnapshot().index).toBe(1)
    timeline.setSpeed(4)
    timeline.play()
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(200)
    expect(timeline.getSnapshot().index).toBe(2)
    timeline.setSpeed(2)
    expect(vi.getTimerCount()).toBe(1)
    vi.runAllTimers()
    expect(timeline.getSnapshot().playing).toBe(false)
    const end = timeline.getSnapshot().index
    timeline.play()
    expect(timeline.getSnapshot().index).toBe(0)
    expect(end).toBeGreaterThan(2)
    timeline.dispose()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('连续下一步、回退、随机跳转和重置恢复整个步骤快照', () => {
    const timeline = make()
    timeline.next(); timeline.next(); timeline.next()
    expect(timeline.getSnapshot().index).toBe(3)
    const { steps } = timeline.getSnapshot()
    timeline.seek(steps.length - 1)
    expect(timeline.getSnapshot().steps[timeline.getSnapshot().index].state.values).toEqual([1, 2])
    timeline.previous()
    const current = timeline.getSnapshot()
    expect(current.steps[current.index].variables).toEqual(steps[current.index].variables)
    expect(current.steps[current.index].metrics).toEqual(steps[current.index].metrics)
    expect(current.steps[current.index].highlightedLines).toEqual(steps[current.index].highlightedLines)
    timeline.seek(9999)
    expect(timeline.getSnapshot().index).toBe(steps.length - 1)
    timeline.reset()
    expect(timeline.getSnapshot().index).toBe(0)
    expect(timeline.getSnapshot().steps[0].state.values).toEqual([2, 1])
  })

  it('切换输入和卸载清理待播放任务', () => {
    vi.useFakeTimers()
    const timeline = make()
    timeline.play()
    timeline.replace(toExecutionSteps('bubble', bubbleSort.generate([])))
    expect(timeline.getSnapshot()).toMatchObject({ index: 0, playing: false })
    expect(timeline.getSnapshot().steps[0].state.values).toEqual([])
    expect(vi.getTimerCount()).toBe(0)
    timeline.play()
    timeline.dispose()
    vi.advanceTimersByTime(5000)
    expect(timeline.getSnapshot().index).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('教学断点停在映射代码行，继续后可越过当前断点', () => {
    vi.useFakeTimers()
    const timeline = make(), line = timeline.getSnapshot().steps.find(step => step.operations.some(event => event.type === 'COMPARE'))!.highlightedLines.C[0]
    timeline.setBreakpoint(step => step.highlightedLines.C.includes(line))
    timeline.play()
    vi.runAllTimers()
    expect(timeline.getSnapshot().steps[timeline.getSnapshot().index].highlightedLines.C).toContain(line)
    expect(timeline.getSnapshot().playing).toBe(false)
    const stoppedAt = timeline.getSnapshot().index
    timeline.play()
    vi.advanceTimersByTime(800)
    expect(timeline.getSnapshot().index).toBeGreaterThan(stoppedAt)
    timeline.dispose()
  })
})
