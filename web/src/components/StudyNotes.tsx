import { studyNotes } from '../data/studyNotes'
import type { SortId } from '../engine/sorting'
import type { TopicId } from '../engine/topics'
import './StudyNotes.css'

const stability: Partial<Record<SortId, string>> = { bubble: '稳定', selection: '不稳定', insertion: '稳定', quick: '不稳定', shell: '不稳定', heap: '不稳定', merge: '稳定', radix: '稳定' }

export function StudyNotes({ id }: { id: TopicId | SortId | 'complexity' }) {
  const [steps, use, strengths, limits, exam] = studyNotes[id]
  return <section className="study-notes" aria-label="学习要点"><div><h2>操作步骤</h2><p>{steps}</p></div><div><h2>适用场景</h2><p>{use}</p></div><div><h2>优点与局限</h2><p><b>优点：</b>{strengths}</p><p><b>局限：</b>{limits}</p></div><div><h2>常考点</h2><p>{exam}</p>{id in stability && <p><b>稳定性：</b>{stability[id as SortId]}</p>}</div></section>
}
