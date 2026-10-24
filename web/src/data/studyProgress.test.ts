import { afterEach, describe, expect, it, vi } from 'vitest'
import { questions, type Attempt } from './questionBank'
import { appendAttempts, deleteWrongAttempts, loadAttempts } from './questionAttempts'
import { createStudy, dueReviews, exportStudy, importStudy, loadStudy, markViewed, mergeStudy, parseStudy, recordReview, saveStudy, scheduleReview, studyStatus, updateStudy, wrongBook } from './studyProgress'

const wrong: Attempt = { questionId: questions[0].id, answer: ['wrong'], correct: false, mode: 'learn', timestamp: '2026-10-01T10:00:00.000Z', version: 1 }
const installStorage = () => {
  const data = new Map<string, string>()
  vi.stubGlobal('localStorage', { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value) }, removeItem: (key: string) => { data.delete(key) } })
  return data
}
afterEach(() => vi.unstubAllGlobals())

describe('study progression', () => {
  it('closes the view, wrong answer, review, mastery loop without treating a view as mastery', () => {
    const viewed = markViewed(createStudy(), questions[0].knowledgePointIds[0], 'course', '2026-10-01T09:00:00.000Z')
    expect(studyStatus(questions[0].knowledgePointIds[0], viewed, [])).toBe('学习中')
    expect(wrongBook([wrong, wrong])[0].wrongCount).toBe(2)
    expect(studyStatus(questions[0].knowledgePointIds[0], viewed, [wrong])).toBe('需要复习')
    const planned = scheduleReview(viewed, questions[0].knowledgePointIds[0], 1, '2026-10-01')
    expect(planned.reviews[questions[0].knowledgePointIds[0]].due).toBe('2026-10-02')
    const reviewed = recordReview(planned, questions[0].knowledgePointIds[0], '已掌握', '2026-10-02')
    expect(studyStatus(questions[0].knowledgePointIds[0], reviewed, [wrong])).toBe('已掌握')
    expect(reviewed.reviews[questions[0].knowledgePointIds[0]].history).toHaveLength(1)
  })

  it('merges duplicate imports without removing older records', () => {
    const reordered = { version: 1 as const, timestamp: wrong.timestamp, mode: wrong.mode, correct: wrong.correct, answer: wrong.answer, questionId: wrong.questionId }
    const merged = mergeStudy(createStudy(), [wrong], createStudy(), [reordered, { ...wrong, timestamp: '2026-10-02T10:00:00.000Z' }])
    expect(merged.attempts).toHaveLength(2)
  })

  it('saves the complete learning loop and keeps original answer records', () => {
    installStorage()
    expect(updateStudy(value => markViewed(value, questions[0].knowledgePointIds[0], '408', '2026-10-01T09:00:00.000Z'))).toBe(true)
    expect(appendAttempts([wrong])).toBe(true)
    expect(updateStudy(value => scheduleReview(value, questions[0].knowledgePointIds[0], 1, '2026-10-01'))).toBe(true)
    expect(dueReviews(loadStudy()!, '2026-10-02')).toContain(questions[0].knowledgePointIds[0])
    expect(updateStudy(value => recordReview(value, questions[0].knowledgePointIds[0], '已掌握', '2026-10-02'))).toBe(true)
    expect(studyStatus(questions[0].knowledgePointIds[0], loadStudy()!, loadAttempts()!)).toBe('已掌握')
    expect(loadAttempts()).toEqual([wrong])
    expect(wrongBook(loadAttempts()!)).toHaveLength(1)
  })

  it('refuses damaged or future data and imports old answer exports without duplicates', () => {
    const data = installStorage()
    expect(parseStudy('{bad')).toBeNull()
    expect(parseStudy(JSON.stringify({ ...createStudy(), version: 2 }))).toBeNull()
    expect(appendAttempts([wrong])).toBe(true)
    expect(importStudy(JSON.stringify({ version: 1, records: [wrong] }))).toBe(true)
    expect(loadAttempts()).toHaveLength(1)
    expect(exportStudy()).toContain(wrong.questionId)
    data.set('datastruct-study-v1', '{bad')
    expect(saveStudy(createStudy())).toBe(false)
    expect(data.get('datastruct-study-v1')).toBe('{bad')
  })

  it('keeps correct answers while deleting only the selected wrong records', () => {
    installStorage()
    const right = { ...wrong, correct: true, answer: [...questions[0].answer], timestamp: '2026-10-02T10:00:00.000Z' }
    expect(appendAttempts([wrong, right])).toBe(true)
    expect(deleteWrongAttempts(wrong.questionId)).toBe(true)
    expect(loadAttempts()).toEqual([right])
    expect(wrongBook(loadAttempts()!)).toHaveLength(0)
  })

  it('does not overwrite records when storage becomes unwritable', () => {
    const data = installStorage()
    expect(appendAttempts([wrong])).toBe(true)
    vi.stubGlobal('localStorage', { getItem: (key: string) => data.get(key) ?? null, setItem: () => { throw new Error('quota') } })
    expect(updateStudy(value => markViewed(value, 'array', 'course'))).toBe(false)
    expect(loadAttempts()).toEqual([wrong])
  })

  it('backs up and restores theme, completed lessons and saved cases alongside study records', () => {
    const data = installStorage()
    data.set('datastruct-theme', '"dark"')
    data.set('datastruct-completed', '["bubble"]')
    data.set('datastruct-cases-v1', JSON.stringify([{ version: 1, algorithmId: 'bubble', input: '2, 1', options: {} }]))
    data.set('datastruct-exam-draft-v1', JSON.stringify({ version: 1, ids: [questions[0].id], answers: {}, deadline: Date.now() + 60000, points: 10, selectedId: questions[0].id, mode: '408' }))
    const backup = exportStudy()!
    expect(JSON.parse(backup).version).toBe(2)
    data.clear()
    expect(importStudy(backup)).toBe(true)
    expect(data.get('datastruct-theme')).toBe('"dark"')
    expect(data.get('datastruct-completed')).toBe('["bubble"]')
    expect(JSON.parse(data.get('datastruct-cases-v1')!)).toHaveLength(1)
    expect(JSON.parse(data.get('datastruct-exam-draft-v1')!).ids).toEqual([questions[0].id])
    data.set('datastruct-cases-v1', '{bad')
    expect(importStudy(backup)).toBe(false)
    expect(data.get('datastruct-cases-v1')).toBe('{bad')
  })

  it('never moves a successful review to a shorter configured interval', () => {
    const study = { ...createStudy(), intervals: [3, 1, 7, 14, 30] }
    const planned = scheduleReview(study, 'array', 3, '2026-10-01')
    expect(recordReview(planned, 'array', '基本掌握', '2026-10-04').reviews.array.interval).toBe(7)
  })
})
