import { useState } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react'
import { Button } from './ui/button'
import { useTimeline } from './useTimeline'
import { generateMemorySteps, memoryScenarios, type MemoryScenario } from '../engine/memorySimulator'
import './MemoryLab.css'

export function MemoryLab() {
  const [scenario, setScenario] = useState<MemoryScenario>('insert')
  const [language, setLanguage] = useState<'C' | 'C++'>('C++')
  const [initialSteps] = useState(() => generateMemorySteps('insert'))
  const { timeline, steps, index, playing, speed } = useTimeline(initialSteps)
  const step = steps[index], state = step.state, end = steps.length - 1
  const changeScenario = (next: MemoryScenario) => { timeline.replace(generateMemorySteps(next)); setScenario(next) }
  const active = new Set(step.highlightedElements)
  const code = memoryScenarios[scenario].code[language]
  return <div className="memory-lab">
    <div className="memory-intro"><div><h2>指针与内存模拟器</h2><p>{memoryScenarios[scenario].note}</p></div><span>教学模拟地址 · 非真实 C/C++ 运行</span></div>
    <div className="memory-select"><label>教学案例<select aria-label="内存教学案例" value={scenario} onChange={event => changeScenario(event.target.value as MemoryScenario)}><optgroup label="实验">{Object.entries(memoryScenarios).filter(([, item]) => item.group === '实验').map(([id, item]) => <option key={id} value={id}>{item.title}</option>)}</optgroup><optgroup label="常见错误">{Object.entries(memoryScenarios).filter(([, item]) => item.group === '常见错误').map(([id, item]) => <option key={id} value={id}>{item.title}</option>)}</optgroup></select></label><p>每个步骤保存完整快照。拖动时间轴可恢复栈变量、堆对象、指针与释放状态。</p></div>
    <div className="memory-grid">
      <section className="memory-card memory-diagram"><h3>链式结构</h3><div className="memory-chain" aria-label="当前可达链表">{state.chain.length ? state.chain.map((id, position) => { const item = state.objects.find(object => object.id === id)!; return <span key={id}><b className={active.has(id) ? 'active' : ''}>{item.value}<small>{item.address}</small></b>{position < state.chain.length - 1 ? <i aria-hidden="true">→</i> : <i aria-hidden="true">→ NULL</i>}</span> }) : <p>当前没有从 head 可达的链表节点。</p>}</div><small>可达链表根据当前 head 与 next 关系即时计算。</small></section>
      <section className="memory-card"><h3>栈区 · 当前函数</h3>{state.frames.map(frame => <div className="memory-frame" key={frame.name}><strong>{frame.name}</strong><div className="memory-locals">{frame.locals.length ? frame.locals.map(local => <div key={local.name}><code>{local.type}</code><b>{local.name}</b><span>{local.value}{local.address && <small> · {local.address}</small>}</span></div>) : <p>尚无局部变量</p>}</div></div>)}</section>
      <section className="memory-card"><h3>堆区 · 动态对象</h3><div className="memory-objects">{state.objects.filter(object => object.region === 'heap').length ? state.objects.filter(object => object.region === 'heap').map(object => <article key={object.id} className={`${object.status} ${active.has(object.id) ? 'active' : ''}`}><span>{object.address} <small>教学模拟地址</small></span><strong>{object.type} · {object.status === 'freed' ? '已释放' : '已分配'}</strong><div>value: {object.status === 'freed' ? '不可访问' : object.value}</div>{object.next !== undefined && <div>next: {object.status === 'freed' ? '不可访问' : object.next === null ? 'NULL' : state.objects.find(item => item.id === object.next)?.address}</div>}{object.prev !== undefined && <div>prev: {object.status === 'freed' ? '不可访问' : object.prev === null ? 'NULL' : state.objects.find(item => item.id === object.prev)?.address}</div>}</article>) : <p>堆区暂无对象</p>}</div></section>
      <section className="memory-card"><h3>引用关系</h3><div className="memory-references">{state.references.length ? state.references.map(reference => <div key={reference.name} className={reference.status}><code>{reference.name}</code><span aria-hidden="true">→</span><b>{reference.target === null ? 'NULL / nullptr' : state.objects.find(object => object.id === reference.target)?.address}</b><small>{reference.status === 'dangling' ? '悬空引用' : reference.status === 'null' ? '空引用' : '有效引用'}</small></div>) : <p>当前没有指针引用</p>}</div></section>
    </div>
    {state.warnings.length > 0 && <div className="memory-warning" role="alert">{state.warnings.map((warning, i) => <p key={i}>{warning}</p>)}</div>}
    <div className="memory-player" aria-label="内存模拟播放控制"><input type="range" min="0" max={end} value={index} aria-label="内存模拟步骤" onChange={event => timeline.seek(Number(event.target.value))}/><span>{index} / {end} 步</span><div><Button variant="outline" aria-label="重置内存模拟" disabled={index === 0} onClick={() => timeline.reset()}><RotateCcw size={16}/></Button><Button variant="outline" aria-label="内存模拟上一步" disabled={index === 0} onClick={() => timeline.previous()}><ChevronLeft size={16}/></Button><Button onClick={() => playing ? timeline.pause() : timeline.play()}>{playing ? <><Pause size={16}/>暂停</> : <><Play size={16}/>播放</>}</Button><Button variant="outline" aria-label="内存模拟下一步" disabled={index === end} onClick={() => timeline.next()}><ChevronRight size={16}/></Button></div><label>速度<select aria-label="内存模拟速度" value={speed} onChange={event => timeline.setSpeed(Number(event.target.value))}>{[0.5, 1, 1.5, 2].map(value => <option key={value} value={value}>{value}×</option>)}</select></label></div>
    <div className="memory-explanation" aria-live="polite"><strong>{step.phase} · 第 {index} 步</strong><p>{step.description}</p><div>{step.operations.map((operation, i) => <span key={i}>{operation.type}</span>)}</div></div>
    <section className="memory-card memory-code"><div><h3>C/C++ 代码对照</h3><div role="tablist" aria-label="内存案例代码语言">{(['C', 'C++'] as const).map(item => <button key={item} role="tab" aria-selected={language === item} onClick={() => setLanguage(item)}>{item}</button>)}</div></div><div role="tabpanel" aria-label={`${language} 内存案例代码`}>{code.map((line, i) => <div key={i} className={step.highlightedLines[language].includes(i + 1) ? 'active' : ''}><span>{String(i + 1).padStart(2, '0')}</span><code>{line}</code></div>)}</div><small>代码为受控教学片段；make_list、make_node 等辅助函数省略。错误行仅标注，不会执行未定义行为。</small></section>
  </div>
}
