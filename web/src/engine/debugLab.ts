import { bubbleCode, bubbleSort, parseBubbleInput } from './bubble'
import { generateMemorySteps, memoryScenarios, type MemoryScenario, type MemorySnapshot } from './memorySimulator'
import { toExecutionSteps } from './stepAdapter'
import { topicDefaults, topicRun } from './topics'
import type { ExecutionStep, OperationType } from './types'

export type DebugState = { values: number[]; active: number[]; output: (number | string)[]; memory?: MemorySnapshot; warning?: string }
export type DebugStep = ExecutionStep<DebugState>
export type TraceExample = 'bubble' | 'binary'
export type ErrorCaseId = 'linkedInsert' | 'useAfterFree' | 'stackBounds' | 'circularQueue' | 'binaryBoundary' | 'bubbleRange' | 'quickRange' | 'dfsVisited' | 'missingBase' | 'arrayBounds'
type Frame = { line: number; description: string; values: number[]; active?: number[]; output?: (number | string)[]; variables?: Record<string, string | number | boolean>; operation?: OperationType; warning?: string }
export type ErrorCase = { caseId: ErrorCaseId; algorithmId: string; title: string; sourceCode: { C: string[]; 'C++': string[] }; input: string; expectedBehavior: string; faultyBehavior: string; explanation: string; checkpoints: { line: number; reason: string }[]; tags: string[]; difficulty: '基础' | '进阶'; fixedCode: string[]; fixedCodeCpp?: string[]; question: string; answer: boolean; frames?: Frame[]; memoryScenario?: MemoryScenario }

const code = (lines: string[]) => ({ C: lines, 'C++': lines })
export const traceExamples: Record<TraceExample, { title: string; input: string; hint: string }> = {
  bubble: { title: '冒泡排序', input: '5, 2, 4, 1', hint: '最多 16 个 -99 至 99 的整数；允许空输入与重复值。' },
  binary: { title: '折半查找', input: topicDefaults.binary.input, hint: '升序整数；目标值固定为 42，可观察边界更新。' },
}

function normalize<T extends { values: (number | string)[]; active?: number[]; done?: number[]; output?: (number | string)[] }>(steps: ExecutionStep<T>[]): DebugStep[] {
  return steps.map(step => ({ ...step, state: { values: step.state.values.map(Number), active: step.state.active ?? step.highlightedElements.map(Number).filter(Number.isFinite), output: step.state.output ?? [] } }))
}

export function traceExample(example: TraceExample, raw: string): { code: { C: string[]; 'C++': string[] }; steps: DebugStep[] } {
  if (example === 'bubble') return { code: bubbleCode, steps: normalize(toExecutionSteps('bubble', bubbleSort.generate(parseBubbleInput(raw)))) }
  const run = topicRun('binary', raw, { target: 42 })
  return { code: run.code, steps: normalize(toExecutionSteps('binary', run.steps)) }
}

export const errorCases: Record<ErrorCaseId, ErrorCase> = {
  linkedInsert: { caseId: 'linkedInsert', algorithmId: 'linked', title: '单链表插入顺序错误', sourceCode: code(['Node *fresh = make_node(20);', 'head->next = fresh;', 'fresh->next = head->next;']), input: '10 → 30，插入 20', expectedBehavior: '10 → 20 → 30', faultyBehavior: '10 → 20 → 20 → …，30 失去可达路径', explanation: '先覆盖 head->next，原后继 30 的唯一入口丢失；随后 fresh->next 指向自身。应先保存旧后继，再连接前驱。', checkpoints: [{ line: 2, reason: '覆盖原后继引用' }, { line: 3, reason: '形成自环' }], tags: ['链表', '指针'], difficulty: '基础', fixedCode: ['fresh->next = head->next;', 'head->next = fresh;'], question: '执行第 3 行后，fresh->next 会指向 fresh 自身吗？', answer: true, frames: [
    { line: 1, description: '原链表为 10 → 30；分配新节点 20。', values: [10, 30], variables: { headNext: 30, freshNext: 'NULL' } },
    { line: 2, description: '错误：head->next 改指 20，原节点 30 暂时不可达。', values: [10, 20], variables: { headNext: 20, freshNext: 'NULL' }, operation: 'POINTER_UPDATE', warning: '节点 30 失去从 head 出发的可达路径。' },
    { line: 3, description: 'fresh->next 读取刚更新的 head->next，指向 fresh 自己。', values: [10, 20], variables: { headNext: 20, freshNext: 20 }, operation: 'POINTER_UPDATE', warning: '形成自环；遍历时不能继续到原节点 30。' },
  ] },
  useAfterFree: { caseId: 'useAfterFree', algorithmId: 'linked', title: '删除后使用已释放节点', sourceCode: memoryScenarios.useAfterFree.code, input: 'p 指向值 10 的堆节点', expectedBehavior: '释放后不再解引用 p，并置为空指针', faultyBehavior: 'p 仍保存旧地址，后续访问属于未定义行为', explanation: 'free/delete 结束对象生命周期；模拟器仅展示悬空状态，不执行访问。', checkpoints: [{ line: 3, reason: '试图访问已释放对象' }], tags: ['内存', '链表'], difficulty: '基础', fixedCode: ['free(p);', 'p = NULL;'], fixedCodeCpp: ['delete p;', 'p = nullptr;'], question: '释放对象后，p 仍保存旧地址就意味着可以安全读取它吗？', answer: false, memoryScenario: 'useAfterFree' },
  stackBounds: { caseId: 'stackBounds', algorithmId: 'stack', title: '栈下溢与上溢', sourceCode: code(['int stack[2], top = -1;', 'int x = stack[top--];', 'stack[++top] = 7;', 'stack[++top] = 8;', 'stack[++top] = 9;']), input: '容量 2 的空栈', expectedBehavior: '弹出前判空，压入前判满', faultyBehavior: '空栈弹出越界；第三次压入越界', explanation: '合法 top 范围为 -1 到 capacity-1；访问前必须检查边界。', checkpoints: [{ line: 2, reason: '空栈下溢' }, { line: 5, reason: '容量已满' }], tags: ['栈', '边界'], difficulty: '基础', fixedCode: ['if (top >= 0) x = stack[top--];', 'if (top + 1 < 2) stack[++top] = value;'], question: 'top 为 -1 时执行 stack[top--] 是合法出栈吗？', answer: false, frames: [
    { line: 1, description: '空栈，top = -1。', values: [], variables: { top: -1, capacity: 2 } },
    { line: 2, description: '模拟下溢：下标 -1 非法，阻止实际读取。', values: [], variables: { top: -1, capacity: 2 }, warning: '空栈不能弹出。' },
    { line: 3, description: '压入 7。', values: [7], variables: { top: 0, capacity: 2 }, operation: 'PUSH' },
    { line: 4, description: '压入 8，栈已满。', values: [7, 8], variables: { top: 1, capacity: 2 }, operation: 'PUSH' },
    { line: 5, description: '模拟上溢：容量仅 2，阻止第三次写入。', values: [7, 8], variables: { top: 1, capacity: 2 }, warning: '写入下标 2 将越界。' },
  ] },
  circularQueue: { caseId: 'circularQueue', algorithmId: 'circularQueue', title: '循环队列队头队尾错误', sourceCode: code(['int q[3], front = 0, rear = 0;', 'q[rear] = 4; rear = (rear + 1) % 3;', 'q[rear] = 5; rear = (rear + 1) % 3;', 'q[rear] = 6; rear = (rear + 1) % 3;']), input: '容量 3，牺牲一个槽位的循环队列', expectedBehavior: '第三次入队前判满：(rear+1)%3 == front', faultyBehavior: '第三次入队使 rear == front，被误判为空队列', explanation: '牺牲一格区分队满与队空；若不判满，写入第三项后两个指针重合。', checkpoints: [{ line: 4, reason: '入队前未检查队满' }], tags: ['队列', '边界'], difficulty: '进阶', fixedCode: ['if ((rear + 1) % 3 != front) { q[rear] = x; rear = (rear + 1) % 3; }'], question: '采用牺牲一格方案时，容量 3 的队列能同时容纳 3 项吗？', answer: false, frames: [
    { line: 1, description: 'front 与 rear 均为 0，队列为空。', values: [], variables: { front: 0, rear: 0 } },
    { line: 2, description: '4 入队，rear 移到 1。', values: [4], variables: { front: 0, rear: 1 }, operation: 'ENQUEUE' },
    { line: 3, description: '5 入队，rear 移到 2，队列已满。', values: [4, 5], variables: { front: 0, rear: 2 }, operation: 'ENQUEUE' },
    { line: 4, description: '错误：继续把 6 写入第 3 个槽位，rear 回到 0，与 front 重合。', values: [4, 5, 6], variables: { front: 0, rear: 0 }, operation: 'ENQUEUE', warning: '三个槽位都已占用，却会被判作空队列。' },
  ] },
  binaryBoundary: { caseId: 'binaryBoundary', algorithmId: 'binary', title: '折半查找边界条件错误', sourceCode: code(['int low = 0, high = n - 1;', 'while (low < high) {', '  int mid = low + (high - low) / 2;', '  if (a[mid] < target) low = mid + 1;', '  else high = mid - 1;', '}']), input: '[2, 4, 6]，查找 6', expectedBehavior: '检查最后一个候选位置 2，找到 6', faultyBehavior: 'low == high 时循环提前结束，漏查最后位置', explanation: '闭区间 [low, high] 仍含 low == high 这一个候选；循环条件应为 low <= high，并单独处理相等。', checkpoints: [{ line: 2, reason: '等号缺失导致漏查' }], tags: ['折半查找', '边界'], difficulty: '基础', fixedCode: ['while (low <= high) {', '  int mid = low + (high - low) / 2;', '  if (a[mid] == target) return mid;', '  if (a[mid] < target) low = mid + 1; else high = mid - 1;', '}'], question: '闭区间中 low == high 时，仍有一个候选元素需要检查吗？', answer: true, frames: [
    { line: 1, description: '初始候选区间 [0,2]。', values: [2, 4, 6], variables: { low: 0, high: 2, target: 6 } },
    { line: 3, description: 'mid=1，a[1]=4 小于 6。', values: [2, 4, 6], active: [1], variables: { low: 0, high: 2, mid: 1, target: 6 }, operation: 'COMPARE' },
    { line: 4, description: 'low 更新为 2；位置 2 仍是候选。', values: [2, 4, 6], active: [2], variables: { low: 2, high: 2, target: 6 } },
    { line: 2, description: '错误：2 < 2 为假，退出循环，漏查 a[2]=6。', values: [2, 4, 6], active: [2], variables: { low: 2, high: 2, target: 6 }, warning: '目标存在，却返回未找到。' },
  ] },
  bubbleRange: { caseId: 'bubbleRange', algorithmId: 'bubble', title: '冒泡排序循环范围错误', sourceCode: code(['for (int i = 0; i < n - 1; i++)', '  for (int j = 0; j < n - 2 - i; j++)', '    if (a[j] > a[j+1]) swap(&a[j], &a[j+1]);']), input: '[2, 1]', expectedBehavior: '比较并交换，得到 [1,2]', faultyBehavior: '内层循环零次，输出仍为 [2,1]', explanation: '内层应扫描到 j < n-1-i；少一次会漏掉本轮最右侧相邻对。', checkpoints: [{ line: 2, reason: '循环上界少 1' }], tags: ['冒泡排序', '边界'], difficulty: '基础', fixedCode: ['for (int j = 0; j < n - 1 - i; j++)'], question: '输入 [2,1] 时，错误代码的内层循环会执行一次吗？', answer: false, frames: [
    { line: 1, description: '开始第 0 轮，数组为 [2,1]。', values: [2, 1], variables: { i: 0, n: 2 } },
    { line: 2, description: 'j < 0 不成立，内层循环不执行。', values: [2, 1], variables: { i: 0, j: 0, n: 2 }, warning: '遗漏相邻对 (2,1)。' },
    { line: 3, description: '没有比较或交换，结果仍未排序。', values: [2, 1], warning: '预期 [1,2]。' },
  ] },
  quickRange: { caseId: 'quickRange', algorithmId: 'quick', title: '快速排序递归区间错误', sourceCode: code(['int p = partition(a, l, r);', 'quick(a, l, p);', 'quick(a, p + 1, r);']), input: '[1,2]，枢轴下标 p=1', expectedBehavior: '排除枢轴，左侧递归 [l,p-1]', faultyBehavior: '左递归区间 [0,1] 未缩小，反复调用', explanation: '分区后枢轴已到最终位置；把 p 再包含进左区间可能造成无限递归。', checkpoints: [{ line: 2, reason: '左区间未排除枢轴' }], tags: ['快速排序', '递归'], difficulty: '进阶', fixedCode: ['quick(a, l, p - 1);', 'quick(a, p + 1, r);'], question: '分区后还应把枢轴 p 纳入左递归区间吗？', answer: false, frames: [
    { line: 1, description: '分区返回 p=1，当前区间 [0,1]。', values: [1, 2], variables: { l: 0, r: 1, p: 1 } },
    { line: 2, description: '错误：再次调用 [0,1]，区间没有缩小。', values: [1, 2], variables: { l: 0, r: 1, p: 1 }, warning: '检测到重复区间，停止模拟以避免无限递归。' },
  ] },
  dfsVisited: { caseId: 'dfsVisited', algorithmId: 'graph', title: 'DFS 忘记 visited', sourceCode: code(['void dfs(int u) {', '  visit(u);', '  for (int k = 0; k < degree[u]; k++) dfs(neighbors[u][k]);', '}']), input: '无向边 0 ↔ 1', expectedBehavior: '每个节点最多访问一次', faultyBehavior: '0 → 1 → 0 → 1，重复递归', explanation: '无向图有回边；进入节点时应先标记 visited，再递归未访问邻居。', checkpoints: [{ line: 3, reason: '未判断 visited 就递归' }], tags: ['图', 'DFS'], difficulty: '基础', fixedCode: ['if (visited[u]) return;', 'visited[u] = 1; visit(u);', 'for (int k = 0; k < degree[u]; k++) if (!visited[neighbors[u][k]]) dfs(neighbors[u][k]);'], question: '无向图中只靠递归出口、不记录 visited，就能避免沿回边反复进入吗？', answer: false, frames: [
    { line: 2, description: '访问节点 0。', values: [0, 1], active: [0], output: [0], variables: { u: 0 }, operation: 'VISIT' },
    { line: 3, description: '沿边进入节点 1。', values: [0, 1], active: [1], output: [0], variables: { u: 1 } },
    { line: 2, description: '访问节点 1。', values: [0, 1], active: [1], output: [0, 1], variables: { u: 1 }, operation: 'VISIT' },
    { line: 3, description: '回边重新进入节点 0，出现重复；停止模拟。', values: [0, 1], active: [0], output: [0, 1, 0], variables: { u: 0 }, warning: '无限递归风险。' },
  ] },
  missingBase: { caseId: 'missingBase', algorithmId: 'recursion', title: '递归缺少终止条件', sourceCode: code(['int f(int n) {', '  return n * f(n - 1);', '}']), input: 'n=2', expectedBehavior: 'n <= 1 时返回 1', faultyBehavior: 'n 持续减小，调用无法自然结束', explanation: '递归必须具备可达的终止条件；教学模拟在深度 4 处截断，避免实际栈溢出。', checkpoints: [{ line: 2, reason: '未写递归出口' }], tags: ['递归', '栈'], difficulty: '基础', fixedCode: ['if (n <= 1) return 1;', 'return n * f(n - 1);'], question: '每次参数减 1 就足以保证递归自动结束吗？', answer: false, frames: [
    { line: 1, description: '调用 f(2)。', values: [2], variables: { n: 2, depth: 1 } },
    { line: 2, description: '调用 f(1)，但没有检查终止条件。', values: [2, 1], variables: { n: 1, depth: 2 } },
    { line: 2, description: '继续调用 f(0)。', values: [2, 1, 0], variables: { n: 0, depth: 3 } },
    { line: 2, description: '继续调用 f(-1)，模拟器截断调用链。', values: [2, 1, 0, -1], variables: { n: -1, depth: 4 }, warning: '缺少递归出口，存在栈溢出风险。' },
  ] },
  arrayBounds: { caseId: 'arrayBounds', algorithmId: 'array', title: '数组越界访问', sourceCode: memoryScenarios.outOfBounds.code, input: 'a[3] = {10,20,30}，i=3', expectedBehavior: '访问前验证 0 <= i < 3', faultyBehavior: 'a[3] 越界，C/C++ 行为未定义', explanation: '数组长度为 3，合法下标为 0、1、2；模拟器仅提示，绝不执行越界访问。', checkpoints: [{ line: 3, reason: '下标等于长度' }], tags: ['数组', '边界'], difficulty: '基础', fixedCode: ['if (i >= 0 && i < 3) use(a[i]);'], question: '长度为 3 的数组，其最大合法下标是 2 吗？', answer: true, memoryScenario: 'outOfBounds' },
}

export function errorCaseSteps(caseId: ErrorCaseId): DebugStep[] {
  const item = errorCases[caseId]
  if (item.memoryScenario) return generateMemorySteps(item.memoryScenario).map(step => ({ ...step, algorithmId: `debug-${caseId}`, state: { values: step.state.chain.map(id => step.state.objects.find(object => object.id === id)!.value), active: [], output: [], memory: step.state, warning: step.state.warnings.at(-1) } }))
  const metrics = { comparisons: 0, swaps: 0, reads: 0, writes: 0, visits: 0 }
  return item.frames!.map((frame, stepIndex) => {
    if (frame.operation === 'COMPARE') { metrics.comparisons++; metrics.reads += 2 }
    if (frame.operation === 'SWAP') { metrics.swaps++; metrics.writes += 2 }
    if (frame.operation === 'VISIT') metrics.visits++
    if (frame.operation === 'PUSH' || frame.operation === 'ENQUEUE' || frame.operation === 'POINTER_UPDATE') metrics.writes++
    const highlightedLines = { C: [frame.line], 'C++': [frame.line] }
    return { id: `${caseId}-${stepIndex}`, stepId: `${caseId}-${stepIndex}`, stepIndex, algorithmId: `debug-${caseId}`, phase: frame.warning ? '错误位置' : '跟踪', description: frame.description, state: structuredClone({ values: frame.values, active: frame.active ?? [], output: frame.output ?? [], ...(frame.warning ? { warning: frame.warning } : {}) }), highlightedElements: (frame.active ?? []).map(String), highlightedLines, variables: { ...frame.variables }, operations: frame.operation ? [{ type: frame.operation }] : [], metrics: { ...metrics }, sourceMap: { codeVersion: `debug-${caseId}-v1`, lines: highlightedLines }, duration: 750 }
  })
}

export function nextOperation(step: DebugStep): 'COMPARE' | 'SWAP' | 'VISIT' | 'OTHER' {
  const type = step.operations[0]?.type
  if (type === 'COMPARE') return 'COMPARE'
  if (type === 'SWAP') return 'SWAP'
  if (type === 'VISIT') return 'VISIT'
  return 'OTHER'
}

export function runBubbleBoundaries() {
  const cases = [
    { title: '空输入', input: '', valid: true }, { title: '单元素', input: '7', valid: true },
    { title: '重复值', input: '3,1,3', valid: true }, { title: '全相等', input: '2,2,2', valid: true },
    { title: '正序', input: '1,2,3', valid: true }, { title: '逆序', input: '3,2,1', valid: true },
    { title: '合法极值', input: '-99,99', valid: true }, { title: '非法输入', input: '100,foo', valid: false },
  ]
  return cases.map(item => {
    try {
      const parsed = parseBubbleInput(item.input), actual = bubbleSort.generate(parsed).at(-1)!.state.values
      return { ...item, actual, passed: item.valid && JSON.stringify(actual) === JSON.stringify([...parsed].sort((a, b) => a - b)), detail: actual.join(', ') || '空数组' }
    } catch (cause) { return { ...item, actual: null, passed: !item.valid, detail: cause instanceof Error ? cause.message : '输入错误' } }
  })
}
