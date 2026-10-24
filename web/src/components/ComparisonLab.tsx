import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react'
import { Button } from './ui/button'
import { timedComparisonRun, comparisons, type CompareId, type CompareStep } from '../engine/comparison'
import './ComparisonLab.css'
import './AdvancedViz.css'

const complexity: Record<string, string> = { bubble: 'O(n²)', quick: '平均 O(n log n)，最坏 O(n²)', insertion: 'O(n²)', merge: 'O(n log n)', sequential: 'O(n)', binary: 'O(log n)', graph: 'O(V + E)', array: 'O(n)', linked: 'O(n)' }

export function ComparisonLab() {
  const [mode, setMode] = useState<CompareId>('sort')
  const [input, setInput] = useState(comparisons.sort.input)
  const [target, setTarget] = useState(comparisons.sort.target ?? 0)
  const [edges, setEdges] = useState(comparisons.sort.edges ?? '')
  const [result, setResult] = useState(() => timedComparisonRun('sort', comparisons.sort.input, 0, ''))
  const [indices, setIndices] = useState<[number, number]>([0, 0])
  const [synced, setSynced] = useState(true)
  const [playing, setPlaying] = useState<[boolean, boolean]>([false, false])
  const [speed, setSpeed] = useState(1)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const config = comparisons[mode]
  const { runs, milliseconds } = result
  const ends: [number, number] = [runs[0].length - 1, runs[1].length - 1]
  const syncEnd = Math.max(...ends)
  useEffect(() => {
    if (!playing.some(Boolean)) return
    const timer = window.setTimeout(() => setIndices(current => current.map((value, side) => playing[side] ? Math.min(ends[side], value + 1) : value) as [number, number]), 650 / speed)
    return () => window.clearTimeout(timer)
  }, [playing, indices, ends[0], ends[1], speed])
  useEffect(() => {
    if (playing.some((active, side) => active && indices[side] >= ends[side])) setPlaying(current => current.map((active, side) => active && indices[side] < ends[side]) as [boolean, boolean])
  }, [indices, playing, ends[0], ends[1]])
  const reset = (next: ReturnType<typeof timedComparisonRun>) => { setResult(next); setIndices([0, 0]); setPlaying([false, false]); setDirty(false); setError('') }
  const changeMode = (next: CompareId) => { const item = comparisons[next]; setMode(next); setInput(item.input); setTarget(item.target ?? 0); setEdges(item.edges ?? ''); reset(timedComparisonRun(next, item.input, item.target ?? 0, item.edges ?? '')) }
  const apply = () => { try { reset(timedComparisonRun(mode, input, target, edges)) } catch (cause) { setError(cause instanceof Error ? cause.message : '输入无效。'); setPlaying([false, false]) } }
  const move = (side: 0 | 1, next: number) => {
    setPlaying([false, false])
    if (synced) setIndices([Math.min(ends[0], Math.max(0, next)), Math.min(ends[1], Math.max(0, next))])
    else setIndices(current => current.map((value, i) => i === side ? Math.min(ends[i], Math.max(0, next)) : value) as [number, number])
  }
  const toggle = (side: 0 | 1) => {
    const next = synced ? [true, true] as [boolean, boolean] : side === 0 ? [true, false] as [boolean, boolean] : [false, true] as [boolean, boolean]
    if (playing.some(Boolean)) { setPlaying([false, false]); return }
    setIndices(current => current.map((value, i) => next[i] && value >= ends[i] ? 0 : value) as [number, number])
    setPlaying(next)
  }
  return <div className="compare-lab">
    <div className="compare-form"><label>对比组合<select aria-label="对比组合" value={mode} onChange={event => changeMode(event.target.value as CompareId)}>{Object.entries(comparisons).map(([id, item]) => <option key={id} value={id}>{item.title}</option>)}</select></label><label>同一组输入<input aria-label="对比输入" value={input} onChange={event => { setInput(event.target.value); setDirty(true); setPlaying([false, false]); setError('') }}/></label>{mode === 'graph' && <label>边（下标）<input aria-label="对比图边" value={edges} onChange={event => { setEdges(event.target.value); setDirty(true); setPlaying([false, false]); setError('') }}/></label>}{(mode === 'search' || mode === 'list') && <label>目标值<input aria-label="对比目标值" type="number" value={target} onChange={event => { setTarget(Number(event.target.value)); setDirty(true); setPlaying([false, false]); setError('') }}/></label>}<Button onClick={apply}>应用数据</Button>{error && <p role="alert" className="lab-error">{error}</p>}<small>{config.note}</small></div>
    <div className="compare-player" aria-label="对比动画控制"><label>播放方式<select aria-label="播放方式" value={synced ? 'sync' : 'independent'} onChange={event => { setSynced(event.target.value === 'sync'); setPlaying([false, false]); setIndices([0, 0]) }}><option value="sync">同步</option><option value="independent">独立</option></select></label><label>速度<select aria-label="对比播放速度" value={speed} onChange={event => setSpeed(Number(event.target.value))}>{[0.5, 1, 1.5, 2, 4].map(value => <option key={value} value={value}>{value}×</option>)}</select></label>{synced && <><input type="range" min="0" max={syncEnd} value={Math.max(...indices)} onChange={event => move(0, Number(event.target.value))} disabled={dirty} aria-label="同步步骤"/><span>{Math.max(...indices)} / {syncEnd} 步</span><div><Button variant="outline" aria-label="重置对比" onClick={() => move(0, 0)} disabled={dirty || indices.every(i => i === 0)}><RotateCcw size={16}/></Button><Button variant="outline" aria-label="上一步" onClick={() => move(0, Math.max(...indices) - 1)} disabled={dirty || indices.every(i => i === 0)}><ChevronLeft size={16}/></Button><Button onClick={() => toggle(0)} disabled={dirty}>{playing.some(Boolean) ? <><Pause size={16}/>暂停</> : <><Play size={16}/>同步播放</>}</Button><Button variant="outline" aria-label="下一步" onClick={() => move(0, Math.max(...indices) + 1)} disabled={dirty || indices.every((i, side) => i === ends[side])}><ChevronRight size={16}/></Button></div></>}</div>
    <p className="compare-disclaimer">计算耗时为浏览器单次生成步骤的测量值；小输入容易受设备和调度影响，动画播放时长不计入。</p>
    <div className="compare-columns">{runs.map((steps, side) => <CompareSide key={`${mode}-${side}`} title={side ? config.right : config.left} link={config.links[side]} step={steps[indices[side]]} current={indices[side]} total={ends[side]} milliseconds={milliseconds[side]} complexity={complexity[config.links[side]]} independent={!synced} playing={playing[side]} disabled={dirty} onMove={next => move(side as 0 | 1, next)} onToggle={() => toggle(side as 0 | 1)}/>)}</div>
  </div>
}

function CompareSide({ title, link, step, current, total, complexity, milliseconds, independent, playing, disabled, onMove, onToggle }: { title: string; link: string; step: CompareStep; current: number; total: number; complexity: string; milliseconds: number; independent: boolean; playing: boolean; disabled: boolean; onMove: (next: number) => void; onToggle: () => void }) {
  const active = new Set(step.highlightedElements.map(Number)), done = new Set(step.state.done)
  return <section className="compare-side"><div className="compare-side-head"><h2>{title}</h2><Link to={`/lab/${link}`}>打开完整实验台 →</Link></div>{independent && <div className="compare-side-controls"><input type="range" min="0" max={total} value={current} aria-label={`${title}步骤`} disabled={disabled} onChange={event => onMove(Number(event.target.value))}/><Button variant="outline" onClick={() => onMove(current - 1)} disabled={disabled || current === 0} aria-label={`${title}上一步`}><ChevronLeft size={15}/></Button><Button onClick={onToggle} disabled={disabled}>{playing ? '暂停' : '播放'}</Button><Button variant="outline" onClick={() => onMove(current + 1)} disabled={disabled || current === total} aria-label={`${title}下一步`}><ChevronRight size={15}/></Button></div>}<div className="compare-sequence" aria-label={`${title}当前数据`}>{step.state.values.map((value, i) => <span key={i} className={active.has(i) ? 'active' : done.has(i) ? 'done' : ''}><small>{i}</small><b>{value}</b></span>)}</div><div className="compare-counts"><span>比较 <b>{step.state.comparisons}</b> 次</span><span>写入 <b>{step.state.writes}</b> 次</span><span>访问 <b>{step.state.output?.length ?? 0}</b> 个</span><span>可计操作 <b>{step.state.comparisons + step.state.writes + (step.state.output?.length ?? 0)}</b> 次</span><span>{current === total ? '已完成' : '进行中'} · 步骤 {current}/{total}</span><span>理论时间 {complexity}</span><span>本机生成耗时 {milliseconds.toFixed(2)} ms</span></div>{step.state.output && <p className="compare-output">访问/查找结果：{step.state.output.join(' → ') || '等待执行'}</p>}<p className="compare-description" aria-live="polite">{step.description}</p></section>
}
