const read = <T,>(key: string, fallback: T): T => {
  try { const saved = localStorage.getItem(key); return saved === null ? fallback : JSON.parse(saved) as T } catch { return fallback }
}
export const savedTheme = (): 'light' | 'dark' => read<'light'|'dark'>('datastruct-theme','light') === 'dark' ? 'dark' : 'light'
export const savedCompleted = (): string[] => {
  const value = read<unknown>('datastruct-completed',[])
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []
}
const validLegacy = (key: string, value: unknown) => key === 'datastruct-theme' ? value === 'light' || value === 'dark' : key === 'datastruct-completed' ? Array.isArray(value) && value.every(id => typeof id === 'string') : true
export const legacyStorageHealthy = () => { try { return ['datastruct-theme', 'datastruct-completed'].every(key => { const raw = localStorage.getItem(key); return raw === null || validLegacy(key, JSON.parse(raw)) }) } catch { return false } }
export const save = (key: string, value: unknown): boolean => { try { const raw = localStorage.getItem(key); if (!validLegacy(key, value) || raw !== null && !validLegacy(key, JSON.parse(raw))) return false; localStorage.setItem(key,JSON.stringify(value)); return true } catch { return false } }
