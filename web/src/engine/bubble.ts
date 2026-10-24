import type { AlgorithmModule, ExecutionStep, OperationEvent } from './types'

export type BubbleState = { values: number[]; done: number[]; comparisons: number; writes: number; temp?: (number | null)[]; heapSize?: number; buckets?: number[][] }
export type BubbleLanguage = 'C' | 'C++' | 'Python'

const taggedCode: Record<BubbleLanguage, string> = {
  C: `init|void bubble(int a[], int n) {
outer|  for (int i = 0; i < n - 1; i++) {
outer|    for (int j = 0; j < n - 1 - i; j++) {
compare|      if (a[j] > a[j + 1]) {
swap|        int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
end|      }
outer|    }
outer|  }
done|}`,
  'C++': `init|void bubble(vector<int>& a) {
init|  int n = static_cast<int>(a.size());
outer|  for (int i = 0; i < n - 1; ++i) {
outer|    for (int j = 0; j < n - 1 - i; ++j) {
compare|      if (a[j] > a[j + 1]) {
swap|        swap(a[j], a[j + 1]);
end|      }
outer|    }
outer|  }
done|}`,
  Python: `init|def bubble(a):
outer|    for i in range(len(a) - 1):
outer|        for j in range(len(a) - 1 - i):
compare|            if a[j] > a[j + 1]:
swap|                a[j], a[j + 1] = a[j + 1], a[j]
done|    return a`,
}

const languages: BubbleLanguage[] = ['C', 'C++', 'Python']
const taggedRows = Object.fromEntries(languages.map(language => [language, taggedCode[language].split('\n').map(row => {
  const separator = row.indexOf('|')
  return { tag: row.slice(0, separator), text: row.slice(separator + 1) }
})])) as Record<BubbleLanguage, { tag: string; text: string }[]>
export const bubbleCode = Object.fromEntries(languages.map(language => [language, taggedRows[language].map(row => row.text)])) as Record<BubbleLanguage, string[]>

export function parseBubbleInput(text: string): number[] {
  if (!text.trim()) return []
  const parts = text.trim().split(/[\s,，]+/)
  if (parts.length > 16 || parts.some(part => !/^-?\d+$/.test(part) || !Number.isSafeInteger(Number(part)) || Math.abs(Number(part)) > 99)) {
    throw new Error('请输入最多 16 个 -99 至 99 的整数，用逗号或空格分隔。')
  }
  return parts.map(Number)
}

export function playbackDelay(duration: number, speed: number): number {
  if (!Number.isFinite(speed) || speed <= 0) throw new Error('播放速度必须大于 0。')
  return Math.round(duration / speed)
}

export const bubbleSort: AlgorithmModule<readonly number[], BubbleState> & { generate(input: readonly number[]): ExecutionStep<BubbleState>[] } = {
  id: 'bubble',
  generate(input) {
    if (!Array.isArray(input) || input.length > 16 || Array.from(input).some(value => !Number.isInteger(value) || Math.abs(value) > 99)) {
      throw new Error('数据必须是最多 16 个 -99 至 99 的整数。')
    }
    const values = [...input]
    const done: number[] = []
    const steps: ExecutionStep<BubbleState>[] = []
    let comparisons = 0
    let writes = 0
    let swaps = 0
    let reads = 0
    const emit = (tag: string, description: string, active: number[] = [], variables: Record<string, number> = {}, operations: OperationEvent[] = []) => {
      for (const operation of operations) {
        if (operation.type === 'COMPARE') { comparisons++; reads += 2 }
        if (operation.type === 'SWAP') { swaps++; reads += 2; writes += 2 }
      }
      const stepIndex = steps.length
      const highlightedLines = Object.fromEntries(languages.map(language => [language, taggedRows[language].flatMap((row, index) => row.tag === tag ? [index + 1] : [])])) as Record<string, number[]>
      steps.push({
        id: `${tag}-${stepIndex}`,
        stepId: `${tag}-${stepIndex}`,
        stepIndex,
        algorithmId: 'bubble',
        description,
        phase: tag === 'init' ? '初始化' : tag === 'outer' ? '逐轮扫描' : tag === 'compare' ? '比较' : tag === 'swap' ? '交换' : '完成',
        state: { values: [...values], done: [...done], comparisons, writes },
        highlightedElements: active.map(String),
        highlightedLines,
        variables: { n: values.length, comparisonCount: comparisons, ...variables },
        operations,
        metrics: { comparisons, swaps, reads, writes, visits: 0 },
        sourceMap: { codeVersion: 'builtin-bubble-v1', lines: { C: [...highlightedLines.C], 'C++': [...highlightedLines['C++']] } },
        duration: 800,
      })
    }
    emit('init', '数据已就绪。点击下一步，或播放完整过程。')
    for (let i = 0; i < values.length - 1; i++) {
      emit('outer', `第 ${i + 1} 轮：把未排序部分的最大值逐步移到右侧。`, [], { i })
      for (let j = 0; j < values.length - 1 - i; j++) {
        emit('compare', `比较 a[${j}] = ${values[j]} 与 a[${j + 1}] = ${values[j + 1]}。`, [j, j + 1], { i, j }, [{ type: 'COMPARE', elements: [String(j), String(j + 1)], details: { left: values[j], right: values[j + 1] } }])
        if (values[j] > values[j + 1]) {
          const temp = values[j]
          ;[values[j], values[j + 1]] = [values[j + 1], values[j]]
          emit('swap', '左边较大，交换这两个元素的位置。', [j, j + 1], { i, j, temp }, [{ type: 'SWAP', elements: [String(j), String(j + 1)] }])
        }
      }
      done.push(values.length - 1 - i)
      emit('outer', '本轮结束，右侧又有一个元素到达最终位置。', [], { i })
    }
    if (values.length) done.push(0)
    emit('done', values.length ? '排序完成，所有元素已到达最终位置。' : '排序完成：空数组无需比较。')
    return steps
  },
}
