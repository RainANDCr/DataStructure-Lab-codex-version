import { parseBubbleInput } from './bubble'
import { sortAlgorithms } from './sorting'
import { topicRun } from './topics'
import type { AlgorithmStep } from './types'

export type CompareId = 'sort' | 'stableSort' | 'search' | 'graph' | 'list'
export type CompareStep = AlgorithmStep<{ values: (number | string)[]; done: number[]; comparisons: number; writes: number; output?: (number | string)[] }>
export const comparisons: Record<CompareId, { title: string; left: string; right: string; input: string; target?: number; edges?: string; note: string; links: [string, string] }> = {
  sort: { title: '冒泡排序 vs 快速排序', left: '冒泡排序', right: '快速排序', input: '8, 3, 6, 1, 5, 2', note: '同一组数据；比较次数与写入次数随当前步骤更新。', links: ['bubble', 'quick'] },
  stableSort: { title: '插入排序 vs 归并排序', left: '插入排序', right: '归并排序', input: '8, 3, 6, 1, 5, 2', note: '同一组数据；可观察插入移动与归并写回。', links: ['insertion', 'merge'] },
  search: { title: '顺序查找 vs 折半查找', left: '顺序查找', right: '折半查找', input: '1, 3, 5, 7, 9, 11, 13', target: 11, note: '折半查找要求输入升序；两侧查找同一个目标。', links: ['sequential', 'binary'] },
  graph: { title: 'BFS vs DFS', left: '广度优先 BFS', right: '深度优先 DFS', input: '0, 1, 2, 3, 4, 5', edges: '0-1, 0-2, 1-3, 1-4, 2-5', note: '两侧从下标 0 开始，邻居按下标升序访问。', links: ['graph', 'graph'] },
  list: { title: '顺序表 vs 单链表', left: '顺序表查找', right: '单链表查找', input: '4, 8, 2, 7, 5', target: 7, note: '比较查找过程；链表另外显示沿 next 指针逐个访问的步骤。', links: ['array', 'linked'] },
}

export function comparisonRun(id: CompareId, input: string, target: number, edges: string): [CompareStep[], CompareStep[]] {
  const [left, right] = comparisonGenerators(id, input, target, edges)
  return [left(), right()]
}

export function timedComparisonRun(id: CompareId, input: string, target: number, edges: string) {
  const [left, right] = comparisonGenerators(id, input, target, edges)
  const start = performance.now(), leftSteps = left(), middle = performance.now(), rightSteps = right(), end = performance.now()
  return { runs: [leftSteps, rightSteps] as [CompareStep[], CompareStep[]], milliseconds: [middle - start, end - middle] as [number, number] }
}

function comparisonGenerators(id: CompareId, input: string, target: number, edges: string): [() => CompareStep[], () => CompareStep[]] {
  if (id === 'sort' || id === 'stableSort') {
    const values = parseBubbleInput(input), left = id === 'sort' ? sortAlgorithms.bubble : sortAlgorithms.insertion, right = id === 'sort' ? sortAlgorithms.quick : sortAlgorithms.merge
    return [() => left.generate(values), () => right.generate(values)] as [() => CompareStep[], () => CompareStep[]]
  }
  if (id === 'graph') return [() => topicRun('graph', input, { order: 'bfs', start: 0, edges }).steps, () => topicRun('graph', input, { order: 'dfs', start: 0, edges }).steps]
  if (id === 'search') return [() => topicRun('sequential', input, { target }).steps, () => topicRun('binary', input, { target }).steps]
  return [() => topicRun('array', input, { operation: 'search', target }).steps, () => topicRun('linked', input, { operation: 'search', target }).steps]
}
