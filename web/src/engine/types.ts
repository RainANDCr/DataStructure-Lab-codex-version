export interface AlgorithmStep<TState> {
  id: string
  description: string
  state: TState
  highlightedElements: string[]
  highlightedLines: Record<string, number[]>
  variables?: Record<string, string | number | boolean>
  duration?: number
}

export type OperationType = 'COMPARE' | 'SWAP' | 'READ' | 'WRITE' | 'INSERT' | 'DELETE' | 'VISIT' | 'POINTER_UPDATE' | 'PUSH' | 'POP' | 'ENQUEUE' | 'DEQUEUE' | (string & {})
export type OperationEvent = { type: OperationType; elements?: string[]; details?: Record<string, string | number | boolean> }
export type ExecutionMetrics = { comparisons: number; swaps: number; reads: number; writes: number; visits: number }
export type SourceMap = { codeVersion: string; lines: Record<string, number[]> }

export interface ExecutionStep<TState> extends AlgorithmStep<TState> {
  stepId: string
  stepIndex: number
  algorithmId: string
  phase: string
  variables: Record<string, string | number | boolean>
  operations: OperationEvent[]
  metrics: ExecutionMetrics
  sourceMap: SourceMap
  callStack?: { name: string; variables: Record<string, string | number | boolean> }[]
  memoryState?: { address: string; value: string | number | boolean | null }[]
}

export interface AlgorithmModule<TInput, TState> {
  id: string
  generate(input: TInput): readonly AlgorithmStep<TState>[]
}
