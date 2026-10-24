import { knowledgeById } from './knowledge'
import { questions, type Attempt } from './questionBank'
import { attemptStorageKey, parseAttemptHistory, serializeAttemptHistory } from './questionAttempts'
import { parseLabCase } from '../engine/labCases'
import { parseExamDraft } from './examDraft'

export type Mastery = '未学习' | '学习中' | '需要复习' | '基本掌握' | '已掌握'
export type Review = { due: string; interval: number; history: { date: string; rating: Mastery }[] }
export type Study = {
  version: 1; viewed: Record<string, { count: number; last: string }>;
  algorithms: Record<string, { count: number; last: string }>;
  mastery: Record<string, Mastery>; reviews: Record<string, Review>;
  reasons: Record<string, string>; dismissed: string[]; seconds: number;
  recent: string | null; mode: 'course' | '408'; intervals: number[]
}
export const studyStorageKey = 'datastruct-study-v1'
export const defaultIntervals = [1, 3, 7, 14, 30]
export const createStudy = (): Study => ({ version: 1, viewed: {}, algorithms: {}, mastery: {}, reviews: {}, reasons: {}, dismissed: [], seconds: 0, recent: null, mode: 'course', intervals: [...defaultIntervals] })
const ratings: Mastery[] = ['未学习', '学习中', '需要复习', '基本掌握', '已掌握']
const dayPattern = /^\d{4}-\d{2}-\d{2}$/
const validDay = (day: unknown): day is string => typeof day === 'string' && dayPattern.test(day) && new Date(`${day}T12:00:00Z`).toISOString().slice(0, 10) === day
const validTime = (time: unknown): time is string => typeof time === 'string' && Number.isFinite(Date.parse(time))
const dict = (value: unknown, valid: (entry: unknown) => boolean) => !!value && typeof value === 'object' && !Array.isArray(value) && Object.values(value).every(valid)
const counter = (value: unknown) => !!value && typeof value === 'object' && 'count' in value && typeof value.count === 'number' && Number.isSafeInteger(value.count) && value.count > 0 && 'last' in value && validTime(value.last)
const review = (value: unknown) => !!value && typeof value === 'object' && 'due' in value && validDay(value.due) && 'interval' in value && typeof value.interval === 'number' && Number.isInteger(value.interval) && value.interval >= 1 && value.interval <= 365 && 'history' in value && Array.isArray(value.history) && value.history.length <= 1000 && value.history.every((row: unknown) => !!row && typeof row === 'object' && 'date' in row && validDay(row.date) && 'rating' in row && ratings.includes(row.rating as Mastery))

export function parseStudy(raw: string | null): Study | null {
  if (raw === null) return createStudy()
  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1) return null
    const data = value as Study
    return dict(data.viewed, counter) && dict(data.algorithms, counter) && dict(data.mastery, entry => ratings.includes(entry as Mastery)) && dict(data.reviews, review) && dict(data.reasons, entry => typeof entry === 'string' && entry.length <= 2000) && Array.isArray(data.dismissed) && data.dismissed.every(id => typeof id === 'string') && Number.isFinite(data.seconds) && data.seconds >= 0 && (data.recent === null || validTime(data.recent)) && (data.mode === 'course' || data.mode === '408') && Array.isArray(data.intervals) && data.intervals.length === 5 && data.intervals.every(n => Number.isInteger(n) && n >= 1 && n <= 365) ? data : null
  } catch { return null }
}
export const loadStudy = (): Study | null => { try { return parseStudy(localStorage.getItem(studyStorageKey)) } catch { return null } }
export const saveStudy = (study: Study): boolean => { try { if (parseStudy(JSON.stringify(study)) === null || (localStorage.getItem(studyStorageKey) !== null && loadStudy() === null)) return false; localStorage.setItem(studyStorageKey, JSON.stringify(study)); return true } catch { return false } }
export const updateStudy = (change: (study: Study) => Study): boolean => { const current = loadStudy(); return current !== null && saveStudy(change(current)) }
export const dayToday = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}` }
export const addDays = (day: string, days: number) => { const date = new Date(`${day}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10) }

export function markViewed(study: Study, pointId: string, mode: Study['mode'], at = new Date().toISOString()): Study {
  const count = study.viewed[pointId]?.count ?? 0
  return { ...study, viewed: { ...study.viewed, [pointId]: { count: count + 1, last: at } }, recent: at, mode }
}
export function markAlgorithm(study: Study, algorithmId: string, at = new Date().toISOString()): Study {
  const count = study.algorithms[algorithmId]?.count ?? 0
  return { ...study, algorithms: { ...study.algorithms, [algorithmId]: { count: count + 1, last: at } }, recent: at }
}
export function scheduleReview(study: Study, pointId: string, interval = study.intervals[0], today = dayToday()): Study {
  const previous = study.reviews[pointId]
  return { ...study, reviews: { ...study.reviews, [pointId]: { due: addDays(today, interval), interval, history: previous?.history ?? [] } } }
}
export function recordReview(study: Study, pointId: string, rating: Mastery, today = dayToday()): Study {
  const previous = study.reviews[pointId]
  const intervals = [...study.intervals].sort((a, b) => a - b)
  const interval = rating === '需要复习' ? intervals[0] : intervals.find(value => value > (previous?.interval ?? 0)) ?? intervals.at(-1)!
  return { ...scheduleReview(study, pointId, interval, today), mastery: { ...study.mastery, [pointId]: rating }, reviews: { ...study.reviews, [pointId]: { due: addDays(today, interval), interval, history: [...(previous?.history ?? []), { date: today, rating }].slice(-1000) } }, recent: new Date(`${today}T12:00:00Z`).toISOString() }
}
export function studyStatus(pointId: string, study: Study, attempts: readonly Attempt[]): Mastery {
  if (study.mastery[pointId]) return study.mastery[pointId]
  const related = attempts.filter(row => questions.find(item => item.id === row.questionId)?.knowledgePointIds.includes(pointId))
  if (related.length && !related.at(-1)!.correct) return '需要复习'
  if (related.filter(row => row.correct).length >= 2) return '基本掌握'
  return study.viewed[pointId] || related.length ? '学习中' : '未学习'
}
export function wrongBook(attempts: readonly Attempt[], study = createStudy()) {
  const grouped = new Map<string, { questionId: string; wrongCount: number; count: number; last: Attempt }>()
  for (const row of attempts) {
    const old = grouped.get(row.questionId)
    if (!old && !row.correct) grouped.set(row.questionId, { questionId: row.questionId, wrongCount: 1, count: 1, last: row })
    else if (old) grouped.set(row.questionId, { ...old, wrongCount: old.wrongCount + Number(!row.correct), count: old.count + 1, last: row.correct ? old.last : row })
  }
  return [...grouped.values()].filter(row => !study.dismissed.includes(row.questionId))
}
export function mergeStudy(current: Study, attempts: Attempt[], imported: Study, incoming: Attempt[]) {
  const unique = new Map<string, Attempt>()
  for (const row of [...attempts, ...incoming]) unique.set(JSON.stringify([row.questionId, row.answer, row.correct, row.mode, row.timestamp, row.version]), row)
  const mergeCounters = (a: Study['viewed'], b: Study['viewed']) => Object.fromEntries([...new Set([...Object.keys(a), ...Object.keys(b)])].map(id => [id, !a[id] ? b[id] : !b[id] ? a[id] : a[id].last >= b[id].last ? { count: Math.max(a[id].count, b[id].count), last: a[id].last } : { count: Math.max(a[id].count, b[id].count), last: b[id].last }]))
  const reviews: Study['reviews'] = { ...imported.reviews, ...current.reviews }
  for (const [id, other] of Object.entries(imported.reviews)) if (current.reviews[id]) {
    const history = [...current.reviews[id].history, ...other.history]
    reviews[id] = { ...(current.reviews[id].due <= other.due ? current.reviews[id] : other), history: [...new Map(history.map(row => [JSON.stringify(row), row])).values()].slice(-1000) }
  }
  return { study: { ...current, viewed: mergeCounters(current.viewed, imported.viewed), algorithms: mergeCounters(current.algorithms, imported.algorithms), mastery: { ...imported.mastery, ...current.mastery }, reviews, reasons: { ...imported.reasons, ...current.reasons }, dismissed: [...new Set([...current.dismissed, ...imported.dismissed])], seconds: Math.max(current.seconds, imported.seconds), recent: [current.recent, imported.recent].filter((v): v is string => !!v).sort().at(-1) ?? null } as Study, attempts: [...unique.values()].sort((a, b) => a.timestamp.localeCompare(b.timestamp)).slice(-500) }
}
export function importStudy(raw: string): boolean {
  try {
    const data: unknown = JSON.parse(raw)
    if (!data || typeof data !== 'object' || !('version' in data) || (data.version !== 1 && data.version !== 2)) return false
    const legacy = 'records' in data && !('study' in data)
    const imported = legacy ? createStudy() : 'study' in data ? parseStudy(JSON.stringify(data.study)) : null
    const incoming = parseAttemptHistory(JSON.stringify({ version: 1, records: legacy ? data.records : 'attempts' in data ? data.attempts : null }))
    const current = loadStudy(), attempts = parseAttemptHistory(localStorage.getItem(attemptStorageKey))
    if (!imported || !incoming || !current || !attempts) return false
    const merged = mergeStudy(current, attempts, imported, incoming)
    const extras = data.version === 2 && 'extras' in data ? data.extras : undefined
    if (data.version === 2 && (!extras || typeof extras !== 'object' || Array.isArray(extras))) return false
    const fields = extras as Record<string, unknown> | undefined
    if (fields && ['theme', 'completed', 'cases', 'exam'].some(name => fields[name] !== null && fields[name] !== undefined && typeof fields[name] !== 'string')) return false
    const parsed = (value: string | null) => value === null ? null : JSON.parse(value) as unknown
    const theme = fields ? parsed(fields.theme as string | null) : null
    const completed = fields ? parsed(fields.completed as string | null) : null
    const cases = fields ? parsed(fields.cases as string | null) : null
    const exam = fields?.exam as string | null | undefined
    if (theme !== null && theme !== 'light' && theme !== 'dark') return false
    if (completed !== null && (!Array.isArray(completed) || !completed.every(id => typeof id === 'string'))) return false
    if (cases !== null && (!Array.isArray(cases) || cases.some(item => { try { parseLabCase(JSON.stringify(item)); return false } catch { return true } }))) return false
    if (exam && parseExamDraft(exam) === null) return false
    const keys = [studyStorageKey, attemptStorageKey, 'datastruct-theme', 'datastruct-completed', 'datastruct-cases-v1', 'datastruct-exam-draft-v1']
    const previous = new Map(keys.map(key => [key, localStorage.getItem(key)]))
    const existingTheme = parsed(previous.get('datastruct-theme') ?? null)
    const existingCompleted = parsed(previous.get('datastruct-completed') ?? null)
    const existingCases = parsed(previous.get('datastruct-cases-v1') ?? null)
    if (existingTheme !== null && existingTheme !== 'light' && existingTheme !== 'dark') return false
    if (existingCompleted !== null && (!Array.isArray(existingCompleted) || !existingCompleted.every(id => typeof id === 'string'))) return false
    if (existingCases !== null && (!Array.isArray(existingCases) || existingCases.some(item => { try { parseLabCase(JSON.stringify(item)); return false } catch { return true } }))) return false
    const existingExam = previous.get('datastruct-exam-draft-v1')
    if (existingExam && parseExamDraft(existingExam) === null) return false
    const writes = new Map<string, string>([[studyStorageKey, JSON.stringify(merged.study)], [attemptStorageKey, serializeAttemptHistory(merged.attempts)]])
    if (existingTheme === null && theme !== null) writes.set('datastruct-theme', JSON.stringify(theme))
    if (completed !== null) writes.set('datastruct-completed', JSON.stringify([...new Set([...(existingCompleted as string[] | null ?? []), ...completed])]))
    if (cases !== null) {
      const combined = [...(existingCases as unknown[] | null ?? []), ...cases]
      const unique = [...new Map(combined.map(item => [JSON.stringify(item), item])).values()]
      if (unique.length > 20) return false
      writes.set('datastruct-cases-v1', JSON.stringify(unique))
    }
    if (!existingExam && exam) writes.set('datastruct-exam-draft-v1', exam)
    try { for (const [key, value] of writes) localStorage.setItem(key, value); return true }
    catch { for (const [key, value] of previous) { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value) } catch { /* storage unavailable */ } } return false }
  } catch { return false }
}
export const exportStudy = () => { try { const study = loadStudy(), attempts = parseAttemptHistory(localStorage.getItem(attemptStorageKey)); return study && attempts ? JSON.stringify({ version: 2, study, attempts, extras: { theme: localStorage.getItem('datastruct-theme'), completed: localStorage.getItem('datastruct-completed'), cases: localStorage.getItem('datastruct-cases-v1'), exam: localStorage.getItem('datastruct-exam-draft-v1') } }, null, 2) : null } catch { return null } }
export const dueReviews = (study: Study, today = dayToday()) => Object.entries(study.reviews).filter(([, value]) => value.due <= today).map(([id]) => id)
export const pointChapter = (pointId: string) => knowledgeById.get(pointId)?.chapterId
