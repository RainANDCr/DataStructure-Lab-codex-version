import { describe, expect, it } from 'vitest'
import { generateMemorySteps, MemoryMachine, memoryScenarios, type MemoryScenario } from './memorySimulator'
import { Timeline } from './timeline'

describe('教学模拟内存', () => {
  it.each(Object.keys(memoryScenarios) as MemoryScenario[])('%s 步骤可序列化且代码映射有效', scenario => {
    const steps = generateMemorySteps(scenario)
    expect(steps.length).toBeGreaterThan(1)
    expect(() => JSON.stringify(steps)).not.toThrow()
    steps.forEach((step, index) => {
      expect(step.stepIndex).toBe(index)
      for (const language of ['C', 'C++'] as const) expect(memoryScenarios[scenario].code[language][step.highlightedLines[language][0] - 1]).toBeTruthy()
    })
  })

  it('单链表插入、删除与双链表插入保持指针和数据一致', () => {
    for (const scenario of ['insert', 'remove', 'doubleInsert'] as const) {
      const steps = generateMemorySteps(scenario), last = steps.at(-1)!.state
      expect(last.chain.map(id => last.objects.find(item => item.id === id)?.value)).toEqual(scenario === 'remove' ? [10, 30] : [10, 20, 30])
      expect(last.references.filter(ref => ref.name.endsWith('.next') && last.chain.includes(ref.name.split('.')[0])).every(ref => ref.status !== 'dangling')).toBe(true)
      if (scenario === 'doubleInsert') expect(last.chain.map(id => last.objects.find(item => item.id === id)?.prev ?? null)).toEqual([null, last.chain[0], last.chain[1]])
    }
    const remove = generateMemorySteps('remove')
    expect(remove.some(step => step.state.references.some(ref => ref.name === 'victim' && ref.status === 'dangling'))).toBe(true)
    expect(remove.at(-1)?.state.references.find(ref => ref.name === 'victim')?.status).toBe('null')
  })

  it('回退恢复对象生命周期、引用和链表快照', () => {
    const steps = generateMemorySteps('remove'), timeline = new Timeline(steps)
    const before = steps.findIndex(step => step.phase === 'unlink'), after = steps.findIndex(step => step.phase === 'free')
    timeline.seek(after)
    expect(timeline.getSnapshot().steps[timeline.getSnapshot().index].state.objects.find(item => item.value === 20)?.status).toBe('freed')
    timeline.seek(before)
    expect(timeline.getSnapshot().steps[timeline.getSnapshot().index].state.objects.find(item => item.value === 20)?.status).toBe('allocated')
    expect(steps[0].state.chain).toHaveLength(3)
    timeline.dispose()
  })

  it('阻止重复释放和释放后写入；错误案例只展示警告', () => {
    const machine = new MemoryMachine(), id = machine.allocate(10)
    machine.free(id)
    expect(() => machine.free(id)).toThrow('重复释放')
    expect(() => machine.write(id, 20)).toThrow('已释放')
    for (const scenario of ['nullDeref', 'dangling', 'useAfterFree', 'leak', 'brokenLink', 'overwrite', 'outOfBounds'] as const) expect(generateMemorySteps(scenario).at(-1)?.state.warnings.length).toBeGreaterThan(0)
  })
  it('栈变量与数组元素显示稳定的模拟地址', () => {
    const pointer = generateMemorySteps('pointer')
    const first = pointer[0].state.objects[0]
    expect(first.ownerFrame).toBe('main()')
    expect(pointer.at(-1)?.state.frames[0].locals.find(local => local.name === 'a')).toMatchObject({ value: '20', address: first.address })
    expect(pointer.at(-1)?.state.references.find(ref => ref.name === 'p')).toMatchObject({ target: first.id, status: 'valid' })
    expect(generateMemorySteps('outOfBounds')[0].state.frames[0].locals.map(local => local.name)).toEqual(['a[0]', 'a[1]', 'a[2]'])
  })
})
