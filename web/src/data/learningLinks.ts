export function withLearningContext(path: string, pointId?: string, mode?: 'course' | '408') {
  const params = new URLSearchParams()
  if (pointId) params.set('point', pointId)
  if (mode) params.set('mode', mode)
  return params.size ? `${path}?${params}` : path
}
