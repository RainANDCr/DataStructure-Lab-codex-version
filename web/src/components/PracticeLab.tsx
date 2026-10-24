import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from './ui/button'
import { chapters, lessonById } from '../data/catalog'
import { knowledgeById, knowledgePoints } from '../data/knowledge'
import { appendAttempts, loadAttempts } from '../data/questionAttempts'
import { drawQuestions, gradeAnswer, questions, type Attempt, type Question, type QuestionType } from '../data/questionBank'
import { scheduleReview, updateStudy, type Study } from '../data/studyProgress'
import { withLearningContext } from '../data/learningLinks'
import { clearExamDraft, loadExamDraft, saveExamDraft } from '../data/examDraft'
import './PracticeLab.css'

type Filter = { chapter: string; point: string; algorithm: string; difficulty: string; type: string; mode: 'course' | '408' }
const typeNames: Record<QuestionType, string> = { single: '单选', multiple: '多选', boolean: '判断', numeric: '数值填空', complexity: '复杂度', simulation: '可视化推演' }
const answerText = (answer: readonly string[]) => answer.join(' → ') || '未作答'

function QuestionInput({ item, answer, onChange, disabled }: { item: Question; answer: string[]; onChange: (answer: string[]) => void; disabled?: boolean }) {
  const simulation = item.simulation
  if (simulation) {
    const values = simulation.kind === 'queue-ends' ? [...simulation.initialData, Number(simulation.options?.value)] : simulation.initialData
    const max = simulation.kind === 'swap' || simulation.kind === 'queue-ends' ? 2 : simulation.kind === 'tree-order' ? values.length : 1
    const choose = (value: string) => {
      if (disabled) return
      if (max === 1) onChange([value])
      else if (answer.length < max && !answer.includes(value)) onChange([...answer, value])
    }
    const graphic = simulation.kind === 'tree-order' ? <svg viewBox="0 0 320 180" aria-hidden="true"><path d="M160 32 L80 88 M160 32 L240 88 M80 88 L40 146 M80 88 L120 146"/></svg> : simulation.kind === 'graph-next' ? <svg viewBox="0 0 320 180" aria-hidden="true"><path d="M50 48 L160 30 M50 48 L160 132 M160 30 L270 30"/></svg> : null
    return <div className="practice-simulation"><p>{simulation.kind === 'swap' ? '点选两个交换位置' : simulation.kind === 'queue-ends' ? '先点队头，再点队尾' : simulation.kind === 'tree-order' ? '按访问顺序逐个点击' : '点击你的预测'}</p><div className={`practice-board ${simulation.kind === 'tree-order' ? 'tree-board' : simulation.kind === 'graph-next' ? 'graph-board' : ''}`} role="group" aria-label="推演数据">{graphic}{values.map((value, index) => <button key={index} type="button" onClick={() => choose(String(simulation.kind === 'swap' ? index : value))} disabled={disabled} aria-pressed={answer.includes(String(simulation.kind === 'swap' ? index : value))}><small>{simulation.kind === 'swap' || simulation.kind === 'binary-mid' ? `下标 ${index}` : simulation.kind === 'queue-ends' && index === 0 ? '原队头' : simulation.kind === 'queue-ends' && index === values.length - 1 ? '新队尾' : '节点'}</small><strong>{value}</strong>{answer.includes(String(simulation.kind === 'swap' ? index : value)) && <em>{answer.indexOf(String(simulation.kind === 'swap' ? index : value)) + 1}</em>}</button>)}</div><div className="practice-selection">已选：{answerText(answer)} <button type="button" onClick={() => onChange([])} disabled={disabled || !answer.length}>重选</button></div></div>
  }
  if (item.type === 'numeric') return <label className="practice-number">你的答案<input inputMode="decimal" value={answer[0] ?? ''} onChange={event => onChange([event.target.value])} disabled={disabled} placeholder="填写数字"/></label>
  return <div className="practice-options" role="group" aria-label="答案选项">{item.options?.map(option => <button key={option} type="button" className={answer.includes(option) ? 'selected' : ''} aria-pressed={answer.includes(option)} disabled={disabled} onClick={() => onChange(item.type === 'multiple' ? answer.includes(option) ? answer.filter(value => value !== option) : [...answer, option] : [option])}>{option}</button>)}</div>
}

export function PracticeLab() {
  const [params] = useSearchParams()
  const [draft] = useState(loadExamDraft)
  const [filter, setFilter] = useState<Filter>({ chapter: params.get('chapter') ?? 'all', point: params.get('point') ?? 'all', algorithm: params.get('algorithm') ?? 'all', difficulty: 'all', type: 'all', mode: draft?.mode ?? (params.get('mode') === '408' ? '408' : 'course') })
  const [selectedId, setSelectedId] = useState<string | null>(draft?.selectedId ?? params.get('question'))
  const [answer, setAnswer] = useState<string[]>([])
  const [feedback, setFeedback] = useState<{ correct: boolean; explanation: string } | null>(null)
  const [mode, setMode] = useState<'learn' | 'exam'>(draft ? 'exam' : 'learn')
  const [count, setCount] = useState(5), [minutes, setMinutes] = useState(10), [points, setPoints] = useState(10)
  const [examPoints, setExamPoints] = useState(draft?.points ?? 10)
  const [examItems, setExamItems] = useState<Question[] | null>(draft ? draft.ids.map(id => questions.find(item => item.id === id)!) : null)
  const [examAnswers, setExamAnswers] = useState<Record<string, string[]>>(draft?.answers ?? {})
  const [report, setReport] = useState<{ item: Question; answer: string[]; correct: boolean }[] | null>(null)
  const [deadline, setDeadline] = useState<number | null>(draft?.deadline ?? null), [remaining, setRemaining] = useState(draft ? Math.max(0, Math.ceil((draft.deadline - Date.now()) / 1000)) : 0)
  const finished = useRef(false)
  const [recordCount, setRecordCount] = useState(() => loadAttempts()?.length ?? 0)
  const [storageError, setStorageError] = useState(() => loadAttempts() === null)
  const pool = useMemo(() => questions.filter(item => (filter.chapter === 'all' || String(knowledgeById.get(item.knowledgePointIds[0])?.chapterId) === filter.chapter) && (filter.point === 'all' || item.knowledgePointIds.includes(filter.point)) && (filter.algorithm === 'all' || item.algorithmId === filter.algorithm) && (filter.difficulty === 'all' || item.difficulty === filter.difficulty) && (filter.type === 'all' || item.type === filter.type) && (filter.mode === 'course' || item.tags.includes('408-站内练习'))), [filter])
  const activeItems = mode === 'exam' && examItems ? examItems : pool
  const current = activeItems.find(item => item.id === selectedId) ?? activeItems[0]
  const currentAnswer = mode === 'exam' ? examAnswers[current?.id] ?? [] : answer
  const canSubmit = !!current && currentAnswer.some(value => value.trim()) && (current.type !== 'simulation' || currentAnswer.length === current.answer.length)
  const setCurrentAnswer = (next: string[]) => mode === 'exam' && current ? setExamAnswers(value => ({ ...value, [current.id]: next })) : setAnswer(next)
  const changeFilter = (patch: Partial<Filter>) => { if (!clearExamDraft()) setStorageError(true); setFilter(value => ({ ...value, ...patch, ...(patch.chapter ? { point: 'all' } : {}) })); setSelectedId(null); setAnswer([]); setFeedback(null); setExamItems(null); setReport(null); setDeadline(null) }
  const record = useCallback((items: { item: Question; answer: string[]; correct: boolean }[], recordMode: 'learn' | 'exam') => {
    const timestamp = new Date().toISOString()
    const next: Attempt[] = items.map(({ item, answer: submitted, correct }) => ({ questionId: item.id, answer: [...submitted], correct, mode: recordMode, timestamp, version: 1 }))
    if (appendAttempts(next)) {
      setRecordCount(value => value + next.length)
      const missed = items.filter(row => !row.correct).flatMap(row => row.item.knowledgePointIds)
      if (!updateStudy(study => missed.reduce<Study>((value, pointId) => ({ ...scheduleReview(value, pointId), mastery: { ...value.mastery, [pointId]: '需要复习' } }), { ...study, recent: timestamp, mode: filter.mode }))) setStorageError(true)
    }
    else setStorageError(true)
  }, [filter.mode])
  const submitLearning = () => {
    if (!current || feedback || !canSubmit) return
    const result = gradeAnswer(current, currentAnswer)
    setFeedback(result)
    record([{ item: current, answer: currentAnswer, correct: result.correct }], 'learn')
  }
  const finishExam = useCallback(() => {
    if (!examItems || finished.current) return
    finished.current = true
    const result = examItems.map(item => ({ item, answer: examAnswers[item.id] ?? [], correct: gradeAnswer(item, examAnswers[item.id] ?? []).correct }))
    setReport(result)
    setDeadline(null)
    if (!clearExamDraft()) setStorageError(true)
    record(result, 'exam')
  }, [examItems, examAnswers, record])
  useEffect(() => {
    if (mode === 'exam' && examItems && deadline !== null && !report && !saveExamDraft({ version: 1, ids: examItems.map(item => item.id), answers: examAnswers, deadline, points: examPoints, selectedId, mode: filter.mode })) setStorageError(true)
  }, [mode, examItems, examAnswers, deadline, examPoints, selectedId, filter.mode, report])
  useEffect(() => {
    if (deadline === null || report) return
    const timer = window.setInterval(() => { const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000)); setRemaining(left); if (left === 0) finishExam() }, 250)
    return () => window.clearInterval(timer)
  }, [deadline, report, finishExam])
  const startExam = () => {
    if (!pool.length) return
    const items = drawQuestions(pool, Math.max(1, Math.min(pool.length, Math.trunc(count) || 1)))
    finished.current = false
    setExamPoints(Math.max(1, Math.min(20, Math.trunc(points) || 1)))
    setExamItems(items); setExamAnswers({}); setReport(null); setSelectedId(items[0].id)
    const end = Date.now() + Math.max(1, Math.min(120, Math.trunc(minutes) || 1)) * 60000
    setDeadline(end); setRemaining(Math.ceil((end - Date.now()) / 1000))
  }
  const reported = report?.find(row => row.item.id === current?.id)
  const showFeedback = mode === 'learn' ? feedback : reported ? { correct: reported.correct, explanation: reported.item.explanation } : null

  return <div className="practice-lab">
    <section className="practice-card practice-header"><div><h2>算法推演题库</h2><p>先判断，再打开动画核对每一步。题目均为站内原创示例。</p></div><span>{questions.length} 道题 · {questions.filter(item => item.type === 'simulation').length} 道可视化推演</span></section>
    <div className="practice-mode" role="tablist" aria-label="练习方式"><button role="tab" aria-selected={mode === 'learn'} onClick={() => { if (!clearExamDraft()) setStorageError(true); setMode('learn'); setExamItems(null); setReport(null); setDeadline(null); setSelectedId(null) }}>学习练习</button><button role="tab" aria-selected={mode === 'exam'} onClick={() => { setMode('exam'); setAnswer([]); setFeedback(null); setSelectedId(null) }}>模拟测验</button></div>
    <section className="practice-card"><div className="practice-filters">
      <label>学习视角<select value={filter.mode} onChange={event => changeFilter({ mode: event.target.value as Filter['mode'] })}><option value="course">大学课程</option><option value="408">考研 408</option></select></label>
      <label>章节<select value={filter.chapter} onChange={event => changeFilter({ chapter: event.target.value })}><option value="all">全部章节</option>{chapters.map((chapter, index) => <option key={chapter} value={index + 1}>第 {index + 1} 章 {chapter}</option>)}</select></label>
      <label>知识点<select value={filter.point} onChange={event => changeFilter({ point: event.target.value })}><option value="all">全部知识点</option>{knowledgePoints.filter(item => filter.chapter === 'all' || String(item.chapterId) === filter.chapter).map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <label>算法<select value={filter.algorithm} onChange={event => changeFilter({ algorithm: event.target.value })}><option value="all">全部算法</option>{[...new Set(questions.map(item => item.algorithmId))].map(id => <option key={id} value={id}>{lessonById.get(id)?.title}</option>)}</select></label>
      <label>难度<select value={filter.difficulty} onChange={event => changeFilter({ difficulty: event.target.value })}><option value="all">全部难度</option><option>基础</option><option>进阶</option></select></label>
      <label>题型<select value={filter.type} onChange={event => changeFilter({ type: event.target.value })}><option value="all">全部题型</option>{Object.entries(typeNames).map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label>
    </div><p className="practice-filter-note">找到 {pool.length} 道题。408 仅为站内复习标签，未经最新官方考纲核验；本测验不是官方真题模拟。</p></section>
    {mode === 'exam' && <section className="practice-card practice-exam-config"><div><label>题量<input type="number" min="1" max={pool.length || 1} value={count} onChange={event => setCount(Number(event.target.value))}/></label><label>限时（分钟）<input type="number" min="1" max="120" value={minutes} onChange={event => setMinutes(Number(event.target.value))}/></label><label>每题分值<input type="number" min="1" max="20" value={points} onChange={event => setPoints(Number(event.target.value))}/></label></div><Button onClick={startExam} disabled={!pool.length}>{examItems ? '重新抽题开始' : '抽题开始'}</Button>{examItems && !report && <strong>剩余 {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</strong>}</section>}
    {mode === 'exam' && report && <section className="practice-card practice-report" role="status"><h3>测验报告：{report.filter(row => row.correct).length * examPoints} / {report.length * examPoints} 分</h3><p>答对 {report.filter(row => row.correct).length} / {report.length} 题。下方可逐题查看解析并重练。</p>{report.filter(row => !row.correct).map(row => <button key={row.item.id} onClick={() => setSelectedId(row.item.id)}>{row.item.title} · {row.answer.length ? '答错' : '未作答'}</button>)}</section>}
    {mode === 'exam' && !examItems ? <section className="practice-card practice-empty">设置题量和时间，点击“抽题开始”。提交前不会显示答案。</section> : pool.length === 0 && mode === 'learn' ? <section className="practice-card practice-empty">当前筛选没有题目，请放宽章节、知识点或题型。</section> : current && <div className="practice-workspace"><aside className="practice-card practice-list"><h3>{mode === 'exam' ? '本次试卷' : '题目列表'}</h3>{activeItems.map((item, index) => <button key={item.id} className={current.id === item.id ? 'active' : ''} onClick={() => { setSelectedId(item.id); if (mode === 'learn') { setAnswer([]); setFeedback(null) } }}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.title}</strong><small>{typeNames[item.type]}</small>{mode === 'exam' && examAnswers[item.id]?.length ? <em>已答</em> : null}</button>)}</aside><section className="practice-card practice-question"><div className="practice-question-meta"><span>{typeNames[current.type]}</span><span>{current.difficulty}</span><span>{knowledgeById.get(current.knowledgePointIds[0])?.title}</span></div><h3>{current.title}</h3><p className="practice-stem">{current.stem}</p><QuestionInput item={current} answer={currentAnswer} onChange={setCurrentAnswer} disabled={!!showFeedback}/><div className="practice-actions">{mode === 'learn' ? <><Button onClick={submitLearning} disabled={!canSubmit || !!feedback}>提交答案</Button>{feedback && <Button variant="outline" onClick={() => { setAnswer([]); setFeedback(null) }}>再次练习</Button>}{feedback && <Button variant="ghost" onClick={() => { const next = pool[(pool.findIndex(item => item.id === current.id) + 1) % pool.length]; setSelectedId(next.id); setAnswer([]); setFeedback(null) }}>下一题</Button>}</> : !report ? <Button onClick={finishExam}>提交整份试卷</Button> : <Button variant="outline" onClick={() => { setMode('learn'); setExamItems(null); setReport(null); setDeadline(null); setSelectedId(current.id); setAnswer([]); setFeedback(null) }}>重练此题</Button>}<Link to={withLearningContext(`/lab/${current.algorithmId}`, current.knowledgePointIds[0], filter.mode)}>查看{lessonById.get(current.algorithmId)?.title}动画 →</Link><Link to={withLearningContext('/lab/knowledge', current.knowledgePointIds[0], filter.mode)}>回看知识点 →</Link></div>{showFeedback && <div className={`practice-feedback ${showFeedback.correct ? 'correct' : 'incorrect'}`} role="status"><strong>{showFeedback.correct ? '回答正确' : '还需再练'}</strong><p>你的答案：{answerText(currentAnswer)}</p><p>标准答案：{answerText(current.answer)}</p><p>{showFeedback.explanation}{!showFeedback.correct && current.simulation ? ` 提示：${current.simulation.errorHint}` : ''}</p></div>}</section></div>}
    <p className="practice-storage">本机已记录 {recordCount} 次作答。{storageError && <strong>本地记录不可写或格式不兼容，本次作答只保留在页面中；原数据未覆盖。</strong>}</p>
  </div>
}
