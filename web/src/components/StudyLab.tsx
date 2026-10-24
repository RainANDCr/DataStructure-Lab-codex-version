import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from './ui/button'
import { chapters } from '../data/catalog'
import { knowledgeById, knowledgePoints } from '../data/knowledge'
import { deleteWrongAttempts, loadAttempts } from '../data/questionAttempts'
import { questions } from '../data/questionBank'
import { withLearningContext } from '../data/learningLinks'
import { addDays, dayToday, dueReviews, exportStudy, importStudy, loadStudy, recordReview, saveStudy, scheduleReview, studyStatus, wrongBook, type Mastery, type Study } from '../data/studyProgress'
import './StudyLab.css'

const answers = (value: string[]) => value.join(' → ') || '未作答'
const questionById = new Map(questions.map(item => [item.id, item]))
const formatTime = (value: string | null) => value ? new Date(value).toLocaleString('zh-CN') : '暂无'

export function StudyLab() {
  const [study, setStudy] = useState(loadStudy)
  const [attempts, setAttempts] = useState(loadAttempts)
  const [message, setMessage] = useState('')
  const [tab, setTab] = useState<'overview' | 'wrong' | 'reviews'>('overview')
  const [chapter, setChapter] = useState('all')
  const [point, setPoint] = useState('all')
  const [sort, setSort] = useState<'new' | 'count'>('new')
  const [reviewing, setReviewing] = useState<string | null>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const refresh = () => { setStudy(loadStudy()); setAttempts(loadAttempts()) }
  useEffect(() => { const timer = window.setInterval(refresh, 15000); return () => window.clearInterval(timer) }, [])
  const change = (next: (current: Study) => Study) => {
    if (!study) return
    if (!saveStudy(next(study))) { setMessage('保存失败。原有记录未被覆盖，请检查浏览器存储。'); return }
    refresh(); setMessage('已自动保存到当前浏览器。')
  }
  const items = useMemo(() => wrongBook(attempts ?? [], study ?? undefined).filter(row => {
    const item = questionById.get(row.questionId)
    const id = item?.knowledgePointIds[0]
    return (chapter === 'all' || String(knowledgeById.get(id ?? '')?.chapterId) === chapter) && (point === 'all' || id === point)
  }).sort((a, b) => sort === 'new' ? b.last.timestamp.localeCompare(a.last.timestamp) : b.wrongCount - a.wrongCount), [attempts, study, chapter, point, sort])
  if (!study || !attempts) return <section className="study-panel" role="alert"><h2>学习记录暂时无法读取</h2><p>本地数据可能使用了更新版本或格式异常。页面不会覆盖原始记录；请先备份浏览器数据。</p></section>
  const due = dueReviews(study)
  const weekStart = addDays(dayToday(), -6)
  const thisWeek = attempts.filter(row => row.timestamp.slice(0, 10) >= weekStart).length
  const masteredPoints = knowledgePoints.filter(row => studyStatus(row.id, study, attempts) === '已掌握').length
  const download = () => {
    const content = exportStudy()
    if (!content) { setMessage('当前数据无法导出，请先检查存储格式。'); return }
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = `datastruct-study-${dayToday()}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const importFile = async (file?: File) => {
    if (!file) return
    if (file.size > 2_000_000) { setMessage('文件超过 2 MB，未导入。'); return }
    try { const okay = importStudy(await file.text()); setMessage(okay ? '已合并导入，重复作答已去重。' : '导入失败：文件格式或现有记录不兼容，未覆盖原始数据。'); refresh() }
    catch { setMessage('文件读取失败，未修改记录。') }
    if (importRef.current) importRef.current.value = ''
  }
  const remove = (questionId: string) => {
    if (!window.confirm('删除这道题的个人错误作答记录？此操作无法撤销，建议先导出备份。')) return
    if (!deleteWrongAttempts(questionId)) { setMessage('删除失败，原始记录未改变。'); return }
    change(value => { const reasons = { ...value.reasons }; delete reasons[questionId]; return { ...value, reasons } }); refresh()
  }
  return <div className="study-lab">
    <section className="study-panel study-header"><div><h2>我的学习记录</h2><p>浏览和观看只代表接触过内容；掌握状态依据作答或你的主动评价。所有数据保存在本机。</p></div><div className="study-actions"><Button variant="outline" onClick={download}>导出备份</Button><Button variant="outline" onClick={() => importRef.current?.click()}>合并导入</Button><input ref={importRef} type="file" accept="application/json,.json" hidden onChange={event => void importFile(event.target.files?.[0])}/></div></section>
    {message && <p className="study-message" role="status">{message}</p>}
    <div className="study-tabs" role="tablist" aria-label="学习记录分类"><button role="tab" aria-selected={tab === 'overview'} onClick={() => setTab('overview')}>学习总览</button><button role="tab" aria-selected={tab === 'wrong'} onClick={() => setTab('wrong')}>错题本 {wrongBook(attempts, study).length}</button><button role="tab" aria-selected={tab === 'reviews'} onClick={() => setTab('reviews')}>复习计划 {due.length}</button></div>
    {tab === 'overview' && <>
      <div className="study-stats"><div><small>本周作答</small><strong>{thisWeek}</strong></div><div><small>待复习知识点</small><strong>{due.length}</strong></div><div><small>错题数</small><strong>{wrongBook(attempts, study).length}</strong></div><div><small>活动时间</small><strong>{Math.floor(study.seconds / 60)} 分钟</strong></div><div><small>已掌握知识点</small><strong>{masteredPoints}</strong></div></div>
      <section className="study-panel"><h3>九章学习情况</h3><div className="study-chapters">{chapters.map((name, index) => { const points = knowledgePoints.filter(row => row.chapterId === index + 1), done = points.filter(row => studyStatus(row.id, study, attempts) !== '未学习').length, answered = attempts.filter(row => points.some(point => questionById.get(row.questionId)?.knowledgePointIds.includes(point.id))); return <div key={name}><b>第 {index + 1} 章 {name}</b><span>接触 {done}/{points.length} 点 · 题目正确率 {answered.length ? `${Math.round(answered.filter(row => row.correct).length / answered.length * 100)}%` : '暂无'}</span><Link to={`/lab/knowledge?chapter=${index + 1}&mode=${study.mode}`}>继续学习</Link></div> })}</div><p className="study-note">正确率仅统计本站有记录的作答，不代表精确能力测量。最近记录：{formatTime(study.recent)}；最近知识学习模式：{study.mode === '408' ? '408' : '大学课程'}。活动时间只累计页面可见、窗口聚焦且最近 60 秒有交互的 15 秒区间；不足 15 秒不计。</p></section>
      <section className="study-panel"><h3>知识点状态</h3><div className="study-point-list">{knowledgePoints.map(row => <div key={row.id}><span>{row.title}<small>第 {row.chapterId} 章 · 浏览 {study.viewed[row.id]?.count ?? 0} 次</small></span><b>{studyStatus(row.id, study, attempts)}</b><Link to={withLearningContext('/lab/knowledge', row.id, study.mode)}>打开</Link><button onClick={() => change(value => scheduleReview(value, row.id))}>加入复习</button></div>)}</div></section>
    </>}
    {tab === 'wrong' && <section className="study-panel"><h3>错题本</h3><div className="study-filters"><label>章节<select value={chapter} onChange={event => { setChapter(event.target.value); setPoint('all') }}><option value="all">全部</option>{chapters.map((name, index) => <option key={name} value={index + 1}>第 {index + 1} 章 {name}</option>)}</select></label><label>知识点<select value={point} onChange={event => setPoint(event.target.value)}><option value="all">全部</option>{knowledgePoints.filter(row => chapter === 'all' || String(row.chapterId) === chapter).map(row => <option key={row.id} value={row.id}>{row.title}</option>)}</select></label><label>排序<select value={sort} onChange={event => setSort(event.target.value as 'new' | 'count')}><option value="new">最近作答</option><option value="count">错误次数</option></select></label></div>{items.length === 0 && <p>当前筛选下没有错题。</p>}{items.map(row => { const item = questionById.get(row.questionId), pointId = item?.knowledgePointIds[0]; return <article className="study-wrong" key={row.questionId}><div><h4>{item?.title ?? `已下架题目 ${row.questionId}`}</h4><small>{formatTime(row.last.timestamp)} · 作答 {row.count} 次 · 错误 {row.wrongCount} 次 · 最近答案 {answers(row.last.answer)}</small></div>{item ? <><p>{item.stem}</p><details><summary>查看解析</summary><p>标准答案：{answers(item.answer)}。{item.explanation}</p></details><label>错误原因<textarea value={study.reasons[row.questionId] ?? ''} maxLength={2000} placeholder="记录自己的误解" onChange={event => change(value => ({ ...value, reasons: { ...value.reasons, [row.questionId]: event.target.value } }))}/></label><div className="study-actions"><Link to={`/lab/practice?question=${item.id}&point=${pointId ?? ''}&mode=${study.mode}`}>重新作答</Link><Link to={withLearningContext(`/lab/${item.algorithmId}`, pointId, study.mode)}>查看动画</Link>{pointId && <button onClick={() => change(value => scheduleReview(value, pointId))}>加入复习</button>}{pointId && <button onClick={() => change(value => ({ ...value, mastery: { ...value.mastery, [pointId]: '已掌握' } }))}>标记已掌握</button>}<button onClick={() => remove(row.questionId)}>删除个人错题</button></div></> : <p>原题已不在当前题库中，仍保留作答记录。可导出备份或删除个人错题。</p>}{!item && <button onClick={() => remove(row.questionId)}>删除个人错题</button>}</article> })}</section>}
    {tab === 'reviews' && <section className="study-panel"><h3>间隔复习</h3><p className="study-note">默认间隔是 1、3、7、14、30 天，可自行修改；这是提醒节奏，不是适合所有人的科学定律。</p><div className="study-intervals">{study.intervals.map((days, index) => <label key={index}>第 {index + 1} 档<input type="number" min="1" max="365" value={days} onChange={event => { const n = Number(event.target.value); if (Number.isInteger(n) && n >= 1 && n <= 365) change(value => ({ ...value, intervals: value.intervals.map((old, i) => i === index ? n : old) })) }}/>天</label>)}</div>{Object.keys(study.reviews).length === 0 && <p>还没有复习任务。答错后会自动安排，或在知识点列表中手动加入。</p>}{Object.entries(study.reviews).sort((a, b) => a[1].due.localeCompare(b[1].due)).map(([id, review]) => <article className="study-review" key={id}><div><h4>{knowledgeById.get(id)?.title ?? `已下架知识点 ${id}`}</h4><span>下次：{review.due} · {review.due <= dayToday() ? '已到期' : '未到期'} · 当前间隔 {review.interval} 天 · {studyStatus(id, study, attempts)}</span></div><div className="study-actions"><button onClick={() => setReviewing(reviewing === id ? null : id)}>开始复习</button><button onClick={() => change(value => scheduleReview(value, id, review.interval, dayToday()))}>延期 {review.interval} 天</button><label>重排日期<input type="date" value={review.due} onChange={event => { if (event.target.value) change(value => ({ ...value, reviews: { ...value.reviews, [id]: { ...review, due: event.target.value } } })) }}/></label></div>{reviewing === id && <div className="study-review-work"><p>先回看知识点与对应题目，再根据自己的理解评价。评价后会记录到历史并安排下一次提醒。</p><Link to={withLearningContext('/lab/knowledge', id, study.mode)}>打开知识讲解</Link><Link to={withLearningContext('/lab/practice', id, study.mode)}>做相关练习</Link><div className="study-actions">{(['需要复习', '基本掌握', '已掌握'] as Mastery[]).map(rating => <button key={rating} onClick={() => { change(value => recordReview(value, id, rating)); setReviewing(null) }}>{rating}</button>)}</div></div>}<details><summary>复习历史（{review.history.length} 次）</summary>{review.history.length ? review.history.map((event, index) => <p key={`${event.date}-${index}`}>{event.date} · {event.rating}</p>) : <p>尚未完成复习。</p>}</details></article>)}</section>}
  </div>
}
