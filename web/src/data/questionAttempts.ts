import type { Attempt } from './questionBank'

export const attemptStorageKey = 'datastruct-answers-v1'
export const serializeAttemptHistory = (records: readonly Attempt[]) => JSON.stringify({ version: 1, records })

export function parseAttemptHistory(raw: string | null): Attempt[] | null {
  if (raw === null) return []
  try {
    const data: unknown = JSON.parse(raw)
    if (!data || typeof data !== 'object' || !('version' in data) || data.version !== 1 || !('records' in data) || !Array.isArray(data.records)) return null
    if (data.records.length > 500) return null
    const valid = (item: unknown): item is Attempt => !!item && typeof item === 'object' && 'questionId' in item && typeof item.questionId === 'string' && 'answer' in item && Array.isArray(item.answer) && item.answer.every(value => typeof value === 'string') && 'correct' in item && typeof item.correct === 'boolean' && 'mode' in item && (item.mode === 'learn' || item.mode === 'exam') && 'timestamp' in item && typeof item.timestamp === 'string' && Number.isFinite(Date.parse(item.timestamp)) && 'version' in item && item.version === 1
    return data.records.every(valid) ? data.records : null
  } catch { return null }
}

export function loadAttempts(): Attempt[] | null {
  try { return parseAttemptHistory(localStorage.getItem(attemptStorageKey)) } catch { return null }
}

export function appendAttempts(next: readonly Attempt[]): boolean {
  try {
    const current = parseAttemptHistory(localStorage.getItem(attemptStorageKey))
    if (!current) return false
    localStorage.setItem(attemptStorageKey, serializeAttemptHistory([...current, ...next].slice(-500)))
    return true
  } catch { return false }
}

export function deleteWrongAttempts(questionId: string): boolean {
  try {
    const current = parseAttemptHistory(localStorage.getItem(attemptStorageKey))
    if (!current) return false
    localStorage.setItem(attemptStorageKey, serializeAttemptHistory(current.filter(row => row.questionId !== questionId || row.correct)))
    return true
  } catch { return false }
}
