import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from './ui/button'
import { chapterGuides, knowledgeById, knowledgePoints, knowledgeVersion, layoutKnowledgeGraph, syllabusMapping, type KnowledgePoint, type StudyMode } from '../data/knowledge'
import { lessonById } from '../data/catalog'
import { questions } from '../data/questionBank'
import { markViewed, updateStudy } from '../data/studyProgress'
import { withLearningContext } from '../data/learningLinks'
import { syllabus2027 } from '../data/syllabus2027'
import './KnowledgeLab.css'

const paths = [
  ['linear', 'linked', 'linkedStack'],
  ['tree', 'binaryTree', 'bst', 'avl'],
  ['graph', 'graphStorage', 'graphTraversal'],
  ['graph', 'graphStorage', 'shortestPath', 'dijkstra'],
]

function SelfCheck({ item }: { item: KnowledgePoint }) {
  const [revealed, setRevealed] = useState(false)
  if (!item.practice) return <p>本知识点的自测正在建设，可先打开关联动画观察默认示例。</p>
  return <div id="knowledge-practice" className="knowledge-practice"><strong>{item.practice.prompt}</strong><Button variant="outline" onClick={() => setRevealed(value => !value)}>{revealed ? '收起答案' : '查看答案与解释'}</Button>{revealed && <p role="status"><b>{item.practice.answer}</b> {item.practice.explanation}</p>}</div>
}

export function KnowledgeLab() {
  const lastView = useRef('')
  const [params, setParams] = useSearchParams()
  const selectedFromUrl = knowledgeById.get(params.get('point') ?? '')
  const chapterParam = Number(params.get('chapter'))
  const chapterId = selectedFromUrl?.chapterId ?? (Number.isInteger(chapterParam) && chapterParam >= 1 && chapterParam <= 9 ? chapterParam : 2)
  const chapter = chapterGuides[chapterId - 1]
  const mode: StudyMode = params.get('mode') === '408' ? '408' : 'course'
  const points = knowledgePoints.filter(item => item.chapterId === chapterId)
  const selected = selectedFromUrl ?? points[0]
  useEffect(() => { const key = `${selected.id}:${mode}`; if (lastView.current !== key) { lastView.current = key; updateStudy(study => markViewed(study, selected.id, mode)) } }, [selected.id, mode])
  const hasPointQuestions = questions.some(item => item.knowledgePointIds.includes(selected.id))
  const hasChapterQuestions = questions.some(item => knowledgeById.get(item.knowledgePointIds[0])?.chapterId === chapterId)
  const practiceQuery = hasPointQuestions ? `point=${selected.id}` : hasChapterQuestions ? `chapter=${chapterId}` : ''
  const graph = layoutKnowledgeGraph(points)
  const positions = new Map(graph.nodes.map(node => [node.id, node]))
  const setView = (next: { chapter?: number; point?: string; mode?: StudyMode }) => {
    const copy = new URLSearchParams(params)
    if (next.chapter !== undefined) { copy.set('chapter', String(next.chapter)); copy.delete('point') }
    if (next.point) { copy.set('point', next.point); copy.set('chapter', String(knowledgeById.get(next.point)?.chapterId ?? chapterId)) }
    if (next.mode) copy.set('mode', next.mode)
    setParams(copy)
  }
  return <div className="knowledge-lab">
    <div className="knowledge-card knowledge-intro"><div><h2>课程知识体系</h2><p>沿先修关系学习概念，再打开对应的算法动画核对推演。</p></div><span>内容版本 {knowledgeVersion}</span></div>
    <div className="knowledge-card knowledge-mode"><div role="tablist" aria-label="学习模式"><button role="tab" aria-selected={mode === 'course'} onClick={() => setView({ mode: 'course' })}>大学课程</button><button role="tab" aria-selected={mode === '408'} onClick={() => setView({ mode: '408' })}>考研 408</button></div><p>{mode === 'course' ? '按教材九章组织，重点理解定义、结构与操作。' : '按你提供的 2027 年 408 数据结构大纲组织范围，点击条目进入对应知识点。'}</p></div>
    {mode === '408' && <><div className="knowledge-notice"><strong>考纲来源：用户提供文本，尚未独立核验</strong><span>版本 {syllabusMapping.version} · 来源：{syllabusMapping.source}。{syllabusMapping.note}</span></div><section className="knowledge-card"><h3>2027 年 408 数据结构考查范围</h3><p>目标：掌握基本概念、结构与操作及复杂度分析；能用 C 或 C++ 设计实现算法。</p><div className="knowledge-chapter-grid">{syllabus2027.map(section => <div key={section.title}><h4>{section.title}</h4><ul>{section.topics.map(([label, id]) => <li key={`${label}-${id}`}><button type="button" onClick={() => setView({ point: id })}>{label}</button></li>)}</ul></div>)}</div></section></>}
    <div className="knowledge-chapters" aria-label="九章知识目录">{chapterGuides.map(item => <button key={item.id} className={chapterId === item.id ? 'active' : ''} aria-current={chapterId === item.id ? 'true' : undefined} onClick={() => setView({ chapter: item.id })}><small>{String(item.id).padStart(2, '0')}</small><strong>{item.title}</strong><em>{item.status === 'complete' ? '内容完整' : '建设中'}</em></button>)}</div>
    <section className="knowledge-card knowledge-chapter"><div className="knowledge-section-head"><div><small>第 {chapter.id} 章 · {chapter.status === 'complete' ? '内容完整' : '内容建设中'}</small><h3>{chapter.title}</h3></div><span>{points.length} 个知识点</span></div><p>{chapter.introduction}</p><div className="knowledge-chapter-grid"><div><h4>学习目标</h4><ul>{chapter.objectives.map(text => <li key={text}>{text}</li>)}</ul></div><div><h4>难点与复习</h4><ul>{chapter.difficulties.map(text => <li key={text}>{text}</li>)}</ul><p>{chapter.review}</p></div><div><h4>前置与章节练习</h4><p>前置：{chapter.prerequisiteIds.length ? chapter.prerequisiteIds.map(id => knowledgeById.get(id)?.title).join('、') : '无'}</p><p>练习建议：{chapter.exercise}</p><p>关联动画：{chapter.relatedAlgorithms.map(id => lessonById.get(id)?.title).join('、')}</p></div></div></section>
    <section className="knowledge-card"><div className="knowledge-section-head"><div><h3>知识依赖图</h3><p>箭头从前置知识指向后续知识。点击节点查看定义、例题和练习。</p></div></div><div className="knowledge-graph-scroll"><div className="knowledge-graph" style={{ width: graph.width, height: graph.height }}><svg width={graph.width} height={graph.height} aria-hidden="true"><defs><marker id="knowledge-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#91b7ba"/></marker></defs>{graph.edges.map(edge => { const from = positions.get(edge.from)!, to = positions.get(edge.to)!; return <line key={`${edge.from}-${edge.to}`} x1={from.x + 72} y1={from.y} x2={to.x - 72} y2={to.y} stroke="#91b7ba" strokeWidth="2" markerEnd="url(#knowledge-arrow)"/> })}</svg>{graph.nodes.map(node => { const item = knowledgeById.get(node.id)!; return <button key={node.id} style={{ left: node.x - 72, top: node.y - 25 }} className={`${selected.id === item.id ? 'active' : ''} ${item.status}`} aria-pressed={selected.id === item.id} onClick={() => setView({ point: item.id })}>{item.title}<small>{item.status === 'complete' ? item.difficulty : '建设中'}</small></button> })}</div></div><div className="knowledge-paths"><strong>跨章节关联</strong>{paths.map(path => <div key={path.join('-')}>{path.map((id, index) => <span key={id}>{index > 0 && <b aria-hidden="true">→</b>}<button onClick={() => setView({ point: id })}>{knowledgeById.get(id)?.title}</button></span>)}</div>)}</div></section>
    <section className="knowledge-card knowledge-detail"><div className="knowledge-section-head"><div><small>知识点 · {selected.status === 'complete' ? '内容完整' : '概要建设中'} · {selected.difficulty}</small><h3>{selected.title}</h3></div><span>{selected.importance}</span></div><p className="knowledge-lead">{selected.description}</p><div className="knowledge-detail-grid"><div><h4>定义</h4><p>{selected.definition}</p><h4>图形解释</h4><div className="knowledge-diagram">{selected.diagram.map((label, index) => <span key={`${label}-${index}`}>{index > 0 && <b aria-hidden="true">→</b>}<em>{label}</em></span>)}</div><h4>性质与推论</h4><ul>{selected.properties.map(value => <li key={value}>{value}</li>)}</ul></div><div><h4>典型例题</h4><p>{selected.workedExample.prompt}</p><p><b>推演：</b>{selected.workedExample.solution}</p><h4>常见错误</h4><ul>{selected.commonMistakes.map(value => <li key={value}>{value}</li>)}</ul></div></div>
      <div className="knowledge-detail-grid knowledge-links"><div><h4>前置知识</h4>{selected.prerequisites.length ? selected.prerequisites.map(id => <button key={id} onClick={() => setView({ point: id })}>{knowledgeById.get(id)?.title}</button>) : <p>从本知识点开始即可。</p>}<h4>学习目标</h4><ul>{selected.learningObjectives.map(value => <li key={value}>{value}</li>)}</ul></div><div><h4>对应动画</h4>{selected.relatedAlgorithms.map(id => <Link key={id} to={withLearningContext(`/lab/${id}`, selected.id, mode)}>{lessonById.get(id)?.title ?? id} →</Link>)}<h4>{mode === '408' ? '站内 408 复习标签' : '参考与来源'}</h4><p>{mode === '408' ? selected.examTags.join(' · ') : selected.references.join('；')}</p></div></div>
      <div className="knowledge-check"><h4>{mode === '408' ? '操作推演自测' : '课后自测'}</h4><SelfCheck key={selected.id} item={selected}/><Link to={`/lab/practice?${practiceQuery ? `${practiceQuery}&` : ''}mode=${mode}`}>{hasPointQuestions ? '练习这个知识点' : hasChapterQuestions ? '练习本章题目' : '浏览当前题库'} →</Link></div>
    </section>
  </div>
}
