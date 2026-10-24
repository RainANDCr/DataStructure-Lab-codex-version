import { questions } from './questionBank'

export type ExamDraft = { version: 1; ids: string[]; answers: Record<string, string[]>; deadline: number; points: number; selectedId: string | null; mode: 'course' | '408' }
const key = 'datastruct-exam-draft-v1'
const ids = new Set(questions.map(item => item.id))

export function parseExamDraft(raw: string | null): ExamDraft | null {
  try {
    if (raw === null) return null
    const draft: unknown = JSON.parse(raw)
    if (!draft || typeof draft !== 'object') return null
    const value = draft as Partial<ExamDraft>
    if (value.version !== 1 || !Array.isArray(value.ids) || !value.ids.length || value.ids.some(id => typeof id !== 'string' || !ids.has(id)) || new Set(value.ids).size !== value.ids.length || !value.answers || typeof value.answers !== 'object' || Array.isArray(value.answers) || Object.entries(value.answers).some(([id, answer]) => !value.ids!.includes(id) || !Array.isArray(answer) || answer.some(item => typeof item !== 'string')) || !Number.isFinite(value.deadline) || value.deadline! <= 0 || !Number.isInteger(value.points) || value.points! < 1 || value.points! > 20 || value.selectedId !== null && value.selectedId !== undefined && !value.ids.includes(value.selectedId) || value.mode !== 'course' && value.mode !== '408') return null
    return value as ExamDraft
  } catch { return null }
}
export const loadExamDraft = (): ExamDraft | null => { try { return parseExamDraft(localStorage.getItem(key)) } catch { return null } }

export function saveExamDraft(draft: ExamDraft): boolean {
  try {
    if (localStorage.getItem(key) !== null && loadExamDraft() === null) return false
    localStorage.setItem(key, JSON.stringify(draft))
    return true
  } catch { return false }
}

export function clearExamDraft(): boolean {
  try { if (localStorage.getItem(key) !== null && loadExamDraft() === null) return false; localStorage.removeItem(key); return true } catch { return false }
}
