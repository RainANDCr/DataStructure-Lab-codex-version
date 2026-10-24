import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, CircleHelp, Copy, Maximize2, Pause, Play, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from './ui/button'
import { toExecutionSteps } from '../engine/stepAdapter'
import { useTimeline } from './useTimeline'
import { VariableMonitor } from './VariableMonitor'
import { topicDefaults, topicLessons, topicRun, type TopicId, type TopicLanguage, type TopicOptions, type TopicState } from '../engine/topics'
import type { MatrixOrder } from '../engine/matrix'
import { HuffmanDiagram } from './HuffmanDiagram'
import { StudyNotes } from './StudyNotes'
import { editGraphEdge, editGraphVertex } from '../engine/graphEditing'
import { CaseControls } from './CaseControls'
import type { LabCase } from '../engine/labCases'
import { randomExample } from '../engine/randomExample'
import { parseValues } from '../engine/topicCore.mjs'
import './TopicLab.css'
import './WeightedGraph.css'
import './Matrix.css'
import './Kmp.css'
import './Glist.css'
import './SearchExtras.css'
import './Floyd.css'
import './LinkedVariants.css'
import './GeneralTree.css'
import './GraphEditor.css'
import './AdvancedViz.css'

const languages: TopicLanguage[] = ['C', 'C++', 'Python']
const speeds = [0.25, 0.5, 1, 1.5, 2, 4]
const linear = new Set<TopicId>(['array', 'stack', 'linkedStack', 'queue', 'circularQueue', 'linkedQueue'])
const linkedTypes = new Set<TopicId>(['linked', 'circularLinked', 'doublyLinked', 'circularDoublyLinked'])
const pointerTypes = new Set<TopicId>([...linkedTypes, 'linkedStack', 'linkedQueue'])
const weighted = new Set<TopicId>(['prim', 'dijkstra', 'kruskal', 'floyd'])
const dag = new Set<TopicId>(['topological', 'critical'])
const graphTypes = new Set<TopicId>(['graph', ...weighted, ...dag])
const matrixModes: { value: MatrixOrder; label: string }[] = [
  { value: 'row', label: '按行存储' }, { value: 'column', label: '按列存储' }, { value: 'symmetric', label: '对称压缩（下三角）' },
  { value: 'lower', label: '下三角压缩' }, { value: 'upper', label: '上三角压缩' }, { value: 'band', label: '三对角压缩' }, { value: 'sparse', label: '稀疏矩阵三元组' },
]
const matrixFormula: Record<MatrixOrder, string> = { row: 'k = r × 列数 + c', column: 'k = c × 行数 + r', symmetric: 'k = r(r+1)/2 + c，镜像共用', lower: 'k = r(r+1)/2 + c', upper: 'k = r(2n-r+1)/2 + c-r', band: 'k = 2r + c', sparse: '只保存非零项 (r,c,v)' }
const matrixSpace: Record<MatrixOrder, string> = { row: 'rc 个单元', column: 'rc 个单元', symmetric: 'n(n+1)/2 个单元', lower: 'n(n+1)/2 个单元', upper: 'n(n+1)/2 个单元', band: '3n−2 个单元', sparse: 't 个三元组（t 为非零项数）' }
const matrixExamples: Record<MatrixOrder, { input: string; rows: number; cols: number }> = {
  row: { input: '1, 2, 3, 4, 5, 6', rows: 2, cols: 3 }, column: { input: '1, 2, 3, 4, 5, 6', rows: 2, cols: 3 },
  symmetric: { input: '1, 2, 3, 2, 4, 5, 3, 5, 6', rows: 3, cols: 3 },
  lower: { input: '1, 0, 0, 2, 3, 0, 4, 5, 6', rows: 3, cols: 3 }, upper: { input: '1, 2, 3, 0, 4, 5, 0, 0, 6', rows: 3, cols: 3 },
  band: { input: '1, 2, 0, 0, 3, 4, 5, 0, 0, 6, 7, 8, 0, 0, 9, 10', rows: 4, cols: 4 }, sparse: { input: '0, 5, 0, 0, 0, 7', rows: 2, cols: 3 },
}

function Diagram({ id, state, options, positions, onMove }: { id: TopicId; state: TopicState; options: TopicOptions; positions?: Record<number, { x: number; y: number }>; onMove?: (index: number, point: { x: number; y: number }) => void }) {
  const color = (position: number) => state.active.includes(position) ? '#e8a45b' : state.done.includes(position) ? '#4eae91' : '#a9c2d8'
  if (id === 'huffman') return <HuffmanDiagram state={state} />
  if(id==='generalTree'&&state.edges){const render=(i:number):ReactNode=>{const children=state.edges!.filter(([a])=>a===i).map(([,b])=>b);return <li key={i}><span className={state.active.includes(i)?'active':state.done.includes(i)?'done':''}>{state.values[i]}<small>#{i}</small></span>{children.length>0&&<ul>{children.map(render)}</ul>}</li>};return <div className="general-tree" aria-label="多叉树父子结构"><ul>{render(0)}</ul></div>}
  if (id==='treeEdit'&&state.treeSlots){const point=(i:number)=>{const level=Math.floor(Math.log2(i+1)),rank=i-(2**level-1);return {x:340+(rank+.5-2**(level-1))*(560/2**level),y:38+level*75}};return state.treeSlots.every(item=>item===null)?<div className="topic-empty">当前为空树。播放步骤可观察节点接入。</div>:<svg className="topic-svg" viewBox="0 0 680 310" role="img" aria-label="可含空位的二叉树">{state.treeSlots.map((value,i)=>value!==null&&i>0?<line key={`edge-${i}`} x1={point(Math.floor((i-1)/2)).x} y1={point(Math.floor((i-1)/2)).y} x2={point(i).x} y2={point(i).y} stroke="#c2d2de" strokeWidth="2"/>:null)}{state.treeSlots.map((value,i)=>value!==null?<g key={i}><circle cx={point(i).x} cy={point(i).y} r="23" fill={color(i)}/><text className="topic-svg-value" x={point(i).x} y={point(i).y+5}>{value}</text><text className="topic-svg-index" x={point(i).x} y={point(i).y+40}>{i}</text></g>:null)}</svg>}
  if (pointerTypes.has(id) && state.listNodes) return <div className="pointer-list" aria-label={`${topicLessons[id].title}节点与指针`}><p>{id==='linkedStack'?'top':id==='linkedQueue'?'front':'head'} → {state.head===null?'NULL':`#${state.head}`}{id==='linkedQueue'&&` · rear → ${state.listNodes.length?`#${state.listNodes.at(-1)!.id}`:'NULL'}`}</p><div>{state.listNodes.map(node=><article className={state.active.includes(node.id)?'active':''} key={node.id}><small>节点 #{node.id}</small><b>{node.value}</b><span>next → {node.next===null?'NULL':`#${node.next}`}</span>{(id==='doublyLinked'||id==='circularDoublyLinked')&&<span>prev ← {node.prev===null?'NULL':`#${node.prev}`}</span>}</article>)}</div></div>
  if (id === 'circularQueue' && state.slots) return <div className="circular-queue" aria-label="循环队列槽位">{state.slots.map((value,i)=><div className={state.active.includes(i)?'active':value!==null?'filled':''} key={i}><small>槽 {i}</small><b>{value??'空'}</b><span>{state.front===i?'front':''}{state.front===i&&state.rear===i?' / ':''}{state.rear===i?'rear':''}</span></div>)}</div>
  if (id === 'hash' && state.hashSlots) return <div className="hash-grid" aria-label="散列表槽位">{state.hashSlots.map((value, slot) => <div className={state.slot === slot ? 'active' : value !== null ? 'filled' : ''} key={slot}><small>{slot}</small><b>{value ?? '空'}</b></div>)}</div>
  if (id === 'glist' && state.nodes) {
    const renderNode = (id: number): ReactNode => {
      const node = state.nodes![id], children = state.nodes!.filter(child => child.parent === id)
      return <li key={id}><div className={`glist-node ${node.atom ? 'atom' : 'list'} ${state.active.includes(id) ? 'active' : state.done.includes(id) ? 'done' : state.path?.includes(id) ? 'path' : ''}`}><span>{node.atom ? '原子' : node.parent === null ? '根表' : '子表'}</span><strong>{node.atom ? node.label : children.length ? `${children.length} 项` : '空表'}</strong></div>{children.length > 0 && <ul>{children.map(child => renderNode(child.id))}</ul>}</li>
    }
    return <div className="glist-view" aria-label="广义表嵌套结构"><ul>{renderNode(0)}</ul></div>
  }
  if (id === 'kmp' && state.next) return <div className="kmp-view" aria-label="KMP 主串、模式串与 next 数组">
    <div className="kmp-row"><strong>主串</strong><div className="kmp-cells">{state.values.map((value, i) => <span className={state.active.includes(i) ? 'active' : state.done.includes(i) ? 'done' : ''} key={i}><small>{i}</small>{value}</span>)}</div></div>
    <div className="kmp-row"><strong>模式串</strong><div className="kmp-cells" style={{ marginLeft: `${(state.alignment ?? 0) * 42}px` }}>{[...(options.pattern ?? '')].map((value, i) => <span className={state.patternIndex === i || state.prefixIndex === i ? 'active' : ''} key={i}><small>{i}</small>{value}</span>)}</div></div>
    <div className="kmp-row"><strong>next</strong><div className="kmp-cells">{state.next.map((value, i) => <span className={value === null ? '' : 'next-cell'} key={i}><small>{i}</small>{value ?? '·'}</span>)}</div></div>
  </div>
  if (id === 'matrix' && state.rows && state.cols && state.linear) return <div className="matrix-view" aria-label="矩阵到线性数组映射">
    <div><strong>二维矩阵 A[r][c]</strong><div className="matrix-grid" style={{ gridTemplateColumns: `repeat(${state.cols}, 44px)` }}>{state.values.map((value, i) => <div className={`matrix-cell ${state.active.includes(i) ? 'active' : ''}`} key={i}><small>{Math.floor(i / state.cols!)}:{i % state.cols!}</small><b>{value}</b></div>)}</div></div>
    <span className="matrix-arrow" aria-hidden="true">→</span>
    <div><strong>{state.triples ? '三元组表 (r,c,v)' : '线性数组 B[k]'}</strong>{state.triples ? <div className="matrix-triples">{state.triples.length ? state.triples.map(([r,c,value],i) => <div className={`matrix-triplet ${state.slot === i ? 'active' : ''}`} key={i}><small>{i}</small><b>({r}, {c}, {value})</b></div>) : <span className="topic-empty">等待非零项</span>}</div> : <div className="matrix-linear">{state.linear.map((value, i) => <div className={`matrix-cell ${state.slot === i ? 'active' : state.done.includes(i) ? 'done' : ''}`} key={i}><small>{i}</small><b>{value ?? '·'}</b></div>)}</div>}</div>
  </div>
  if ((id === 'bst' || id === 'avl') && !state.values.length) return <div className="topic-empty">当前为空树。点击“下一步”开始插入根节点。</div>
  if (id === 'tree' || id === 'threaded' || id === 'graph' || id === 'bst' || id === 'avl' || weighted.has(id) || dag.has(id)) {
    const point = (i: number) => {
      if (graphTypes.has(id)) { const angle = -Math.PI / 2 + i * 2 * Math.PI / state.values.length; return positions?.[i] ?? { x: 340 + 220 * Math.cos(angle), y: 150 + 105 * Math.sin(angle) } }
      if (id === 'bst' || id === 'avl') { const layout = state.layoutValues ?? state.values.map(Number); return { x: 40 + (layout.indexOf(Number(state.values[i])) + 0.5) * 600 / layout.length, y: 38 + (state.depths?.[i] ?? 0) * 58 } }
      const level = Math.floor(Math.log2(i + 1)), rank = i - (2 ** level - 1)
      return { x: 340 + (rank + 0.5 - 2 ** (level - 1)) * (560 / 2 ** level), y: 38 + level * 75 }
    }
    const edges: [number, number][] = id === 'graph' || id === 'bst' || id === 'avl' || weighted.has(id) || dag.has(id) ? state.edges ?? [] : state.values.flatMap((_, i): [number, number][] => i ? [[Math.floor((i - 1) / 2), i]] : [])
    const height = id === 'bst' || id === 'avl' ? Math.max(310, Math.max(...(state.depths ?? [0])) * 58 + 90) : 310
    return <svg className="topic-svg" viewBox={`0 0 680 ${height}`} style={id === 'bst' || id === 'avl' ? { height: `${height}px` } : undefined} role={graphTypes.has(id) ? 'group' : 'img'} aria-label={state.directed ? '有向图' : id === 'graph' || weighted.has(id) ? '无向图' : id === 'avl' ? '平衡二叉树' : id === 'bst' ? '二叉排序树' : '二叉树'}>
      <defs><marker id="topic-arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#8aa5b9"/></marker></defs>
      {edges.map(([a, b], position) => { const from = point(a), to = point(b), active = state.edge?.includes(a) && state.edge?.includes(b), selected = state.selectedEdges?.some(([u, v]) => u === a && v === b || !state.directed && u === b && v === a); const x = (from.x + to.x) / 2, y = (from.y + to.y) / 2, dx = to.x - from.x, dy = to.y - from.y, length = Math.hypot(dx, dy) || 1; return <g key={`${a}-${b}`}><line x1={state.directed ? from.x + dx / length * 25 : from.x} y1={state.directed ? from.y + dy / length * 25 : from.y} x2={state.directed ? to.x - dx / length * 28 : to.x} y2={state.directed ? to.y - dy / length * 28 : to.y} markerEnd={state.directed ? 'url(#topic-arrowhead)' : undefined} stroke={active ? '#e8a45b' : selected ? '#4eae91' : '#c2d2de'} strokeWidth={active || selected ? 4 : 2} />{state.weightedEdges && <g><circle cx={x} cy={y} r="12" className="topic-weight-bg"/><text x={x} y={y + 4} className="topic-weight">{state.weightedEdges[position][2]}</text></g>}</g> })}
      {state.threads?.map(([from,to,side],i)=>{const a=point(from),b=point(to),bend=side==='left'?42:-42;return <path key={`${from}-${to}-${i}`} d={`M ${a.x} ${a.y} Q ${(a.x+b.x)/2} ${(a.y+b.y)/2+bend} ${b.x} ${b.y}`} fill="none" stroke={side==='left'?'#9b75b4':'#4eae91'} strokeWidth="2" strokeDasharray="5 4" markerEnd="url(#topic-arrowhead)"/>})}
      {state.values.map((value, i) => { const p = point(i); return <g key={i} className={graphTypes.has(id) ? 'graph-draggable' : undefined} role={graphTypes.has(id) ? 'button' : undefined} tabIndex={graphTypes.has(id) ? 0 : undefined} aria-label={graphTypes.has(id) ? `拖动节点 ${value}，下标 ${i}` : undefined} onPointerDown={graphTypes.has(id) ? event => { event.currentTarget.setPointerCapture(event.pointerId) } : undefined} onPointerMove={graphTypes.has(id) ? event => { if (!event.currentTarget.hasPointerCapture(event.pointerId)) return; const svg = event.currentTarget.ownerSVGElement, matrix = svg?.getScreenCTM(); if (!svg || !matrix) return; const next = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()); onMove?.(i, { x: Math.max(25, Math.min(655, next.x)), y: Math.max(25, Math.min(height - 25, next.y)) }) } : undefined} onKeyDown={graphTypes.has(id) ? event => { const delta = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] }[event.key] as [number, number] | undefined; if (delta) { event.preventDefault(); onMove?.(i, { x: Math.max(25, Math.min(655, p.x + delta[0])), y: Math.max(25, Math.min(height - 25, p.y + delta[1])) }) } } : undefined}><circle cx={p.x} cy={p.y} r="23" fill={color(i)} /><text className="topic-svg-value" x={p.x} y={p.y + 5}>{value}</text><text className="topic-svg-index" x={p.x} y={p.y + 40}>{i}</text></g> })}
    </svg>
  }
  if (!state.values.length) return <div className="topic-empty">当前结构为空。{id === 'string' ? '输入主串后可观察匹配。' : '可以插入元素，或查看空输入结果。'}</div>
  return <div className={`topic-nodes topic-${id}`} aria-label={`${topicLessons[id].title}结构图`}>
    {state.values.map((value, i) => {
      const excluded = (id === 'binary' || id === 'block') && state.range && (i < state.range[0] || i > state.range[1])
      const start = Number(state.vars?.i)
      const pattern = id === 'string' && Number.isInteger(start) && i >= start ? options.pattern?.[i - start] : undefined
      const pointer = id === 'stack' && i === state.values.length - 1 ? '栈顶' : id === 'queue' && i === 0 ? '队首' : id === 'queue' && i === state.values.length - 1 ? '队尾' : state.active.includes(i) ? '当前' : ''
      return <div className={`topic-node-wrap ${excluded ? 'excluded' : ''}`} key={i}><span className="topic-pointer">{pointer}</span><div className="topic-node" style={{ background: color(i) }}>{value}</div><span className="topic-index">{i}</span>{pattern && <span className="topic-pattern">{pattern}</span>}{id === 'linked' && <span className="topic-arrow" aria-hidden="true">→</span>}</div>
    })}{id === 'linked' && <span className="topic-null">NULL</span>}
  </div>
}

export function TopicLab({ topicId }: { topicId: TopicId }) {
  const lesson = topicLessons[topicId], defaults = topicDefaults[topicId]
  const [draft, setDraft] = useState(defaults.input)
  const [options, setOptions] = useState<TopicOptions>(defaults.options)
  const [appliedOptions, setAppliedOptions] = useState<TopicOptions>(defaults.options)
  const [run, setRun] = useState(() => topicRun(topicId, defaults.input, defaults.options))
  const [dirty, setDirty] = useState(false)
  const [initialSteps] = useState(() => toExecutionSteps(topicId, run.steps))
  const { timeline, steps, index, playing, speed } = useTimeline(initialSteps)
  const [language, setLanguage] = useState<TopicLanguage>('C++')
  const [error, setError] = useState('')
  const [copyLabel, setCopyLabel] = useState('复制代码')
  const codeRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const panStart = useRef<{ x: number; y: number } | null>(null)
  const [positions, setPositions] = useState<Record<number, { x: number; y: number }>>({})
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [edgeFrom, setEdgeFrom] = useState(0)
  const [edgeTo, setEdgeTo] = useState(1)
  const [edgeWeight, setEdgeWeight] = useState(1)
  const [graphEdgeWeight, setGraphEdgeWeight] = useState('')
  const maxIndex = steps.length - 1, step = steps[index], state = step.state
  const edit = (patch: TopicOptions) => { setOptions(current => ({ ...current, ...patch })); setDirty(true); timeline.pause(); setError('') }
  const editInput = (value: string) => { setDraft(value); setDirty(true); timeline.pause(); setError('') }
  useEffect(() => {
    const line = step.highlightedLines[language][0], pane = codeRef.current
    const row = pane?.querySelector<HTMLElement>(`[data-line="${line}"]`)
    if (pane && row) pane.scrollTop = Math.max(0, row.offsetTop - pane.offsetTop - pane.clientHeight / 2)
  }, [index, language, step])

  const apply = () => {
    try { const next = topicRun(topicId, draft, options); timeline.replace(toExecutionSteps(topicId, next.steps)); setRun(next); setAppliedOptions(options); setDirty(false); setError(''); setPositions({}) }
    catch (cause) { setError(cause instanceof Error ? cause.message : '输入无效。') }
    timeline.pause()
  }
  const loadCase = (item: LabCase) => {
    if (item.algorithmId !== topicId) throw new Error('案例与当前实验台不匹配。')
    const next = topicRun(topicId, item.input, item.options)
    timeline.replace(toExecutionSteps(topicId, next.steps)); setRun(next); setDraft(item.input); setOptions(item.options); setAppliedOptions(item.options); setDirty(false); setError(''); setPositions(item.positions ?? {}); setPan({ x: 0, y: 0 }); setZoom(1)
  }
  const loadSample = (reset: boolean) => {
    const sample = reset ? defaults : randomExample(topicId as 'array' | 'linked' | 'tree' | 'graph')
    const nextOptions = reset ? defaults.options : { ...defaults.options, ...(topicId === 'graph' && 'edges' in sample ? { edges: sample.edges } : {}) }
    try { const next = topicRun(topicId, sample.input, nextOptions); timeline.replace(toExecutionSteps(topicId, next.steps)); setRun(next); setDraft(sample.input); setOptions(nextOptions); setAppliedOptions(nextOptions); setDirty(false); setError(''); setPositions({}); setPan({ x: 0, y: 0 }); setZoom(1) }
    catch (cause) { setError(cause instanceof Error ? cause.message : '样例不可用。') }
  }
  const loadMatrixExample = () => {
    if (topicId !== 'matrix') return
    const sample = matrixExamples[options.order as MatrixOrder], next = { ...options, rows: sample.rows, cols: sample.cols }
    const example = topicRun('matrix', sample.input, next)
    setDraft(sample.input); setOptions(next); setAppliedOptions(next); setRun(example); timeline.replace(toExecutionSteps(topicId, example.steps)); setDirty(false); setError('')
  }
  const move = (next: number) => timeline.seek(next)
  const togglePlay = () => { if (dirty) return; if (playing) timeline.pause(); else timeline.play() }
  const copy = async () => { try { await navigator.clipboard.writeText(run.code[language].join('\n')); setCopyLabel('已复制') } catch { setCopyLabel('请手动复制') } window.setTimeout(() => setCopyLabel('复制代码'), 1500) }
  const numeric = (value: string) => value.trim() === '' ? Number.NaN : Number(value)
  const graphWeighted = weighted.has(topicId) || topicId === 'critical'
  const graphDirected = topicId === 'graph' ? !!options.directed : topicId === 'floyd' || dag.has(topicId)
  const graphLimit = topicId === 'floyd' ? 6 : dag.has(topicId) ? 8 : 10
  const editEdge = (remove: boolean) => {
    try {
      const values = parseValues(draft) as number[]
      if (edgeFrom >= values.length || edgeTo >= values.length) throw new Error('边的端点不能超出节点范围。')
      edit({ edges: editGraphEdge(options.edges ?? '', edgeFrom, edgeTo, topicId === 'graph' ? graphEdgeWeight.trim() === '' ? null : Number(graphEdgeWeight) : graphWeighted ? edgeWeight : null, graphDirected, remove) })
    } catch (cause) { setError(cause instanceof Error ? cause.message : '边无效。') }
  }
  const editVertex = (remove: boolean) => {
    try { const next = editGraphVertex(draft, options.edges ?? '', graphLimit, remove, topicId === 'floyd' || dag.has(topicId) ? 2 : 1); editInput(next.input); edit({ edges: next.edges }); if (remove) { setEdgeFrom(0); setEdgeTo(1) } }
    catch (cause) { setError(cause instanceof Error ? cause.message : '节点无效。') }
  }
  const result = step.variables?.result

  return <div className="native-lab">
    <section className="lab-workspace" aria-label={`${lesson.title}实验台`}>
      <div className="lab-card canvas-card">
        <div className="lab-card-head"><div><h2>算法演示</h2><p>每一步都由真实算法执行生成</p></div><span className="lab-badge">{lesson.title}</span></div>
        <div className="lab-input topic-input"><label htmlFor="topic-input">{topicId === 'expression' ? '算术表达式' : topicId === 'brackets' ? '括号序列' : topicId === 'string' || topicId==='stringOps' || topicId === 'kmp' ? '主串' : topicId === 'matrix' ? '矩阵元素（按行输入）' : topicId === 'glist' ? '广义表' : topicId === 'huffman' ? '符号权重（依次对应 A、B、C…）' : topicId === 'bst' ? '插入顺序' : weighted.has(topicId) || dag.has(topicId) ? '节点值' : '输入数据'}</label><div className="lab-input-row"><input id="topic-input" value={draft} onChange={event => editInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') apply() }} aria-invalid={!!error} aria-describedby={error ? 'topic-error' : 'topic-hint'} /><Button onClick={apply}>应用数据</Button></div><small id="topic-hint">{topicId==='generalTree' ? '最多 10 个不重复节点；用父子边连接，每个非根节点只有一个父节点。' : topicId==='treeEdit' ? '层序输入，# 表示空位；非空节点需有父节点，最多 15 个位置。' : topicId==='stringOps' ? '主串最多 16 个英文字母或数字；操作结果最多 24 个字符。' : pointerTypes.has(topicId) ? '最多 12 个整数；节点编号固定，指针变化逐步显示。' : topicId === 'threaded' ? '按层序输入 1 至 7 个整数；实线为孩子边，紫色虚线指向前驱，绿色虚线指向后继。' : topicId === 'expression' ? '非负整数及 + - * / ()；不支持一元负号，最多 48 个字符。' : topicId === 'brackets' ? '输入 1 至 32 个括号，仅支持 () [] {}。' : topicId === 'circularQueue' ? '固定 6 个槽位，保留 1 个空槽，最多输入 5 个整数。' : topicId === 'floyd' ? '输入 2 至 6 个不重复节点；有向边按节点下标填写，权重 0–99。' : dag.has(topicId) ? '输入 2 至 8 个不重复节点。边按箭头方向填写；关键路径需单一起点、终点。' : topicId === 'hash' ? '最多 10 个不重复整数，使用长度 11 的散列表和线性探测。' : topicId === 'block' ? '输入升序整数，自动按 √n 分块。' : topicId === 'huffman' ? '输入 2 至 8 个正整数权重（1–99）；相同权重按创建顺序选取。' : topicId === 'glist' ? '例：(a,(b,c),(),d)。原子限英文字母和数字；最多 20 个节点、嵌套 5 层。' : topicId === 'matrix' ? '按行填写整数；行数 × 列数须等于元素个数，最多 4 × 4。压缩区域外须为 0；稀疏模式用 0 表示空项。' : topicId === 'tree' ? '按层序输入，最多 15 个节点。' : topicId === 'bst' ? '按顺序建树；最多 12 个不重复的整数，范围 -99 至 99。' : topicId === 'graph' || weighted.has(topicId) || dag.has(topicId) ? '不重复节点值，最多 10 个。边使用节点下标。' : topicId === 'string' || topicId === 'kmp' ? '仅英文字母和数字，最多 16 个字符，区分大小写。' : topicId === 'binary' ? '升序整数，最多 16 个。' : '整数用逗号或空格分隔，最多 16 个，范围 -99 至 99。'}</small>
          <div className="topic-fields">
            {topicId === 'matrix' && <><label>行数<input aria-label="行数" type="number" min="1" max="4" value={options.rows ?? ''} onChange={event => edit({ rows: numeric(event.target.value) })} /></label><label>列数<input aria-label="列数" type="number" min="1" max="4" value={options.cols ?? ''} onChange={event => edit({ cols: numeric(event.target.value) })} /></label><label className="wide">存储方式<select aria-label="存储方式" value={options.order} onChange={event => edit({ order: event.target.value as MatrixOrder })}>{matrixModes.map(mode => <option key={mode.value} value={mode.value}>{mode.label}</option>)}</select></label><div className="wide"><Button variant="outline" onClick={loadMatrixExample}>载入当前方式示例</Button></div></>}
            {(linear.has(topicId)||linkedTypes.has(topicId)) && <label>操作<select aria-label="操作" value={options.operation} onChange={event => edit({ operation: event.target.value as TopicOptions['operation'] })}><option value="insert">{topicId === 'stack'||topicId==='linkedStack' ? '入栈' : topicId === 'queue' || topicId === 'circularQueue'||topicId==='linkedQueue' ? '入队' : '插入'}</option><option value="remove">{topicId === 'stack'||topicId==='linkedStack' ? '出栈' : topicId === 'queue' || topicId === 'circularQueue'||topicId==='linkedQueue' ? '出队' : '删除'}</option>{(linkedTypes.has(topicId)||topicId==='array')&&<><option value="create">创建</option><option value="search">查找</option><option value="traverse">遍历</option><option value="modify">修改</option><option value="clear">清空</option></>}</select></label>}
            {(topicId === 'array' || linkedTypes.has(topicId)) && ['insert','remove','modify'].includes(options.operation??'') && <label>位置（下标）<input aria-label="位置" type="number" value={options.position ?? ''} onChange={event => edit({ position: numeric(event.target.value) })} /></label>}
            {topicId === 'circularQueue' && <label>初始 front 槽位<input aria-label="初始 front 槽位" type="number" min="0" max="5" value={options.position ?? ''} onChange={event => edit({ position: numeric(event.target.value) })} /></label>}
            {((topicId==='array'||linkedTypes.has(topicId))&&['insert','modify'].includes(options.operation??'')||topicId!=='array'&&linear.has(topicId)&&options.operation==='insert') && <label>{options.operation==='modify'?'新值':'插入值'}<input aria-label="插入值" type="number" value={options.value ?? ''} onChange={event => edit({ value: numeric(event.target.value) })} /></label>}
            {(linkedTypes.has(topicId)||topicId==='array')&&options.operation==='search'&&<label>目标值<input aria-label="目标值" type="number" value={options.target??''} onChange={event=>edit({target:numeric(event.target.value)})}/></label>}
            {(topicId === 'string' || topicId === 'kmp') && <label>模式串<input aria-label="模式串" value={options.pattern ?? ''} onChange={event => edit({ pattern: event.target.value })} /></label>}
            {topicId==='stringOps'&&<><label>操作<select aria-label="串操作" value={options.operation} onChange={event=>edit({operation:event.target.value as TopicOptions['operation']})}><option value="length">求长度</option><option value="concat">连接</option><option value="substring">截取</option><option value="insert">插入</option><option value="remove">删除</option><option value="compare">比较</option></select></label>{['concat','insert','compare'].includes(options.operation??'')&&<label>第二个串<input aria-label="第二个串" value={options.pattern??''} onChange={event=>edit({pattern:event.target.value})}/></label>}{['substring','insert','remove'].includes(options.operation??'')&&<label>起始下标<input aria-label="起始下标" type="number" value={options.position??''} onChange={event=>edit({position:numeric(event.target.value)})}/></label>}{['substring','remove'].includes(options.operation??'')&&<label>长度<input aria-label="长度" type="number" value={options.count??''} onChange={event=>edit({count:numeric(event.target.value)})}/></label>}</>}
            {(['binary', 'bst', 'avl', 'sequential', 'block', 'hash'] as TopicId[]).includes(topicId) && <label>目标值<input aria-label="目标值" type="number" value={options.target ?? ''} onChange={event => edit({ target: numeric(event.target.value) })} /></label>}
            {topicId === 'tree' && <label>遍历顺序<select aria-label="遍历顺序" value={options.order} onChange={event => edit({ order: event.target.value as 'pre' | 'in' | 'post' | 'level' })}><option value="pre">前序（根左右）</option><option value="in">中序（左根右）</option><option value="post">后序（左右根）</option><option value="level">层序（逐层队列）</option></select></label>}
            {topicId==='generalTree'&&<><label>遍历顺序<select aria-label="遍历顺序" value={options.order} onChange={event=>edit({order:event.target.value as 'pre'|'post'|'level'})}><option value="pre">先根遍历</option><option value="post">后根遍历</option><option value="level">层序遍历</option></select></label><label className="wide">父子边（如 0-1, 0-2）<input aria-label="父子边" value={options.edges??''} onChange={event=>edit({edges:event.target.value})}/></label></>}
            {topicId==='treeEdit'&&<><label>操作<select aria-label="树操作" value={options.operation} onChange={event=>edit({operation:event.target.value as TopicOptions['operation']})}><option value="create">创建</option><option value="insert">插入节点</option><option value="remove">删除子树</option></select></label>{options.operation!=='create'&&<label>层序位置<input aria-label="层序位置" type="number" min="0" max="14" value={options.position??''} onChange={event=>edit({position:numeric(event.target.value)})}/></label>}{options.operation==='insert'&&<label>新节点值<input aria-label="新节点值" type="number" value={options.value??''} onChange={event=>edit({value:numeric(event.target.value)})}/></label>}</>}
            {topicId === 'graph' && <><label>遍历方式<select aria-label="遍历方式" value={options.order} onChange={event => edit({ order: event.target.value as 'bfs' | 'dfs' })}><option value="bfs">广度优先 BFS</option><option value="dfs">深度优先 DFS</option></select></label><label>图的方向<select aria-label="图的方向" value={options.directed ? 'directed' : 'undirected'} onChange={event => edit({ directed: event.target.value === 'directed' })}><option value="undirected">无向图</option><option value="directed">有向图</option></select></label><label>起点下标<input aria-label="起点下标" type="number" value={options.start ?? ''} onChange={event => edit({ start: numeric(event.target.value) })} /></label><label className="wide">边（如 0-1 或 0-1:4；BFS/DFS 忽略权重）<input aria-label="边" value={options.edges ?? ''} onChange={event => edit({ edges: event.target.value })} /></label></>}
            {weighted.has(topicId) && <>{topicId !== 'kruskal' && <label>起点下标<input aria-label="起点下标" type="number" value={options.start ?? ''} onChange={event => edit({ start: numeric(event.target.value) })} /></label>}{(topicId === 'dijkstra' || topicId === 'floyd') && <label>目标下标<input aria-label="目标下标" type="number" value={options.target ?? ''} onChange={event => edit({ target: numeric(event.target.value) })} /></label>}<label className="wide">{topicId === 'floyd' ? '有向边' : '带权边'}（如 0-1:4, 1-2:7）<input aria-label="带权边" value={options.edges ?? ''} onChange={event => edit({ edges: event.target.value })} /></label></>}
            {dag.has(topicId) && <label className="wide">{topicId === 'critical' ? '活动边（如 0-1:4）' : '有向边（如 0-1, 1-2）'}<input aria-label="有向边" value={options.edges ?? ''} onChange={event => edit({ edges: event.target.value })} /></label>}
          </div>{graphTypes.has(topicId) && <div className="graph-editor" aria-label="图形快捷编辑"><div className="graph-editor-row"><button type="button" onClick={() => editVertex(false)}>添加节点</button><button type="button" onClick={() => editVertex(true)}>删除末节点</button><small>编辑后点击“应用数据”更新动画</small></div><div className="graph-editor-row"><label>起点下标<input aria-label="编辑边起点" type="number" min="0" value={edgeFrom} onChange={event => setEdgeFrom(numeric(event.target.value))}/></label><label>终点下标<input aria-label="编辑边终点" type="number" min="0" value={edgeTo} onChange={event => setEdgeTo(numeric(event.target.value))}/></label>{(graphWeighted || topicId === 'graph') && <label>边权{topicId === 'graph' && '（可选）'}<input aria-label="编辑边权" type="number" min="0" max="99" value={topicId === 'graph' ? graphEdgeWeight : edgeWeight} onChange={event => topicId === 'graph' ? setGraphEdgeWeight(event.target.value) : setEdgeWeight(numeric(event.target.value))}/></label>}<button type="button" onClick={() => editEdge(false)}>添加 / 更新边</button><button type="button" onClick={() => editEdge(true)}>删除边</button></div></div>}{error && <p className="lab-error" id="topic-error" role="alert">{error}</p>}</div>
        {(['array', 'linked', 'tree', 'graph'] as TopicId[]).includes(topicId) && <div className="sample-controls"><Button variant="outline" onClick={() => loadSample(false)}>随机生成</Button><Button variant="outline" onClick={() => loadSample(true)}>恢复默认数据</Button></div>}
        <CaseControls current={{ version: 1, algorithmId: topicId, input: draft, options, ...(graphTypes.has(topicId) ? { positions } : {}) }} onLoad={loadCase}/>
        <div className="bar-legend"><span><i className="legend-default"/>待处理</span><span><i className="legend-active"/>当前操作</span><span><i className="legend-done"/>{topicId === 'matrix' ? '已写入' : topicId === 'kmp' ? '已匹配' : '已访问'}</span></div>
        {graphTypes.has(topicId) && <div className="graph-view-tools"><button type="button" aria-label="缩小图" onClick={() => setZoom(value => Math.max(.75, Math.round((value - .25) * 100) / 100))}><ZoomOut size={15}/></button><span>{Math.round(zoom * 100)}%</span><button type="button" aria-label="放大图" onClick={() => setZoom(value => Math.min(2, Math.round((value + .25) * 100) / 100))}><ZoomIn size={15}/></button><button type="button" aria-label="重置图视图" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); setPositions({}) }}>重置视图</button><button type="button" aria-label="全屏查看图" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void stageRef.current?.requestFullscreen() }}><Maximize2 size={15}/><span>全屏</span></button></div>}
        <div className="topic-stage" ref={stageRef} onPointerDown={graphTypes.has(topicId) ? event => { if ((event.target as Element).closest('.graph-draggable')) return; panStart.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId) } : undefined} onPointerMove={graphTypes.has(topicId) ? event => { if (!panStart.current || !event.currentTarget.hasPointerCapture(event.pointerId)) return; const dx = event.clientX - panStart.current.x, dy = event.clientY - panStart.current.y; panStart.current = { x: event.clientX, y: event.clientY }; setPan(current => ({ x: current.x + dx, y: current.y + dy })) } : undefined} onPointerUp={() => { panStart.current = null }} onPointerCancel={() => { panStart.current = null }}>{graphTypes.has(topicId) ? <div className="graph-zoom" style={{ zoom, transform: `translate(${pan.x}px, ${pan.y}px)` }}><Diagram id={topicId} state={state} options={appliedOptions} positions={positions} onMove={(i, point) => setPositions(current => ({ ...current, [i]: point }))}/></div> : <Diagram id={topicId} state={state} options={appliedOptions}/>}</div>
        {topicId === 'graph' && appliedOptions.order === 'bfs' && <div className="graph-trace" aria-label="BFS 队列与访问状态"><div><b>队列（队首 → 队尾）</b><span>{state.queueIndices?.map(i => state.values[i]).join(' → ') || '空'}</span></div><div><b>已发现</b><span>{state.discovered?.map(i => state.values[i]).join('、') || '无'}</span></div><div><b>已访问</b><span>{state.done.map(i => state.values[i]).join('、') || '无'}</span></div></div>}
        {topicId === 'graph' && <div className="graph-storage"><div><h3>邻接矩阵</h3><table aria-label="邻接矩阵"><thead><tr><th scope="col">·</th>{state.values.map((value, i) => <th scope="col" key={i}>{value}</th>)}</tr></thead><tbody>{state.values.map((value, i) => <tr key={i}><th scope="row">{value}</th>{state.values.map((_, j) => { const linked = state.edges?.some(([a,b]) => a === i && b === j || !state.directed && a === j && b === i); return <td className={linked ? 'linked' : ''} key={j}>{linked ? state.weightedEdges?.find(([u,v]) => u === i && v === j || !state.directed && u === j && v === i)?.[2] ?? 1 : state.weightedEdges ? '·' : 0}</td> })}</tr>)}</tbody></table></div><div><h3>邻接表</h3><ul>{state.values.map((value, i) => <li key={i}><b>{value}</b><span>→</span>{state.edges?.flatMap(([a,b]) => a === i ? [state.values[b]] : !state.directed && b === i ? [state.values[a]] : []).sort((a,b) => Number(a)-Number(b)).join(' → ') || '∅'}</li>)}</ul></div></div>}
        <div className="lab-metrics"><span>{topicId === 'floyd' ? '带权有向图 · 下标从 0 开始' : topicId === 'hash' ? '散列地址 = ((值 % 11) + 11) % 11' : topicId === 'block' ? '先查块索引，再查候选块' : topicId === 'huffman' ? `比较 ${state.comparisons} 次 · 合并 ${state.writes} 次` : topicId === 'glist' ? `表长 ${state.length} · 深度 ${state.depth}` : topicId === 'matrix' ? matrixFormula[appliedOptions.order as MatrixOrder] : topicId === 'kmp' ? 'next 表示最长相等真前后缀长度' : topicId === 'stack' ? '数组末尾为栈顶' : topicId === 'graph' ? (state.directed ? '有向图 · 邻居按下标升序' : '无向图 · 邻居按下标升序') : dag.has(topicId) ? '有向图 · 拓扑顺序' : weighted.has(topicId) ? '带权无向图 · 下标从 0 开始' : topicId === 'bst' ? '节点下标为插入序号' : '下标从 0 开始'}</span><strong>{topicId === 'sequential' || topicId === 'block' || topicId === 'hash' ? `比较 ${state.comparisons} 次` : topicId === 'huffman' ? `${state.roots?.length} 棵树 / 已编码 ${Object.keys(state.codes ?? {}).length} 个符号` : topicId === 'glist' ? `${state.nodes?.length} 个节点 / 已访问 ${state.output.length} 个原子` : topicId === 'matrix' ? `${state.values.length} 个单元 / ${state.writes} ${appliedOptions.order === 'sparse' ? '个非零项' : '次写入'}` : topicId === 'binary' || topicId === 'string' || topicId === 'kmp' ? `比较 ${state.comparisons} 次` : topicId === 'graph' || weighted.has(topicId) || dag.has(topicId) ? `${state.values.length} 个节点 / ${state.edges?.length ?? 0} 条边` : topicId === 'bst' ? `${state.values.length} 个节点 / 比较 ${state.comparisons} 次` : `${state.values.length} 个元素 / 写入 ${state.writes} 次`}</strong></div>
        {topicId === 'block' && state.blocks && <div className="block-index" aria-label="分块索引">{state.blocks.map((block, index) => <span className={state.blockIndex === index ? 'active' : ''} key={index}><b>第 {index + 1} 块</b>下标 {block.start}–{block.end - 1}<strong>最大值 {block.max}</strong></span>)}</div>}
        {topicId === 'huffman' && <div className="huffman-codes" aria-label="当前哈夫曼编码">{state.values.map((weight, position) => { const symbol = String.fromCharCode(65 + position); return <span key={symbol}><b>{symbol} · {weight}</b><code>{state.codes?.[symbol] ?? '待生成'}</code></span> })}</div>}
        {topicId === 'dijkstra' && <div className="topic-distance" aria-label="当前各节点距离">{state.distances?.map((distance, position) => <span key={position}>{state.values[position]}: <b>{Number.isFinite(distance) ? distance : '∞'}</b></span>)}</div>}
        {topicId === 'floyd' && state.distanceMatrix && <div className="floyd-matrix"><table aria-label="当前最短距离矩阵"><thead><tr><th scope="col">起点 ↓ / 终点 →</th>{state.values.map((value, j) => <th scope="col" key={j}>{value}</th>)}</tr></thead><tbody>{state.distanceMatrix.map((row, i) => <tr key={i}><th scope="row">{state.values[i]}</th>{row.map((distance, j) => <td className={state.active.includes(i) && state.active.includes(j) ? 'active' : ''} key={j}>{Number.isFinite(distance) ? distance : '∞'}</td>)}</tr>)}</tbody></table></div>}
        {dag.has(topicId) && <div className="dag-state" aria-label="图算法变量">{state.values.map((value, i) => <span key={i} className={state.active.includes(i) ? 'active' : ''}><b>{value}</b>入度 {state.indegrees?.[i]}{topicId === 'critical' && <> · ve {state.earliest?.[i]} · vl {state.latest?.[i] ?? '待计算'}</>}</span>)}</div>}
        {topicId === 'brackets' && <div className="bracket-stack" aria-label="当前括号栈">栈底 → {state.stackValues?.join('　') || '空'} ← 栈顶</div>}
        {topicId === 'expression' && <div className="expression-stacks" aria-label="表达式双栈"><div><b>运算符栈</b><span>{state.operators?.join('　') || '空'}</span></div><div><b>数值栈</b><span>{state.operands?.join('　') || '空'}</span></div></div>}
        {(topicId === 'generalTree' || topicId === 'tree' || topicId === 'threaded' || topicId === 'graph' || topicId === 'glist') && <div className="topic-output">访问结果：{state.output.join(' → ') || '等待访问节点'}{topicId === 'threaded' && ` · 已建立 ${state.threads?.length ?? 0} 条线索`}</div>}
        {(topicId === 'binary' || topicId === 'string' || topicId === 'kmp' || topicId === 'sequential' || topicId === 'block' || topicId === 'hash') && result !== undefined && <div className="topic-output">查找结果：{result === -1 ? '未找到（-1）' : topicId === 'hash' ? `槽位 ${result}` : `下标 ${result}`}</div>}
        {(topicId === 'bst' || topicId === 'avl') && <div className="topic-output">查找路径：{state.output.join(' → ') || '等待建树完成'}{result !== undefined && ` · ${result === -1 ? '未找到' : `找到 ${appliedOptions.target}`}`}</div>}
        {(topicId === 'prim' || topicId === 'kruskal') && <div className="topic-output">已选边：{state.output.join('，') || '等待选择'} · 总权重 {step.variables?.total ?? 0}</div>}
        {topicId === 'dijkstra' && <div className="topic-output">到节点 {state.values[appliedOptions.target ?? 0]} 的路径：{state.output.join(' → ') || '等待计算'}{result !== undefined && ` · ${result === -1 ? '不可达' : `距离 ${result}`}`}</div>}
        {topicId === 'floyd' && <div className="topic-output">从 {state.values[appliedOptions.start ?? 0]} 到 {state.values[appliedOptions.target ?? 0]}：{state.output.join(' → ') || '等待计算'}{result !== undefined && ` · ${result === -1 ? '不可达' : `最短距离 ${result}`}`}</div>}
        {dag.has(topicId) && <div className="topic-output">拓扑序列：{state.output.join(' → ') || '等待处理'}{topicId === 'critical' && step.variables?.duration !== undefined && ` · 总工期 ${step.variables.duration}`}</div>}
        {topicId === 'circularQueue' && <div className="topic-output">队列：{state.values.join(' → ') || '空'} · front {state.front} / rear {state.rear}</div>}
        {topicId === 'brackets' && result !== undefined && <div className="topic-output">匹配结果：{result === 1 ? '全部匹配' : '不匹配'}</div>}
        {linkedTypes.has(topicId) && <div className="topic-output">{appliedOptions.operation==='search' ? `查找：${result===undefined?'等待搜索':result===-1?'未找到':`位置 ${result}`}` : appliedOptions.operation==='traverse' ? `遍历：${state.output.join(' → ')||'空'}` : `链表：${state.values.join(' → ')||'空'}`}</div>}
        {(topicId==='linkedStack'||topicId==='linkedQueue')&&<div className="topic-output">{topicId==='linkedStack'?'栈顶':'队首'} → {state.values.join(' → ')||'空'}{topicId==='linkedQueue'&&' ← 队尾'}</div>}
        {topicId==='array'&&['search','traverse'].includes(appliedOptions.operation??'')&&<div className="topic-output">{appliedOptions.operation==='search'?`查找：${result===undefined?'等待搜索':result===-1?'未找到':`下标 ${result}`}`:`遍历：${state.output.join(' → ')||'空'}`}</div>}
        {topicId==='stringOps'&&<div className="topic-output">{appliedOptions.operation==='compare'?`比较结果：${result===undefined?'等待比较':result===0?'相等':Number(result)<0?'主串较小':'主串较大'}`:appliedOptions.operation==='length'?`串长：${result??'等待计算'}`:appliedOptions.operation==='substring'?`截取结果：${state.output.join('')||'等待复制'}`:`当前串：${state.values.join('')||'空'}`}</div>}
        {topicId==='treeEdit'&&<div className="topic-output">当前节点：{state.treeSlots?.map((value,i)=>value===null?null:`${i}:${value}`).filter(Boolean).join('，')||'空树'}</div>}
        {(topicId==='tree'||topicId==='generalTree'||topicId==='threaded')&&<div className="tree-aux" aria-label="递归栈或辅助队列">{step.variables?.queue!==undefined?`辅助队列（队首 → 队尾）：${step.variables.queue||'空'}`:`递归调用栈（根 → 当前）：${state.path?.map(i=>state.values[i]).join(' → ')||'空'}`}</div>}
        {topicId === 'expression' && result !== undefined && <div className="topic-output">计算结果：{result}</div>}
        <div className="player" aria-label="动画控制"><div className="timeline-row"><input type="range" min="0" max={maxIndex} value={index} onChange={event => move(Number(event.target.value))} disabled={dirty} aria-label="算法步骤"/><span>{index} / {maxIndex} 步</span></div><div className="player-controls"><div className="player-buttons"><Button variant="outline" aria-label="重置" title="重置" onClick={() => move(0)} disabled={dirty || index === 0}><RotateCcw size={16}/></Button><Button variant="outline" aria-label="上一步" title="上一步" onClick={() => move(index - 1)} disabled={dirty || index === 0}><ChevronLeft size={17}/></Button><Button onClick={togglePlay} disabled={dirty || maxIndex === 0}>{playing ? <><Pause size={16}/>暂停</> : <><Play size={16}/>播放</>}</Button><Button variant="outline" aria-label="下一步" title="下一步" onClick={() => move(index + 1)} disabled={dirty || index === maxIndex}><ChevronRight size={17}/></Button></div><label className="speed-control">播放速度 <select value={speed} onChange={event => timeline.setSpeed(Number(event.target.value))} aria-label="播放速度">{speeds.map(value => <option key={value} value={value}>{value}×</option>)}</select></label></div></div>
        <div className="step-detail" aria-live="polite"><span>{dirty ? '等待应用输入' : index === 0 ? '准备开始' : index === maxIndex ? '演示完成' : `第 ${index} 步`}</span><p>{dirty ? '点击“应用数据”后将重新生成全部步骤。' : step.description}</p></div>
      </div>
      <div className="lab-card code-card"><div className="lab-card-head"><div><h2>代码对照</h2><p>高亮行与当前操作同步</p></div><Button variant="ghost" className="copy-code" onClick={copy} aria-label="复制当前语言代码"><Copy size={15}/>{copyLabel}</Button></div><div className="code-tabs" role="tablist" aria-label="代码语言">{languages.map(item => <button key={item} type="button" role="tab" aria-selected={language === item} onClick={() => setLanguage(item)}>{item}</button>)}</div><div className="code-filename">{topicId}.{language === 'Python' ? 'py' : language === 'C++' ? 'cpp' : 'c'}</div><div className="code-lines" ref={codeRef} role="tabpanel" aria-label={`${language} 算法代码`}>{run.code[language].map((text, line) => <div className={`code-line ${(step.sourceMap.lines[language] ?? step.highlightedLines[language]).includes(line + 1) ? 'is-highlighted' : ''}`} data-line={line + 1} key={line}><span aria-hidden="true">{String(line + 1).padStart(2, '0')}</span><code>{text}</code></div>)}</div><div className="code-note"><CircleHelp size={15}/><span>教学核心片段；省略头文件、结构定义与入口，不是在线编译器。</span></div><VariableMonitor step={step} previous={steps[index - 1]}/></div>
    </section>
    <section className="knowledge-card" aria-label="算法知识"><div><h2>理解这个算法</h2><p>{lesson.principle}</p></div><div><h2>复杂度速览</h2><dl><div><dt>时间</dt><dd>{lesson.time}</dd></div><div><dt>额外空间</dt><dd>{topicId === 'matrix' ? matrixSpace[appliedOptions.order as MatrixOrder] : lesson.space}</dd></div></dl><small>{lesson.tip}</small></div></section><StudyNotes id={topicId}/>
  </div>
}
