import { parseValues } from './topicCore.mjs'

export function editGraphEdge(raw: string, from: number, to: number, weight: number | null, directed: boolean, remove = false) {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from === to) throw new Error('请选择两个不同的有效节点下标。')
  if (weight !== null && (!Number.isInteger(weight) || weight < 0 || weight > 99)) throw new Error('边权必须是 0 至 99 的整数。')
  const parts = raw.trim() ? raw.split(/[,，\n]+/).map(part => part.trim()).filter(Boolean) : []
  const same = (a: number, b: number) => a === from && b === to || !directed && a === to && b === from
  const kept = parts.filter(part => { const match = /^(\d+)\s*-\s*(\d+)(?::\s*\d+)?$/.exec(part); if (!match) throw new Error('先修正边列表，再使用快捷编辑。'); return !same(Number(match[1]), Number(match[2])) })
  if (!remove) kept.push(`${from}-${to}${weight === null ? '' : `:${weight}`}`)
  return kept.join(', ')
}

export function editGraphVertex(input: string, edges: string, max: number, remove = false, min = 1) {
  const values = parseValues(input) as number[]
  if (remove) {
    if (values.length <= min) throw new Error(`至少保留 ${min} 个节点。`)
    const last = values.length - 1
    const kept = edges.split(/[,，\n]+/).map(part => part.trim()).filter(part => { if (!part) return false; const match = /^(\d+)\s*-\s*(\d+)(?::\s*\d+)?$/.exec(part); if (!match) throw new Error('先修正边列表，再移除节点。'); return Number(match[1]) !== last && Number(match[2]) !== last })
    return { input: values.slice(0, -1).join(', '), edges: kept.join(', ') }
  }
  if (values.length >= max) throw new Error(`此图最多 ${max} 个节点。`)
  const value = Array.from({ length: 100 }, (_, i) => i).find(item => !values.includes(item))
  if (value === undefined) throw new Error('没有可添加的节点值。')
  return { input: [...values, value].join(', '), edges }
}
