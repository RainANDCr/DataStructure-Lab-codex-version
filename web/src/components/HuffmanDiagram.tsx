import type { TopicState } from '../engine/topics'
import './HuffmanDiagram.css'

export function HuffmanDiagram({ state }: { state: TopicState }) {
  const nodes = state.huffmanNodes ?? [], roots = state.roots ?? []
  const positions = new Map<number, { x: number; y: number }>()
  let leaf = 0, maxLevel = 0
  const place = (id: number, level: number): number => {
    const node = nodes[id]
    maxLevel = Math.max(maxLevel, level)
    const x = node.left === undefined ? 50 + leaf++ * 90 : (place(node.left, level + 1) + place(node.right!, level + 1)) / 2
    positions.set(id, { x, y: 46 + level * 76 })
    return x
  }
  for (const root of roots) place(root, 0)
  const width = Math.max(560, leaf * 90 + 20), height = Math.max(170, maxLevel * 76 + 100)
  const children = nodes.filter(node => node.left !== undefined && positions.has(node.id))
  return <div className="huffman-view" aria-label="哈夫曼树构建过程">
    <div className="huffman-forest"><span>当前森林</span>{roots.map(id => <b className={state.active.includes(id) ? 'active' : ''} key={id}>{nodes[id].symbol ?? '子树'} · {nodes[id].weight}</b>)}</div>
    <svg viewBox={`0 0 ${width} ${height}`} style={{ minWidth: `${width}px`, height: `${height}px` }} role="img" aria-label={`${roots.length} 棵树，${nodes.length} 个节点`}>
      {children.flatMap(node => ([node.left!, node.right!] as const).map((child, bit) => {
        const from = positions.get(node.id)!, to = positions.get(child)!, active = state.edge?.[0] === node.id && state.edge[1] === child
        return <g key={`${node.id}-${child}`}><line x1={from.x} y1={from.y + 17} x2={to.x} y2={to.y - 18} className={active ? 'active' : ''}/><text x={(from.x + to.x) / 2 + (bit ? 8 : -8)} y={(from.y + to.y) / 2} className="huffman-bit">{bit}</text></g>
      }))}
      {nodes.filter(node => positions.has(node.id)).map(node => { const point = positions.get(node.id)!; return <g key={node.id}><circle cx={point.x} cy={point.y} r="23" className={state.active.includes(node.id) ? 'active' : state.done.includes(node.id) ? 'done' : ''}/><text x={point.x} y={point.y + 5} className="huffman-weight">{node.weight}</text>{node.symbol && <text x={point.x} y={point.y + 38} className="huffman-symbol">{node.symbol}</text>}</g> })}
    </svg>
  </div>
}
