import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, CircleHelp, Copy, Pause, Play, RotateCcw } from 'lucide-react'
import { Button } from './ui/button'
import { parseBubbleInput, type BubbleLanguage } from '../engine/bubble'
import { sortAlgorithms, type SortId } from '../engine/sorting'
import { toExecutionSteps } from '../engine/stepAdapter'
import { StudyNotes } from './StudyNotes'
import { VariableMonitor } from './VariableMonitor'
import { useTimeline } from './useTimeline'
import { CaseControls } from './CaseControls'
import type { LabCase } from '../engine/labCases'
import './SortingExtras.css'

const initialInput = '42, 18, 65, 30, 8, 55, 24, 72'
const languages: BubbleLanguage[] = ['C', 'C++', 'Python']
const speeds = [0.25, 0.5, 1, 1.5, 2, 4]

export function SortingLab({ sortId }: { sortId: SortId }) {
  const algorithm = sortAlgorithms[sortId]
  const [draft, setDraft] = useState(initialInput)
  const [applied, setApplied] = useState(initialInput)
  const [initialSteps] = useState(() => toExecutionSteps(sortId, algorithm.generate(parseBubbleInput(initialInput))))
  const { timeline, steps, index, playing, speed } = useTimeline(initialSteps)
  const [language, setLanguage] = useState<BubbleLanguage>('C++')
  const [error, setError] = useState('')
  const [copyLabel, setCopyLabel] = useState('复制代码')
  const codeRef = useRef<HTMLDivElement>(null)
  const dirty = draft !== applied
  const step = steps[index]
  const state = step.state
  const maxIndex = steps.length - 1

  useEffect(() => {
    const line = step.highlightedLines[language][0]
    const pane = codeRef.current
    const row = pane?.querySelector<HTMLElement>(`[data-line="${line}"]`)
    if (pane && row) pane.scrollTop = Math.max(0, row.offsetTop - pane.offsetTop - pane.clientHeight / 2)
  }, [index, language, step])

  const apply = () => {
    try {
      const next = toExecutionSteps(sortId, algorithm.generate(parseBubbleInput(draft)))
      timeline.replace(next)
      setApplied(draft)
      setError('')
    } catch (cause) {
      timeline.pause()
      setError(cause instanceof Error ? cause.message : '输入无效。')
    }
  }
  const loadCase = (item: LabCase) => {
    if (item.algorithmId !== sortId) throw new Error('案例与当前实验台不匹配。')
    timeline.replace(toExecutionSteps(sortId, algorithm.generate(parseBubbleInput(item.input))))
    setDraft(item.input); setApplied(item.input); setError('')
  }
  const move = (next: number) => timeline.seek(next)
  const togglePlay = () => {
    if (dirty) return
    if (playing) timeline.pause()
    else timeline.play()
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(algorithm.code[language].join('\n'))
      setCopyLabel('已复制')
    } catch { setCopyLabel('请手动复制') }
    window.setTimeout(() => setCopyLabel('复制代码'), 1500)
  }
  const values = state.values
  const initialValues = steps[0].state.values
  const low = initialValues.length ? Math.min(...initialValues) : 0
  const high = initialValues.length ? Math.max(...initialValues) : 0
  const activeLines = step.sourceMap.lines[language] ?? step.highlightedLines[language]
  const activeElements = step.operations.length ? step.operations.flatMap(operation => operation.elements ?? []) : step.highlightedElements
  const lo = Number(step.variables?.lo), hi = Number(step.variables?.hi)
  const rangeEnd = sortId === 'merge' ? hi - 1 : hi
  const hasRange = Number.isInteger(lo) && Number.isInteger(hi) && lo <= rangeEnd
  const heapSize = sortId === 'heap' ? state.heapSize ?? values.length : 0

  return <div className="native-lab">
    <section className="lab-workspace" aria-label={`${algorithm.title}实验台`}>
      <div className="lab-card canvas-card">
        <div className="lab-card-head"><div><h2>算法演示</h2><p>每次比较和数据移动都来自真实执行步骤</p></div><span className="lab-badge">{algorithm.title}</span></div>
        <div className="lab-input"><label htmlFor="sort-input">输入数据</label><div className="lab-input-row"><input id="sort-input" value={draft} onChange={event => { setDraft(event.target.value); timeline.pause(); setError('') }} onKeyDown={event => { if (event.key === 'Enter') apply() }} placeholder="例如 5, 2, 8, 1" aria-invalid={!!error} aria-describedby={error ? 'sort-error' : 'sort-hint'} /><Button onClick={apply}>应用数据</Button></div><small id="sort-hint">最多 16 个整数，范围 -99 至 99；留空可观察空数组。</small>{error && <p className="lab-error" id="sort-error" role="alert">{error}</p>}</div>
        <CaseControls current={{ version: 1, algorithmId: sortId, input: draft, options: {} }} onLoad={loadCase}/>
        <div className="bar-legend"><span><i className="legend-default"/>待处理</span><span><i className="legend-active"/>当前操作</span><span><i className="legend-done"/>已完成</span></div>
        <div className="bar-stage" aria-label="数组柱状图">{values.length ? values.map((value, position) => {
          const active = activeElements.includes(String(position))
          const finished = state.done.includes(position)
          const height = high === low ? 110 : 44 + ((value - low) / (high - low)) * 145
          return <div className={`bar-slot ${hasRange && (position < lo || position > rangeEnd) && !finished ? 'outside-range' : ''} ${sortId === 'quick' && position === hi && !finished ? 'pivot-bar' : ''}`} key={position}><span className="bar-value">{value}</span><div className={`sort-bar ${active ? 'is-active' : finished ? 'is-done' : ''}`} style={{ height: `${height}px` }}/><span className="bar-index">{position}</span></div>
        }) : <div className="bar-empty">当前是空数组。点击“下一步”查看算法如何结束。</div>}</div>
        {state.temp && <div className="sort-extra" aria-label="归并临时数组"><strong>临时数组{sortId === 'merge' && Number.isInteger(Number(step.variables?.mid)) ? ` · 左 [${lo}, ${step.variables?.mid}) / 右 [${step.variables?.mid}, ${hi})` : ''}</strong><div className="sort-temp">{state.temp.map((value, position) => <span key={position}><small>{position}</small>{value ?? '·'}</span>)}</div></div>}
        {heapSize > 0 && <div className="sort-extra" aria-label="当前大根堆"><strong>堆结构 · 前 {heapSize} 个数组元素</strong><svg viewBox="0 0 680 340" role="img" aria-label={`堆中有 ${heapSize} 个节点`}>{values.slice(0, heapSize).map((_, i) => { if (!i) return null; const level = Math.floor(Math.log2(i + 1)), rank = i - (2 ** level - 1), parent = Math.floor((i - 1) / 2), parentLevel = level - 1, parentRank = parent - (2 ** parentLevel - 1); const x = 340 + (rank + .5 - 2 ** (level - 1)) * (600 / 2 ** level), y = 32 + level * 62, px = 340 + (parentRank + .5 - 2 ** (parentLevel - 1)) * (600 / 2 ** parentLevel), py = 32 + parentLevel * 62; return <line key={i} x1={px} y1={py} x2={x} y2={y} /> })}{values.slice(0, heapSize).map((value, i) => { const level = Math.floor(Math.log2(i + 1)), rank = i - (2 ** level - 1), x = 340 + (rank + .5 - 2 ** (level - 1)) * (600 / 2 ** level), y = 32 + level * 62; return <g key={i}><circle cx={x} cy={y} r="20" className={step.highlightedElements.includes(String(i)) ? 'active' : ''}/><text x={x} y={y + 4}>{value}</text><text className="heap-index" x={x} y={y + 34}>{i}</text></g> })}</svg></div>}
        {state.buckets && <div className="sort-extra" aria-label="基数排序分桶"><strong>当前十进制桶</strong><div className="sort-buckets">{state.buckets.map((bucket, digit) => <span key={digit}><b>{digit}</b>{bucket.join('、') || '·'}</span>)}</div></div>}
        <div className="lab-metrics"><span>{hasRange ? `当前区间 ${sortId === 'merge' ? `[${lo}, ${hi})` : `[${lo}, ${hi}]`}${sortId === 'quick' ? ` · 基准 ${step.variables?.pivot}` : ''}` : state.heapSize !== undefined ? `当前堆区间 [0, ${state.heapSize - 1}]` : '下标从 0 开始'}</span><strong>比较 {step.metrics.comparisons} 次 / 写入 {step.metrics.writes} 次{sortId === 'bubble' ? ` / 交换 ${step.metrics.swaps} 次` : ''}</strong></div>
        <div className="player" aria-label="动画控制">
          <div className="timeline-row"><input type="range" min="0" max={maxIndex} value={index} onChange={event => move(Number(event.target.value))} disabled={dirty} aria-label="算法步骤"/><span>{index} / {maxIndex} 步</span></div>
          <div className="player-controls"><div className="player-buttons"><Button variant="outline" aria-label="重置" title="重置" onClick={() => move(0)} disabled={dirty || index === 0}><RotateCcw size={16}/></Button><Button variant="outline" aria-label="上一步" title="上一步" onClick={() => move(index - 1)} disabled={dirty || index === 0}><ChevronLeft size={17}/></Button><Button onClick={togglePlay} disabled={dirty || maxIndex === 0}>{playing ? <><Pause size={16}/>暂停</> : <><Play size={16}/>播放</>}</Button><Button variant="outline" aria-label="下一步" title="下一步" onClick={() => move(index + 1)} disabled={dirty || index === maxIndex}><ChevronRight size={17}/></Button></div><label className="speed-control">播放速度 <select value={speed} onChange={event => timeline.setSpeed(Number(event.target.value))} aria-label="播放速度">{speeds.map(value => <option key={value} value={value}>{value}×</option>)}</select></label></div>
        </div>
        <div className="step-detail" aria-live="polite"><span>{dirty ? '等待应用输入' : index === 0 ? '准备开始' : index === maxIndex ? '演示完成' : `第 ${index} 步`}</span><p>{dirty ? '点击“应用数据”后将重新生成全部步骤。' : step.description}</p></div>
      </div>
      <div className="lab-card code-card"><div className="lab-card-head"><div><h2>代码对照</h2><p>高亮行与当前操作同步</p></div><Button variant="ghost" className="copy-code" onClick={copy} aria-label="复制当前语言代码"><Copy size={15}/>{copyLabel}</Button></div><div className="code-tabs" role="tablist" aria-label="代码语言">{languages.map(item => <button key={item} type="button" role="tab" aria-selected={language === item} onClick={() => setLanguage(item)}>{item}</button>)}</div><div className="code-filename">{sortId}.{language === 'Python' ? 'py' : language === 'C++' ? 'cpp' : 'c'}</div><div className="code-lines" ref={codeRef} role="tabpanel" aria-label={`${language} 算法代码`}>{algorithm.code[language].map((text, line) => <div className={`code-line ${activeLines.includes(line + 1) ? 'is-highlighted' : ''}`} data-line={line + 1} key={line}><span aria-hidden="true">{String(line + 1).padStart(2, '0')}</span><code>{text}</code></div>)}</div><div className="code-note"><CircleHelp size={15}/><span>教学核心片段；省略头文件与入口，不是在线编译器。</span></div><VariableMonitor step={step} previous={steps[index - 1]}/></div>
    </section>
    <section className="knowledge-card" aria-label="算法知识"><div><h2>理解这个算法</h2><p>{algorithm.principle}</p></div><div><h2>复杂度速览</h2><dl><div><dt>时间</dt><dd>{algorithm.time}</dd></div><div><dt>额外空间</dt><dd>{algorithm.space}</dd></div></dl><small>{algorithm.note}</small></div></section><StudyNotes id={sortId}/>
  </div>
}

