import { useEffect, useState, useSyncExternalStore } from 'react'
import type { AlgorithmStep } from '../engine/types'
import { Timeline } from '../engine/timeline'

export function useTimeline<TStep extends AlgorithmStep<unknown>>(initialSteps: readonly TStep[]) {
  const [timeline] = useState(() => new Timeline(initialSteps))
  const snapshot = useSyncExternalStore(timeline.subscribe, timeline.getSnapshot, timeline.getSnapshot)
  useEffect(() => () => timeline.dispose(), [timeline])
  return { timeline, ...snapshot }
}
