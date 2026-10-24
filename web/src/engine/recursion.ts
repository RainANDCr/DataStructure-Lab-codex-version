import type { ExecutionStep, OperationType } from './types'

export type RecursionCase = 'factorial' | 'preorder' | 'inorder' | 'postorder' | 'quick' | 'merge' | 'dfs'
export type Value = number | string
export type CallStatus = 'pending' | 'active' | 'waiting' | 'completed'
export type CallNode = { id: string; parentId?: string; name: string; args: Record<string, Value>; depth: number; status: CallStatus; result?: Value }
export type StackFrame = { id: string; name: string; args: Record<string, Value>; locals: Record<string, Value>; line: number; depth: number; result?: Value }
export type RecursionState = { values: number[]; active: number[]; output: number[]; calls: CallNode[]; frames: StackFrame[]; maxDepth: number; note: string }

const walkCode = (order: 'pre' | 'in' | 'post') => [
  'void walk(int i) {',
  '  if (i >= n) return;',
  ...(order === 'pre' ? ['  visit(a[i]);'] : []),
  '  walk(2 * i + 1);',
  ...(order === 'in' ? ['  visit(a[i]);'] : []),
  '  walk(2 * i + 2);',
  ...(order === 'post' ? ['  visit(a[i]);'] : []),
  '}',
]

export const recursionCases: Record<RecursionCase, { title: string; input: string; hint: string; code: string[] }> = {
  factorial: { title: '阶乘', input: '5', hint: '输入 0–8 的整数 n。递归出口是 n <= 1。', code: ['int fact(int n) {', '  if (n <= 1) return 1;', '  int child = fact(n - 1);', '  int result = n * child;', '  return result;', '}'] },
  preorder: { title: '二叉树前序', input: '8, 4, 12, 2, 6, 10, 14', hint: '按层序输入最多 15 个节点；前序为根、左、右。', code: walkCode('pre') },
  inorder: { title: '二叉树中序', input: '8, 4, 12, 2, 6, 10, 14', hint: '按层序输入最多 15 个节点；中序为左、根、右。', code: walkCode('in') },
  postorder: { title: '二叉树后序', input: '8, 4, 12, 2, 6, 10, 14', hint: '按层序输入最多 15 个节点；后序为左、右、根。', code: walkCode('post') },
  quick: { title: '快速排序', input: '8, 4, 12, 2, 6, 10, 14', hint: '最多 8 个整数；以区间末元素为枢轴，递归处理两侧。', code: ['void quick(int l, int r) {', '  if (l >= r) return;', '  int pivot = a[r], i = l;', '  for (int j = l; j < r; j++)', '    if (a[j] <= pivot) { swap(&a[i], &a[j]); i++; }', '  swap(&a[i], &a[r]);', '  quick(l, i - 1);', '  quick(i + 1, r);', '}'] },
  merge: { title: '归并排序', input: '8, 4, 12, 2, 6, 10, 14', hint: '最多 8 个整数；先递归拆分，再合并有序子区间。', code: ['void mergeSort(int l, int r) {', '  if (l >= r) return;', '  int mid = (l + r) / 2;', '  mergeSort(l, mid);', '  mergeSort(mid + 1, r);', '  merge(a, l, mid, r);', '}'] },
  dfs: { title: '递归 DFS', input: '0, 1, 2, 3, 4, 5', hint: '最多 8 个不重复节点；示例图含回边，visited 防止重复递归。', code: ['void dfs(int u) {', '  if (visited[u]) return;', '  visited[u] = 1; visit(a[u]);', '  for (int k = 0; k < degree[u]; k++) {', '    int v = neighbors[u][k]; if (!visited[v]) dfs(v);', '  }', '}'] },
}

export function parseRecursionInput(kind: RecursionCase, raw: string): number[] {
  if (!raw.trim()) throw new Error('请输入数据。')
  if (!/^-?\d+(?:[\s,]+-?\d+)*[\s,]*$/.test(raw.trim())) throw new Error('请用逗号或空格分隔整数。')
  const values = raw.trim().split(/[\s,]+/).filter(Boolean).map(Number)
  const max = kind === 'factorial' ? 1 : kind === 'preorder' || kind === 'inorder' || kind === 'postorder' ? 15 : 8
  if (values.length > max || values.some(value => !Number.isSafeInteger(value) || Math.abs(value) > 99)) throw new Error(`最多输入 ${max} 个 -99 至 99 的整数。`)
  if (kind === 'factorial' && (values.length !== 1 || values[0] < 0 || values[0] > 8)) throw new Error('阶乘 n 必须是 0–8 的整数。')
  if (kind === 'dfs' && new Set(values).size !== values.length) throw new Error('DFS 节点值不能重复。')
  return values
}

export function generateRecursionSteps(kind: RecursionCase, input: number[]): ExecutionStep<RecursionState>[] {
  const values = [...input], output: number[] = [], calls: CallNode[] = [], frames: StackFrame[] = [], active: number[] = []
  const steps: ExecutionStep<RecursionState>[] = []
  let maxDepth = 0, nextId = 0, note = '准备开始', visits = 0, writes = 0, comparisons = 0, swaps = 0
  const code = recursionCases[kind].code
  const record = (type: OperationType, description: string, line: number, elements: number[] = []) => {
    if (steps.length >= 600) throw new Error('执行步骤超过 600 步，请缩小输入。')
    note = description
    const state: RecursionState = structuredClone({ values, active, output, calls, frames, maxDepth, note })
    const sourceMap = { codeVersion: `${kind}-c-v1`, lines: { C: [line], 'C++': [line] } }
    const stepIndex = steps.length
    steps.push({ id: `${kind}-${stepIndex}`, stepId: `${kind}-${stepIndex}`, stepIndex, algorithmId: `recursion-${kind}`, description, phase: type, state, highlightedElements: elements.map(String), highlightedLines: sourceMap.lines, variables: { depth: frames.length, maxDepth, calls: calls.length, output: output.join(' → ') }, operations: [{ type, elements: elements.map(String) }], metrics: { comparisons, swaps, reads: 0, writes, visits }, sourceMap, callStack: frames.map(frame => ({ name: frame.name, variables: { ...frame.args, ...frame.locals } })) })
  }
  const open = (name: string, args: Record<string, Value>, parent: string | undefined, line: number) => {
    if (frames.length >= 18) throw new Error('递归深度超过 18 层。')
    const id = `call-${nextId++}`, depth = frames.length
    calls.push({ id, parentId: parent, name, args: { ...args }, depth, status: 'pending' })
    if (parent) { calls.find(node => node.id === parent)!.status = 'waiting'; record('RECURSE', `调用 ${name}(${Object.values(args).join(', ')})，父函数等待返回。`, frames.at(-1)!.line) }
    calls.at(-1)!.status = 'active'
    frames.push({ id, name, args: { ...args }, locals: {}, line, depth })
    if ((kind === 'preorder' || kind === 'inorder' || kind === 'postorder') && typeof args.i === 'number' && args.i < values.length) active.splice(0, active.length, args.i)
    maxDepth = Math.max(maxDepth, frames.length)
    record('CALL', `进入 ${name}(${Object.values(args).join(', ')})，深度 ${frames.length}。`, line)
    record('PARAM_BIND', `绑定参数：${Object.entries(args).map(([key, value]) => `${key}=${value}`).join('，')}。`, line)
    return id
  }
  const update = (line: number, description: string, locals: Record<string, Value> = {}, elements: number[] = [], type: OperationType = 'LOCAL_UPDATE') => {
    Object.assign(frames.at(-1)!.locals, locals)
    frames.at(-1)!.line = line
    record(type, description, line, elements)
  }
  const close = (id: string, result: Value, line: number) => {
    const frame = frames.at(-1)!
    frame.line = line; frame.result = result
    const node = calls.find(item => item.id === id)!
    node.result = result; node.status = 'completed'
    record('RETURN', `${frame.name} 返回 ${result}。`, line)
    frames.pop()
    if (frames.length) calls.find(item => item.id === frames.at(-1)!.id)!.status = 'active'
    if (kind === 'preorder' || kind === 'inorder' || kind === 'postorder') {
      active.length = 0
      const parentIndex = frames.at(-1)?.args.i
      if (typeof parentIndex === 'number' && parentIndex < values.length) active.push(parentIndex)
    }
    record('FRAME_POP', `弹出 ${frame.name} 的栈帧，${frames.length ? '回到父函数。' : '调用结束。'}`, frames.at(-1)?.line ?? line)
  }
  record('READY', '从时间轴开始观察函数调用、返回与数据变化。', 1)

  if (kind === 'factorial') {
    const fact = (n: number, parent?: string): number => {
      const id = open('fact', { n }, parent, 1)
      if (n <= 1) { update(2, '到达递归出口，直接返回 1。', { base: 1 }); close(id, 1, 2); return 1 }
      update(3, `准备计算 fact(${n - 1})。`, { child: '?' })
      const child = fact(n - 1, id), result = n * child
      update(4, `子调用返回 ${child}，计算 ${n} × ${child} = ${result}。`, { child, result })
      close(id, result, 5)
      return result
    }
    fact(values[0])
  } else if (kind === 'preorder' || kind === 'inorder' || kind === 'postorder') {
    const visitLine = kind === 'preorder' ? 3 : kind === 'inorder' ? 4 : 5
    const leftLine = kind === 'preorder' ? 4 : 3
    const rightLine = kind === 'postorder' ? 4 : 5
    const visit = (i: number) => { output.push(values[i]); visits++; update(visitLine, `访问节点 ${values[i]}，输出序列增加一个元素。`, { i }, [i], 'VISIT') }
    const walk = (i: number, parent?: string) => {
      const id = open('walk', { i }, parent, 1)
      if (i >= values.length) { update(2, `位置 ${i} 为空，到达递归出口。`, { empty: 1 }); close(id, 'void', 2); return }
      active.splice(0, active.length, i)
      update(2, `当前位于节点 ${values[i]}。`, { value: values[i] }, [i])
      if (kind === 'preorder') visit(i)
      update(leftLine, `展开节点 ${values[i]} 的左子树。`, {}, [i]); walk(2 * i + 1, id)
      if (kind === 'inorder') visit(i)
      update(rightLine, `展开节点 ${values[i]} 的右子树。`, {}, [i]); walk(2 * i + 2, id)
      if (kind === 'postorder') visit(i)
      close(id, 'void', code.length - 1)
    }
    walk(0)
  } else if (kind === 'quick') {
    const quick = (l: number, r: number, parent?: string) => {
      const id = open('quick', { l, r }, parent, 1)
      if (l >= r) { update(2, `区间 [${l}, ${r}] 长度不超过 1，递归返回。`, { base: 1 }); close(id, 'void', 2); return }
      let i = l; const pivot = values[r]
      update(3, `选末元素 ${pivot} 为枢轴。`, { pivot, i }, [r])
      for (let j = l; j < r; j++) {
        comparisons++; update(4, `比较 ${values[j]} 与枢轴 ${pivot}。`, { j, i }, [j, r], 'COMPARE')
        if (values[j] <= pivot) { const oldI = i; [values[i], values[j]] = [values[j], values[i]]; i++; swaps++; writes += 2; update(5, `将 ${values[oldI]} 放入左分区，边界移到 ${i}。`, { i, j }, [oldI, j], 'SWAP') }
      }
      [values[i], values[r]] = [values[r], values[i]]; swaps++; writes += 2
      update(6, `枢轴 ${pivot} 落在位置 ${i}。`, { i }, [i, r], 'SWAP')
      update(7, `递归处理左区间 [${l}, ${i - 1}]。`); quick(l, i - 1, id)
      update(8, `递归处理右区间 [${i + 1}, ${r}]。`); quick(i + 1, r, id)
      close(id, 'void', 9)
    }
    quick(0, values.length - 1)
  } else if (kind === 'merge') {
    const mergeSort = (l: number, r: number, parent?: string) => {
      const id = open('mergeSort', { l, r }, parent, 1)
      if (l >= r) { update(2, `区间 [${l}, ${r}] 无需拆分。`, { base: 1 }); close(id, 'void', 2); return }
      const mid = Math.floor((l + r) / 2)
      update(3, `从 ${mid} 拆为两个子区间。`, { mid })
      update(4, `递归排序左半区间。`); mergeSort(l, mid, id)
      update(5, `递归排序右半区间。`); mergeSort(mid + 1, r, id)
      const merged: number[] = []; let i = l, j = mid + 1
      while (i <= mid && j <= r) { comparisons++; merged.push(values[i] <= values[j] ? values[i++] : values[j++]) }
      while (i <= mid) merged.push(values[i++])
      while (j <= r) merged.push(values[j++])
      values.splice(l, merged.length, ...merged); writes += merged.length
      update(6, `合并区间 [${l}, ${r}]：${merged.join('，')}。`, { merged: merged.join(',') }, Array.from({ length: merged.length }, (_, k) => l + k), 'WRITE')
      close(id, 'void', 7)
    }
    mergeSort(0, values.length - 1)
  } else {
    const visited = new Set<number>()
    const neighbors = (u: number) => [2 * u + 1, 2 * u + 2, u > 0 ? Math.floor((u - 1) / 2) : -1].filter(v => v >= 0 && v < values.length)
    const dfs = (u: number, parent?: string) => {
      const id = open('dfs', { u }, parent, 1)
      if (visited.has(u)) { update(2, `节点 ${values[u]} 已访问，递归返回。`, { visited: 1 }, [u]); close(id, 'void', 2); return }
      visited.add(u); output.push(values[u]); visits++
      update(3, `标记并访问节点 ${values[u]}。`, { value: values[u] }, [u], 'VISIT')
      for (const v of neighbors(u)) { update(4, `检查 ${values[u]} 的邻居 ${values[v]}。`, { v }, [u, v]); if (!visited.has(v)) { update(5, `邻居 ${values[v]} 未访问，递归深入。`, { v }, [v]); dfs(v, id) } }
      close(id, 'void', 7)
    }
    if (values.length) dfs(0)
  }
  active.length = 0
  record('DONE', `演示结束。${output.length ? `输出：${output.join(' → ')}。` : kind === 'factorial' ? `结果：${calls[0].result}。` : ''}`, code.length)
  return steps
}
