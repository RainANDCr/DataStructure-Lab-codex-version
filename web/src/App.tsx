import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, Route, Routes, useParams, useSearchParams } from 'react-router-dom'
import { BookOpen, Check, ChevronDown, ChevronRight, ExternalLink, Menu, Moon, Search, Sun } from 'lucide-react'
import { Button } from './components/ui/button'
import type { SortId } from './engine/sorting'
import { topicIds, type TopicId } from './engine/topics'
import { chapters, lessonById, lessons } from './data/catalog'
import { legacyStorageHealthy, save, savedCompleted, savedTheme } from './lib/storage'
import { knowledgeById, knowledgeForAlgorithm } from './data/knowledge'
import { withLearningContext } from './data/learningLinks'
import { questions } from './data/questionBank'
import { markAlgorithm, updateStudy } from './data/studyProgress'

const SortingLab = lazy(() => import('./components/SortingLab').then(module => ({ default: module.SortingLab })))
const TopicLab = lazy(() => import('./components/TopicLab').then(module => ({ default: module.TopicLab })))
const ComplexityLab = lazy(() => import('./components/ComplexityLab').then(module => ({ default: module.ComplexityLab })))
const ComparisonLab = lazy(() => import('./components/ComparisonLab').then(module => ({ default: module.ComparisonLab })))
const MemoryLab = lazy(() => import('./components/MemoryLab').then(module => ({ default: module.MemoryLab })))
const RecursionLab = lazy(() => import('./components/RecursionLab').then(module => ({ default: module.RecursionLab })))
const DebugLab = lazy(() => import('./components/DebugLab').then(module => ({ default: module.DebugLab })))
const KnowledgeLab = lazy(() => import('./components/KnowledgeLab').then(module => ({ default: module.KnowledgeLab })))
const PracticeLab = lazy(() => import('./components/PracticeLab').then(module => ({ default: module.PracticeLab })))
const StudyLab = lazy(() => import('./components/StudyLab').then(module => ({ default: module.StudyLab })))

function Shell() {
  const lastRoute = useRef('')
  const { id = 'bubble' } = useParams()
  const [params] = useSearchParams()
  const lesson = id === 'compare' ? { id, title: '算法对比', chapter: 9, status: 'native' as const, summary: '用同一组数据同步观察两种方法的步骤与操作次数' } : id === 'memory' ? { id, title: '指针与内存模拟', chapter: 2, status: 'native' as const, summary: '同步观察 C/C++ 栈变量、堆节点、指针与链表修改' } : id === 'recursion' ? { id, title: '递归调用栈', chapter: 6, status: 'native' as const, summary: '观察递归调用树、活动栈帧、返回值与算法状态' } : id === 'debug' ? { id, title: '代码调试与错误实验室', chapter: 9, status: 'native' as const, summary: '逐步跟踪代码、设置教学断点、预测操作并定位常见错误' } : id === 'knowledge' ? { id, title: '课程知识体系与 408 图谱', chapter: 1, status: 'native' as const, summary: '按九章与先修关系串联概念、例题和算法动画' } : id === 'practice' ? { id, title: '算法推演题库', chapter: 1, status: 'native' as const, summary: '原创题目、可视化推演与即时判分' } : id === 'study' ? { id, title: '学习记录与复习', chapter: 1, status: 'native' as const, summary: '查看错题、学习活动与到期复习任务' } : lessonById.get(id)
  const mode = params.get('mode') === '408' ? '408' : 'course'
  const requestedPoint = knowledgeById.get(params.get('point') ?? '')
  const contextPoint = requestedPoint?.relatedAlgorithms.includes(id) ? requestedPoint : undefined
  const contextQuestion = contextPoint && questions.some(item => item.knowledgePointIds.includes(contextPoint.id))
  const relatedKnowledge = contextPoint ? [contextPoint, ...knowledgeForAlgorithm(id).filter(point => point.id !== contextPoint.id)].slice(0, 3) : knowledgeForAlgorithm(id).slice(0, 3)
  const [query,setQuery] = useState('')
  const [theme,setTheme] = useState<'light'|'dark'>(savedTheme)
  const [completed,setCompleted] = useState<string[]>(savedCompleted)
  const [storageIssue,setStorageIssue] = useState(() => !legacyStorageHealthy())
  const [closed,setClosed] = useState<number[]>([])
  const [mobileMenu,setMobileMenu] = useState(false)
  const available = lessons.filter(item=>item.status!=='planned'&&item.id!=='study')
  const completedCount = new Set(completed.filter(key=>available.some(item=>item.id===key))).size
  const progress = Math.round(completedCount / available.length * 100)
  const normalized = query.trim().toLocaleLowerCase()
  const filtered = useMemo(()=>lessons.filter(item=>item.id!=='study'&&(item.title+' '+item.summary+' '+chapters[item.chapter-1]).toLocaleLowerCase().includes(normalized)),[normalized])
  useEffect(()=>{document.documentElement.classList.toggle('dark',theme==='dark')},[theme])
  useEffect(()=>{ if(lastRoute.current!==id){lastRoute.current=id;if(lessonById.has(id))updateStudy(study=>markAlgorithm(study,id))} },[id])
  useEffect(()=>{ let last=0;const active=()=>{last=Date.now()};window.addEventListener('pointerdown',active);window.addEventListener('keydown',active);const timer=window.setInterval(()=>{if(document.visibilityState==='visible'&&document.hasFocus()&&Date.now()-last<60000)updateStudy(study=>({...study,seconds:study.seconds+15}))},15000);return()=>{window.clearInterval(timer);window.removeEventListener('pointerdown',active);window.removeEventListener('keydown',active)}},[])
  const toggleDone = () => { if (lesson?.status==='planned') return; const next=completed.includes(id)?completed.filter(value=>value!==id):[...completed,id];if(save('datastruct-completed',next))setCompleted(next);else setStorageIssue(true) }
  const toggleChapter = (chapter:number) => setClosed(current=>current.includes(chapter)?current.filter(value=>value!==chapter):[...current,chapter])
  if(!lesson) return <Navigate to="/lab/bubble" replace />
  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu?'is-open':''}`} aria-label="课程导航">
      <div className="brand"><div className="brand-icon"><BookOpen size={21}/></div><div><strong>DataStruct Lab</strong><small>数据结构可视化学习平台</small></div></div>
      <div className="side-search"><Search size={16}/><input aria-label="搜索算法" placeholder="搜索算法或章节" value={query} onChange={event=>setQuery(event.target.value)}/></div>
      <div className="side-scroll"><div className="nav-caption">课程目录 · 九章</div>
        <Link to="/lab/compare" onClick={()=>setMobileMenu(false)} aria-current={id==='compare'?'page':undefined} className={`lesson-link compare-link ${id==='compare'?'active':''}`}>算法对比</Link>
        <Link to="/lab/memory" onClick={()=>setMobileMenu(false)} aria-current={id==='memory'?'page':undefined} className={`lesson-link compare-link ${id==='memory'?'active':''}`}>指针与内存模拟</Link>
        <Link to="/lab/recursion" onClick={()=>setMobileMenu(false)} aria-current={id==='recursion'?'page':undefined} className={`lesson-link compare-link ${id==='recursion'?'active':''}`}>递归调用栈</Link>
        <Link to="/lab/debug" onClick={()=>setMobileMenu(false)} aria-current={id==='debug'?'page':undefined} className={`lesson-link compare-link ${id==='debug'?'active':''}`}>代码调试与错误实验室</Link>
        <Link to="/lab/knowledge" onClick={()=>setMobileMenu(false)} aria-current={id==='knowledge'?'page':undefined} className={`lesson-link compare-link ${id==='knowledge'?'active':''}`}>课程知识体系 · 408</Link>
        <Link to="/lab/practice" onClick={()=>setMobileMenu(false)} aria-current={id==='practice'?'page':undefined} className={`lesson-link compare-link ${id==='practice'?'active':''}`}>算法推演题库</Link>
        <Link to="/lab/study" onClick={()=>setMobileMenu(false)} aria-current={id==='study'?'page':undefined} className={`lesson-link compare-link ${id==='study'?'active':''}`}>学习记录与复习</Link>
        {chapters.map((chapter,index)=>{const number=index+1,items=filtered.filter(item=>item.chapter===number);if(!items.length)return null;const isClosed=closed.includes(number)&&!normalized;return <section className="chapter" key={chapter}><button className="chapter-toggle" onClick={()=>toggleChapter(number)} aria-expanded={!isClosed}><span className="chapter-number">{String(number).padStart(2,'0')}</span><span>{chapter}</span>{isClosed?<ChevronRight size={14}/>:<ChevronDown size={14}/>}</button>{!isClosed&&items.map(item=><Link key={item.id} to={`/lab/${item.id}`} onClick={()=>setMobileMenu(false)} aria-current={item.id===id?'page':undefined} className={`lesson-link ${item.id===id?'active':''}`}><span>{item.title}</span>{completed.includes(item.id)&&item.status!=='planned'?<Check size={13} aria-label="已学习"/>:item.status==='planned'?<em>开发中</em>:null}</Link>)}</section>})}
        {!filtered.length&&<p className="empty-search">没有找到匹配的算法。</p>}
      </div>
      <div className="sidebar-bottom"><div><span>学习进度</span><strong>{completedCount} / {available.length}</strong></div><div className="progress-track"><div style={{width:`${progress}%`}}/></div><small>进度保存在当前浏览器</small></div>
    </aside>
    {mobileMenu&&<button className="backdrop" aria-label="关闭目录" onClick={()=>setMobileMenu(false)}/>}
    <main className="main-area">
      <header className="topbar"><div className="top-left"><Button variant="ghost" className="mobile-menu" aria-label="打开目录" onClick={()=>setMobileMenu(true)}><Menu size={20}/></Button><span className="crumb">{id==='knowledge'||id==='practice'||id==='study'?'课程 / 学习辅助':`课程 / 第 ${lesson.chapter} 章`} / <b>{lesson.title}</b></span></div><div className="top-actions"><span className="top-progress">已学习 {progress}%</span><Button variant="ghost" aria-label={theme==='light'?'切换深色主题':'切换浅色主题'} onClick={()=>{const next=theme==='light'?'dark':'light';if(save('datastruct-theme',next))setTheme(next);else setStorageIssue(true)}}>{theme==='light'?<Moon size={18}/>:<Sun size={18}/>}</Button><a className="github-link" href="https://github.com/RainANDCr/DataStructure-Lab-codex-version" target="_blank" rel="noopener noreferrer" aria-label="打开 GitHub 仓库"><ExternalLink size={18}/><span className="github-label">GitHub</span></a></div></header>
      <div className="content">{storageIssue&&<p className="storage-warning" role="alert">本地主题或学习标记无法安全保存；原始数据已保留。请先备份浏览器数据。</p>}<div className="intro"><div><span className="eyebrow">{id==='compare'||id==='memory'||id==='recursion'||id==='debug'||id==='knowledge'||id==='practice'||id==='study'?'学习辅助':`第 ${lesson.chapter} 章 · ${chapters[lesson.chapter-1]}`}</span><h1>{lesson.title}</h1><p>{lesson.summary}</p>{relatedKnowledge.length>0&&<div className="knowledge-backlinks">关联知识：{relatedKnowledge.map(point=><Link key={point.id} to={withLearningContext('/lab/knowledge', point.id, mode)}>{point.title}</Link>)}{contextQuestion&&<Link to={withLearningContext('/lab/practice', contextPoint!.id, mode)}>练习这个知识点 →</Link>}</div>}</div>{lesson.status!=='planned'&&id!=='compare'&&id!=='memory'&&id!=='recursion'&&id!=='debug'&&id!=='knowledge'&&id!=='practice'&&id!=='study'&&<Button variant={completed.includes(id)?'outline':'default'} onClick={toggleDone}>{completed.includes(id)?<><Check size={16}/>已学习</>:'标记为已学习'}</Button>}</div>
        <Suspense fallback={<div className="planned-card">正在载入实验台…</div>}>{id==='compare'?<ComparisonLab/>:id==='memory'?<MemoryLab/>:id==='recursion'?<RecursionLab/>:id==='debug'?<DebugLab/>:id==='knowledge'?<KnowledgeLab/>:id==='practice'?<PracticeLab/>:id==='study'?<StudyLab/>:lesson.status==='planned'?<div className="planned-card"><div className="planned-icon"><BookOpen size={24}/></div><h2>{lesson.title}正在开发</h2><p>这个主题会按开发计划补充真实算法步骤和交互演示。</p><Link to="/lab/bubble">先学习冒泡排序 <ChevronRight size={16}/></Link></div>:lesson.id==='complexity'?<ComplexityLab/>:topicIds.some(topic=>topic===lesson.id)?<TopicLab key={lesson.id} topicId={lesson.id as TopicId}/>:<SortingLab key={lesson.id} sortId={lesson.id as SortId}/>}</Suspense>
      </div>
    </main>
  </div>
}

export default function App() { return <Routes><Route path="/" element={<Navigate to="/lab/bubble" replace/>}/><Route path="/lab/:id" element={<Shell/>}/><Route path="*" element={<Navigate to="/lab/bubble" replace/>}/></Routes> }
