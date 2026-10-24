import { parseBubbleInput } from './bubble'
import { sortAlgorithms, type SortId } from './sorting'
import { topicIds, topicRun, type TopicId, type TopicOptions } from './topics'

export type LabCase = { version: 1; algorithmId: TopicId | SortId; input: string; options: TopicOptions; positions?: Record<number, { x: number; y: number }> }
const key = 'datastruct-cases-v1'
const sortIds = Object.keys(sortAlgorithms) as SortId[]
const optionKeys = new Set(['operation', 'position', 'count', 'value', 'pattern', 'order', 'rows', 'cols', 'start', 'edges', 'target', 'directed'])

export function parseLabCase(text: string): LabCase {
  if (text.length > 10000) throw new Error('案例文件不能超过 10 KB。')
  let raw: unknown
  try { raw = JSON.parse(text) } catch { throw new Error('案例不是有效的 JSON。') }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('案例格式无效。')
  const data = raw as Record<string, unknown>
  if (data.version !== 1) throw new Error('不支持此案例版本。')
  if (typeof data.algorithmId !== 'string' || typeof data.input !== 'string' || data.input.length > 1000) throw new Error('案例算法或输入无效。')
  if (!data.options || typeof data.options !== 'object' || Array.isArray(data.options)) throw new Error('案例选项无效。')
  const entries = Object.entries(data.options)
  if (entries.some(([name, value]) => !optionKeys.has(name) || !['string', 'number', 'boolean'].includes(typeof value) || typeof value === 'number' && !Number.isFinite(value))) throw new Error('案例含有无效选项。')
  const options = Object.fromEntries(entries) as TopicOptions
  let positions: LabCase['positions']
  if (data.positions !== undefined) {
    if (!data.positions || typeof data.positions !== 'object' || Array.isArray(data.positions)) throw new Error('案例节点位置无效。')
    const points = Object.entries(data.positions)
    if (points.length > 10 || points.some(([index, point]) => {
      if (!/^(0|[1-9]\d?)$/.test(index) || Number(index) > 9 || !point || typeof point !== 'object' || Array.isArray(point)) return true
      const { x, y } = point as { x?: number; y?: number }
      return typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 680 || y < 0 || y > 310
    })) throw new Error('案例节点位置无效。')
    positions = Object.fromEntries(points.map(([index, point]) => { const { x, y } = point as { x: number; y: number }; return [index, { x, y }] }))
  }
  if (topicIds.includes(data.algorithmId as TopicId)) topicRun(data.algorithmId as TopicId, data.input, options)
  else if (sortIds.includes(data.algorithmId as SortId)) sortAlgorithms[data.algorithmId as SortId].generate(parseBubbleInput(data.input))
  else throw new Error('案例算法不存在。')
  return { version: 1, algorithmId: data.algorithmId as LabCase['algorithmId'], input: data.input, options, ...(positions ? { positions } : {}) }
}

export function readLabCases(): LabCase[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? value.flatMap(item => { try { return [parseLabCase(JSON.stringify(item))] } catch { return [] } }) : []
  } catch { return [] }
}

export function saveLabCase(item: LabCase) {
  const valid = parseLabCase(JSON.stringify(item))
  const raw = localStorage.getItem(key)
  if (raw !== null) {
    let stored: unknown
    try { stored = JSON.parse(raw) } catch { throw new Error('已有案例数据无法读取，请先备份浏览器数据。') }
    if (!Array.isArray(stored) || stored.some(entry => { try { parseLabCase(JSON.stringify(entry)); return false } catch { return true } })) throw new Error('已有案例包含不兼容的数据，请先备份浏览器数据。')
  }
  const old = readLabCases().filter(entry => entry.algorithmId !== valid.algorithmId || entry.input !== valid.input || JSON.stringify(entry.options) !== JSON.stringify(valid.options))
  localStorage.setItem(key, JSON.stringify([valid, ...old].slice(0, 20)))
}
