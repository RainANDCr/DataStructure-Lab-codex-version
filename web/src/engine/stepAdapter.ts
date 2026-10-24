import type { AlgorithmStep, ExecutionMetrics, ExecutionStep } from './types'

const count = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : 0

/** Preserve legacy step ids and line numbers while making each snapshot independent. */
export function toExecutionSteps<TState>(algorithmId: string, steps: readonly AlgorithmStep<TState>[]): ExecutionStep<TState>[] {
  return steps.map((step, stepIndex) => {
    const enhanced = step as AlgorithmStep<TState> & Partial<ExecutionStep<TState>>
    const state = structuredClone(step.state)
    const legacy = state as { comparisons?: unknown; writes?: unknown }
    const metrics: ExecutionMetrics = {
      comparisons: count(legacy.comparisons), swaps: 0, reads: 0,
      writes: count(legacy.writes), visits: 0,
      ...stepMetrics(step),
    }
    const highlightedLines = structuredClone(step.highlightedLines)
    return {
      ...step,
      state,
      highlightedElements: [...step.highlightedElements],
      highlightedLines,
      variables: { ...step.variables },
      stepId: enhanced.stepId ?? step.id,
      stepIndex,
      algorithmId,
      phase: enhanced.phase ?? 'legacy',
      operations: structuredClone(enhanced.operations ?? []),
      metrics,
      sourceMap: structuredClone(enhanced.sourceMap ?? { codeVersion: 'builtin-v1', lines: { C: [...(highlightedLines.C ?? [])], 'C++': [...(highlightedLines['C++'] ?? [])] } }),
      callStack: enhanced.callStack ? structuredClone(enhanced.callStack) : undefined,
      memoryState: enhanced.memoryState ? structuredClone(enhanced.memoryState) : undefined,
    }
  })
}

function stepMetrics<TState>(step: AlgorithmStep<TState>): Partial<ExecutionMetrics> {
  const candidate = step as AlgorithmStep<TState> & { metrics?: Partial<ExecutionMetrics> }
  return candidate.metrics ?? {}
}
