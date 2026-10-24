import { useState } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react'
import { Button } from './ui/button'
import { useTimeline } from './useTimeline'
import { generateRecursionSteps, parseRecursionInput, recursionCases, type CallNode, type RecursionCase } from '../engine/recursion'
import './RecursionLab.css'

function CallTree({ nodes, parent }: { nodes: CallNode[]; parent?: string }) {
  const children = nodes.filter(node => node.parentId === parent)
  if (!children.length) return null
  return <ul>{children.map(node => <li key={node.id}><div className={`rec-call ${node.status}`}><strong>{node.name}({Object.values(node.args).join(', ')})</strong><small>深度 {node.depth + 1} · {{ pending: '待调用', active: '执行中', waiting: '等待子调用', completed: '已返回' }[node.status]}{node.result !== undefined ? ` · 返回 ${node.result}` : ''}</small></div><CallTree nodes={nodes} parent={node.id}/></li>)}</ul>
}

export function RecursionLab() {
  const [kind, setKind] = useState<RecursionCase>('preorder')
  const [draft, setDraft] = useState(recursionCases.preorder.input)
  const [error, setError] = useState('')
  const [language, setLanguage] = useState<'C' | 'C++'>('C++')
  const [initialSteps] = useState(() => generateRecursionSteps('preorder', parseRecursionInput('preorder', recursionCases.preorder.input)))
  const { timeline, steps, index, playing, speed } = useTimeline(initialSteps)
  const step = steps[index], state = step.state, end = steps.length - 1
  const changeCase = (next: RecursionCase) => { const input = recursionCases[next].input; timeline.replace(generateRecursionSteps(next, parseRecursionInput(next, input))); setKind(next); setDraft(input); setError('') }
  const apply = () => { try { timeline.replace(generateRecursionSteps(kind, parseRecursionInput(kind, draft))); setError('') } catch (cause) { setError(cause instanceof Error ? cause.message : '输入无效。') } }
  const isTree = kind === 'preorder' || kind === 'inorder' || kind === 'postorder'
  const point = (i: number) => { const level = Math.floor(Math.log2(i + 1)), rank = i - (2 ** level - 1); return { x: 340 + (rank + .5 - 2 ** (level - 1)) * (560 / 2 ** level), y: 36 + level * 70 } }
  return <div className="rec-lab">
    <div className="rec-card rec-heading"><div><h2>递归调用栈实验台</h2><p>同一步骤同步观察算法结构、调用树、活动栈帧、返回值与 C/C++ 代码。</p></div><span>确定性教学模拟 · 不执行任意代码</span></div>
    <div className="rec-card rec-controls"><label>教学案例<select aria-label="递归教学案例" value={kind} onChange={event => changeCase(event.target.value as RecursionCase)}>{Object.entries(recursionCases).map(([id, item]) => <option key={id} value={id}>{item.title}</option>)}</select></label><label>输入数据<input aria-label="递归输入数据" value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') apply() }} aria-invalid={!!error}/></label><Button onClick={apply}>应用数据</Button><small>{recursionCases[kind].hint}</small>{error && <p role="alert">{error}</p>}</div>
    <div className="rec-stats"><span>当前深度 <b>{state.frames.length}</b></span><span>最大深度 <b>{state.maxDepth}</b></span><span>调用次数 <b>{state.calls.length}</b></span><span>活动调用链 <b>{state.frames.map(frame => frame.name).join(' → ') || '空'}</b></span></div>
    <div className="rec-grid">
      <section className="rec-card rec-structure"><h3>算法结构 <small>{isTree ? '层序二叉树' : kind === 'factorial' ? '递归参数' : kind === 'dfs' ? '示例图访问顺序' : '当前数组'}</small></h3>{isTree ? <svg viewBox="0 0 680 310" role="img" aria-label="二叉树与当前节点">{state.values.map((_, i) => i > 0 ? <line key={`e${i}`} x1={point(Math.floor((i - 1) / 2)).x} y1={point(Math.floor((i - 1) / 2)).y} x2={point(i).x} y2={point(i).y} stroke="#c2d2de" strokeWidth="2"/> : null)}{state.values.map((value, i) => <g key={i}><circle cx={point(i).x} cy={point(i).y} r="22" fill={state.active.includes(i) ? '#eab76c' : '#dce9ef'}/><text x={point(i).x} y={point(i).y + 5} textAnchor="middle" fill="#173d48" fontSize="16">{value}</text><text x={point(i).x} y={point(i).y + 38} textAnchor="middle" fill="#72909b" fontSize="11">{i}</text></g>)}</svg> : <div className="rec-values">{state.values.map((value, i) => <span key={i} className={state.active.includes(i) || step.highlightedElements.includes(String(i)) ? 'active' : ''}>{value}<small>{i}</small></span>)}</div>}<p>输出：{state.output.join(' → ') || (kind === 'factorial' && state.calls[0]?.result !== undefined ? state.calls[0].result : '等待执行')}</p></section>
      <section className="rec-card"><h3>递归调用树 <small>保留已返回的调用</small></h3><div className="rec-tree"><CallTree nodes={state.calls}/></div></section>
      <section className="rec-card"><h3>当前活动调用栈 <small>栈顶在前</small></h3><div className="rec-frames">{[...state.frames].reverse().map(frame => <article key={frame.id}><strong>{frame.name}({Object.values(frame.args).join(', ')})</strong><small>深度 {frame.depth + 1} · 代码第 {frame.line} 行</small><div>参数：{Object.entries(frame.args).map(([key, value]) => `${key}=${value}`).join('，')}</div><div>局部：{Object.entries(frame.locals).map(([key, value]) => `${key}=${value}`).join('，') || '尚无'}</div>{frame.result !== undefined && <div>返回值：{frame.result}</div>}</article>)}{!state.frames.length && <p>当前没有活动栈帧。</p>}</div></section>
      <section className="rec-card rec-code"><div className="rec-code-head"><h3>C/C++ 代码对照</h3><div role="tablist" aria-label="递归代码语言">{(['C', 'C++'] as const).map(item => <button key={item} role="tab" aria-selected={language === item} onClick={() => setLanguage(item)}>{item}</button>)}</div></div><div role="tabpanel" aria-label={`${language} 递归代码`}>{recursionCases[kind].code.map((line, i) => <div key={i} className={step.highlightedLines[language].includes(i + 1) ? 'active' : ''}><span>{String(i + 1).padStart(2, '0')}</span><code>{line}</code></div>)}</div><small>代码为对应核心逻辑的教学片段；数组、辅助函数和图邻接表由示例预置。</small></section>
    </div>
    <div className="rec-card rec-player" aria-label="递归播放控制"><input type="range" min="0" max={end} value={index} aria-label="递归步骤" onChange={event => timeline.seek(Number(event.target.value))}/><span>{index} / {end} 步</span><div><Button variant="outline" aria-label="重置递归演示" disabled={index === 0} onClick={() => timeline.reset()}><RotateCcw size={16}/></Button><Button variant="outline" aria-label="递归上一步" disabled={index === 0} onClick={() => timeline.previous()}><ChevronLeft size={16}/></Button><Button onClick={() => playing ? timeline.pause() : timeline.play()}>{playing ? <><Pause size={16}/>暂停</> : <><Play size={16}/>播放</>}</Button><Button variant="outline" aria-label="递归下一步" disabled={index === end} onClick={() => timeline.next()}><ChevronRight size={16}/></Button></div><label>速度<select aria-label="递归播放速度" value={speed} onChange={event => timeline.setSpeed(Number(event.target.value))}>{[0.5, 1, 1.5, 2].map(value => <option key={value} value={value}>{value}×</option>)}</select></label></div>
    <div className="rec-card rec-explain" aria-live="polite"><strong>{step.phase} · 第 {index} 步</strong><p>{step.description}</p><small>{step.phase === 'RETURN' || step.phase === 'FRAME_POP' ? '回溯：子函数返回，控制权交还父函数。' : step.phase === 'RECURSE' || step.phase === 'CALL' ? '展开：新的函数调用即将压入栈。' : ''}</small></div>
  </div>
}
