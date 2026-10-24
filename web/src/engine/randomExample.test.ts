import { describe, expect, it } from 'vitest'
import { randomExample } from './randomExample'
import { topicRun } from './topics'

describe('随机样例', () => {
  it.each(['array', 'linked', 'tree', 'graph'] as const)('%s 生成可执行输入', id => {
    const sample = randomExample(id)
    expect(sample.input.split(', ')).toHaveLength(6)
    const options = id === 'graph' ? { order: 'bfs' as const, start: 0, edges: sample.edges } : id === 'tree' ? { order: 'level' as const } : { operation: 'traverse' as const }
    expect(topicRun(id, sample.input, options).steps.length).toBeGreaterThan(1)
  })
})
