import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react'
import { Button } from './ui/button'
import { VariableMonitor } from './VariableMonitor'
import { useTimeline } from './useTimeline'
import { errorCases, errorCaseSteps, nextOperation, runBubbleBoundaries, traceExample, traceExamples, type DebugStep, type ErrorCaseId, type TraceExample } from '../engine/debugLab'
import './DebugLab.css'

const labels = { COMPARE: '比较', SWAP: '交换', VISIT: '访问', OTHER: '其他步骤' } as const

function Prediction({ next }: { next: DebugStep }) {
  const [choice, setChoice] = useState<keyof typeof labels | ''>('')
  const [submitted, setSubmitted] = useState(false)
  const answer = nextOperation(next)
  return <section className="debug-card debug-prediction"><h3>预测下一步</h3><p>先观察当前数组和代码，再判断下一步执行的操作类型。</p><div>{(Object.keys(labels) as (keyof typeof labels)[]).map(value => <label key={value}><input type="radio" name={`prediction-${next.stepId}`} checked={choice === value} onChange={() => setChoice(value)}/>{labels[value]}</label>)}</div><Button disabled={!choice || submitted} onClick={() => setSubmitted(true)}>提交预测</Button>{submitted && <p role="status" className={choice === answer ? 'correct' : 'incorrect'}>{choice === answer ? '判断正确。' : `本步是“${labels[answer]}”。`}{next.description}</p>}</section>
}

export function DebugLab() {
  const [mode, setMode] = useState<'trace' | 'errors' | 'boundary'>('trace')
  const [example, setExample] = useState<TraceExample>('bubble')
  const [caseId, setCaseId] = useState<ErrorCaseId>('binaryBoundary')
  const [draft, setDraft] = useState(traceExamples.bubble.input)
  const [error, setError] = useState('')
  const [language, setLanguage] = useState<'C' | 'C++'>('C++')
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set())
  const [answer, setAnswer] = useState<boolean | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [boundaryResults, setBoundaryResults] = useState<ReturnType<typeof runBubbleBoundaries> | null>(null)
  const [initial] = useState(() => traceExample('bubble', traceExamples.bubble.input))
  const [lastTrace, setLastTrace] = useState(initial)
  const { timeline, steps, index, playing, speed } = useTimeline(initial.steps)
  const [codeLines, setCodeLines] = useState(initial.code)
  const item = errorCases[caseId], step = steps[index], end = steps.length - 1

  useEffect(() => { timeline.setBreakpoint((current, stepIndex) => stepIndex > 0 && current.highlightedLines[language]?.some(line => breakpoints.has(line)) === true); return () => timeline.setBreakpoint() }, [timeline, language, breakpoints])
  const showTrace = (next: TraceExample) => { const input = traceExamples[next].input, result = traceExample(next, input); timeline.replace(result.steps); setLastTrace(result); setCodeLines(result.code); setExample(next); setDraft(input); setBreakpoints(new Set()); setError('') }
  const showError = (next: ErrorCaseId) => { timeline.replace(errorCaseSteps(next)); setCaseId(next); setCodeLines(errorCases[next].sourceCode); setBreakpoints(new Set()); setAnswer(null); setSubmitted(false) }
  const changeMode = (next: typeof mode) => { timeline.pause(); setMode(next); if (next === 'errors') showError(caseId); else if (next === 'trace') { timeline.replace(lastTrace.steps); setCodeLines(lastTrace.code); setBreakpoints(new Set()) } }
  const apply = () => { try { const result = traceExample(example, draft); timeline.replace(result.steps); setLastTrace(result); setCodeLines(result.code); setBreakpoints(new Set()); setError('') } catch (cause) { setError(cause instanceof Error ? cause.message : '输入无效。') } }
  const toggleBreakpoint = (line: number) => setBreakpoints(current => { const next = new Set(current); if (next.has(line)) next.delete(line); else next.add(line); return next })
  return <div className="debug-lab">
    <div className="debug-card debug-intro"><h2>代码调试与错误实验室</h2><p>观察内置代码的执行步骤，先做预测，再定位错误并验证边界输入。</p><small>教学时间轴与模拟断点；不编译或执行任意 C/C++ 代码。</small></div>
    <div className="debug-tabs" role="tablist" aria-label="调试实验室功能">{([['trace', '代码跟踪'], ['errors', '错误实验室'], ['boundary', '边界测试']] as const).map(([id, title]) => <button key={id} role="tab" aria-selected={mode === id} onClick={() => changeMode(id)}>{title}</button>)}</div>
    {mode === 'boundary' ? <section className="debug-card"><div className="debug-section-head"><div><h3>冒泡排序边界测试</h3><p>调用现有输入校验与排序步骤生成器，逐项核对预期输出或拒绝非法输入。</p></div><Button onClick={() => setBoundaryResults(runBubbleBoundaries())}>运行全部测试</Button></div>{boundaryResults ? <div className="debug-boundaries">{boundaryResults.map(result => <article key={result.title} className={result.passed ? 'passed' : 'failed'}><strong>{result.passed ? '通过' : '失败'} · {result.title}</strong><span>输入：{result.input || '空'}</span><small>{result.valid ? `输出：${result.detail}` : `校验结果：${result.detail}`}</small></article>)}</div> : <p>包含空输入、单元素、重复值、全相等、正序、逆序、合法极值及非法输入。</p>}</section> : <>
      {mode === 'trace' ? <div className="debug-card debug-controls"><label>内置算法<select aria-label="跟踪算法" value={example} onChange={event => showTrace(event.target.value as TraceExample)}>{Object.entries(traceExamples).map(([id, value]) => <option key={id} value={id}>{value.title}</option>)}</select></label><label>输入数据<input aria-label="跟踪输入数据" value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') apply() }} aria-invalid={!!error}/></label><Button onClick={apply}>应用数据</Button><small>{traceExamples[example].hint}</small>{error && <p role="alert">{error}</p>}</div> : <div className="debug-card debug-controls"><label>错误案例<select aria-label="错误案例" value={caseId} onChange={event => showError(event.target.value as ErrorCaseId)}>{Object.entries(errorCases).map(([id, value]) => <option key={id} value={id}>{value.title}</option>)}</select></label><p className="debug-case-input">输入：{item.input} · 难度：{item.difficulty}</p></div>}
      <div className="debug-card debug-player" aria-label="教学调试播放控制"><input type="range" min="0" max={end} value={index} aria-label="调试步骤" onChange={event => timeline.seek(Number(event.target.value))}/><span>{index} / {end} 步</span><div><Button variant="outline" aria-label="重置调试" disabled={index === 0} onClick={() => timeline.reset()}><RotateCcw size={16}/></Button><Button variant="outline" aria-label="调试上一步" disabled={index === 0} onClick={() => timeline.previous()}><ChevronLeft size={16}/></Button><Button onClick={() => playing ? timeline.pause() : timeline.play()}>{playing ? <><Pause size={16}/>暂停</> : <><Play size={16}/>播放</>}</Button><Button variant="outline" aria-label="调试下一步" disabled={index === end} onClick={() => timeline.next()}><ChevronRight size={16}/></Button></div><label>速度<select aria-label="调试播放速度" value={speed} onChange={event => timeline.setSpeed(Number(event.target.value))}>{[0.5, 1, 1.5, 2].map(value => <option key={value} value={value}>{value}×</option>)}</select></label></div>
      <div className="debug-card debug-step" aria-live="polite"><strong>{step.phase} · 第 {index} 步</strong><p>{step.description}</p>{step.state.warning && <div role="alert">{step.state.warning}</div>}</div>
      <div className="debug-grid"><section className="debug-card"><h3>数据结构状态</h3><div className="debug-values">{step.state.values.length ? step.state.values.map((value, i) => <span key={i} className={step.highlightedElements.includes(String(i)) || step.state.active.includes(i) ? 'active' : ''}>{value}<small>{i}</small></span>) : <p>当前为空。</p>}</div>{step.state.output.length > 0 && <p>输出：{step.state.output.join(' → ')}</p>}{step.state.memory && <div className="debug-memory"><strong>模拟内存</strong>{step.state.memory.objects.filter(object => object.region === 'heap').map(object => <span key={object.id} className={step.highlightedElements.includes(object.id) ? 'active' : ''}>{object.address} · {object.value} · {object.status === 'freed' ? '已释放' : '已分配'}</span>)}</div>}</section>
        <section className="debug-card debug-code"><div className="debug-section-head"><h3>{mode === 'errors' ? '错误代码' : 'C/C++ 代码跟踪'}</h3><div role="tablist" aria-label="调试代码语言">{(['C', 'C++'] as const).map(value => <button key={value} role="tab" aria-selected={language === value} onClick={() => { setLanguage(value); setBreakpoints(new Set()) }}>{value}</button>)}</div></div><small>点击行号设置或取消教学断点。</small><div role="tabpanel" aria-label={`${language} 调试代码`}>{codeLines[language].map((line, i) => <button key={i} className={`${step.highlightedLines[language]?.includes(i + 1) ? 'active' : ''} ${breakpoints.has(i + 1) ? 'breakpoint' : ''}`} aria-label={`第 ${i + 1} 行${breakpoints.has(i + 1) ? '，已设断点' : '，设置断点'}`} aria-pressed={breakpoints.has(i + 1)} onClick={() => toggleBreakpoint(i + 1)}><span>{String(i + 1).padStart(2, '0')}</span><code>{line}</code></button>)}</div></section>
      </div>
      <VariableMonitor step={step} previous={steps[index - 1]}/>
      {mode === 'trace' && steps[index + 1] && <Prediction key={`${example}-${step.stepId}`} next={steps[index + 1]}/>}
      {mode === 'errors' && <div className="debug-card debug-error-detail"><h3>找出错误</h3><p><b>预期：</b>{item.expectedBehavior}</p><p><b>实际：</b>{item.faultyBehavior}</p><p>判断：{item.question}</p><div><label><input type="radio" name={`judge-${caseId}`} checked={answer === true} onChange={() => setAnswer(true)}/>正确</label><label><input type="radio" name={`judge-${caseId}`} checked={answer === false} onChange={() => setAnswer(false)}/>错误</label></div><Button disabled={answer === null || submitted} onClick={() => setSubmitted(true)}>提交判断</Button>{submitted && <div role="status" className={answer === item.answer ? 'correct' : 'incorrect'}><strong>{answer === item.answer ? '判断正确' : '判断有误'}</strong><p>{item.explanation}</p><p>错误位置：{item.checkpoints.map(point => `第 ${point.line} 行（${point.reason}）`).join('、')}</p><h4>修复代码</h4><pre>{(language === 'C++' ? item.fixedCodeCpp ?? item.fixedCode : item.fixedCode).join('\n')}</pre></div>}</div>}
    </>}
  </div>
}
