import { afterEach, describe, expect, it, vi } from 'vitest'
import { questions } from './questionBank'
import { clearExamDraft, loadExamDraft, saveExamDraft, type ExamDraft } from './examDraft'

afterEach(() => vi.unstubAllGlobals())

describe('in-progress exam draft', () => {
  it('restores questions, answers, deadline and score settings after a new read', () => {
    const data = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value), removeItem: (key: string) => data.delete(key) })
    const draft: ExamDraft = { version: 1, ids: [questions[0].id], answers: { [questions[0].id]: ['A'] }, deadline: Date.now() + 60000, points: 10, selectedId: questions[0].id, mode: '408' }
    expect(saveExamDraft(draft)).toBe(true)
    expect(loadExamDraft()).toEqual(draft)
    expect(clearExamDraft()).toBe(true)
    expect(loadExamDraft()).toBeNull()
  })

  it('preserves an incompatible future draft', () => {
    const data = new Map([['datastruct-exam-draft-v1', '{"version":2}']])
    vi.stubGlobal('localStorage', { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value), removeItem: (key: string) => data.delete(key) })
    expect(loadExamDraft()).toBeNull()
    expect(clearExamDraft()).toBe(false)
    expect(data.get('datastruct-exam-draft-v1')).toBe('{"version":2}')
  })
})
