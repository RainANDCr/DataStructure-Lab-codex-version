import { bubbleSort } from '../engine/bubble'
import type { BubbleState } from '../engine/bubble'
import type { ExecutionStep } from '../engine/types'
import { topicRun, type TopicOptions } from '../engine/topics'
import { knowledgeById } from './knowledge'
import { lessonById } from './catalog'

export type QuestionType = 'single' | 'multiple' | 'boolean' | 'numeric' | 'complexity' | 'simulation'
export type SimulationKind = 'swap' | 'stack-pop' | 'queue-ends' | 'tree-order' | 'graph-next' | 'binary-mid'
export type Question = {
  id: string; type: QuestionType; title: string; stem: string; options?: string[]; answer: string[]; explanation: string
  knowledgePointIds: string[]; algorithmId: string; difficulty: '基础' | '进阶'; tags: string[]
  sourceType: 'original'; sourceReference: string; reviewStatus: 'validated'; version: number
  simulation?: { kind: SimulationKind; initialData: number[]; standardState: string[]; validationRule: string; stepReference: string; errorHint: string; options?: TopicOptions }
}
export type Attempt = { questionId: string; answer: string[]; correct: boolean; mode: 'learn' | 'exam'; timestamp: string; version: 1 }

type Draft = Pick<Question, 'id' | 'type' | 'title' | 'stem' | 'answer' | 'explanation' | 'algorithmId'> & { pointId: string; options?: string[]; difficulty?: Question['difficulty']; simulation?: Question['simulation'] }
const question = (draft: Draft): Question => ({
  id: draft.id, type: draft.type, title: draft.title, stem: draft.stem, options: draft.options, answer: draft.answer, explanation: draft.explanation,
  knowledgePointIds: [draft.pointId], algorithmId: draft.algorithmId, difficulty: draft.difficulty ?? '基础', tags: [`课程第${knowledgeById.get(draft.pointId)?.chapterId ?? '?'}章`, '408-站内练习'],
  sourceType: 'original', sourceReference: 'DataStruct Lab 原创示例', reviewStatus: 'validated', version: 1, simulation: draft.simulation,
})

export const questions: Question[] = [
  question({ id: 'q-linear-01', type: 'single', title: '顺序表的读取', stem: '顺序表已知有效下标时，读取一个元素通常需要多少时间？', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], answer: ['O(1)'], explanation: '连续存储支持按下标直接定位；这里不包含查找元素值的过程。', pointId: 'array', algorithmId: 'array' }),
  question({ id: 'q-linear-02', type: 'multiple', title: '链表插入链接', stem: '在单链表中已知前驱 pred 与其后继 succ，插入 fresh 时需要哪些操作？', options: ['fresh.next = succ', 'pred.next = fresh', '丢弃 succ', '移动后续所有节点'], answer: ['fresh.next = succ', 'pred.next = fresh'], explanation: '先连接 fresh 与原后继，再修改 pred 的 next；无须搬移节点。', pointId: 'linked', algorithmId: 'linked' }),
  question({ id: 'q-linear-03', type: 'boolean', title: '逻辑相邻', stem: '单链表中逻辑相邻的节点必须占据相邻内存地址。', options: ['正确', '错误'], answer: ['错误'], explanation: 'next 指针表达逻辑次序，物理地址可以分散。', pointId: 'linked', algorithmId: 'linked' }),
  question({ id: 'q-linear-04', type: 'numeric', title: '移动元素数量', stem: '长度为 5 的顺序表，在下标 2 插入新元素，原有元素需要向右移动几个？', answer: ['3'], explanation: '原下标 2、3、4 的三个元素要从后向前移动。', pointId: 'array', algorithmId: 'array' }),
  question({ id: 'q-stack-01', type: 'single', title: '栈的出栈', stem: '空栈依次压入 2、4、6，第一次出栈的值是？', options: ['2', '4', '6', '空栈'], answer: ['6'], explanation: '栈后进先出，6 最后压入。', pointId: 'stack', algorithmId: 'stack' }),
  question({ id: 'q-stack-02', type: 'boolean', title: '循环队列容量', stem: '容量为 5 且牺牲一个空槽的循环队列，最多能存 5 个元素。', options: ['正确', '错误'], answer: ['错误'], explanation: '留一个空槽区别队满与队空，最多存 4 个。', pointId: 'circularQueue', algorithmId: 'circularQueue' }),
  question({ id: 'q-stack-03', type: 'numeric', title: '循环队列取模', stem: '容量 5 的循环队列尚未满，rear=4 且指向下一空位，入队后 rear 应为多少？', answer: ['0'], explanation: '(4+1)%5=0。题中 rear 指向下一空位。', pointId: 'circularQueue', algorithmId: 'circularQueue' }),
  question({ id: 'q-tree-01', type: 'single', title: '中序遍历', stem: '根为 8，左孩子 4，右孩子 12；中序遍历结果是？', options: ['8,4,12', '4,8,12', '4,12,8', '12,8,4'], answer: ['4,8,12'], explanation: '中序是左子树、根、右子树。', pointId: 'traversal', algorithmId: 'tree' }),
  question({ id: 'q-tree-02', type: 'numeric', title: '完全二叉树下标', stem: '层序数组从下标 0 开始，节点下标 3 的右孩子下标是多少？', answer: ['8'], explanation: '右孩子下标为 2i+2，代入 i=3 得 8。', pointId: 'binaryTree', algorithmId: 'tree' }),
  question({ id: 'q-tree-03', type: 'boolean', title: '二叉树左右子树', stem: '交换一个节点的左、右孩子后，仍视为同一棵有序二叉树。', options: ['正确', '错误'], answer: ['错误'], explanation: '二叉树区分左子树和右子树。', pointId: 'binaryTree', algorithmId: 'tree' }),
  question({ id: 'q-search-01', type: 'single', title: '折半查找前提', stem: '以下哪组数据适合直接使用本站的折半查找动画？', options: ['[8,3,5]', '[2,4,6]', '[6,4,2]', '[1,3,2]'], answer: ['[2,4,6]'], explanation: '本站折半查找要求输入升序。', pointId: 'binarySearch', algorithmId: 'binary' }),
  question({ id: 'q-search-02', type: 'numeric', title: '首次中点', stem: '长度 7 的升序数组，下标范围 0～6，首次 mid 下标是多少？', answer: ['3'], explanation: 'mid=floor((0+6)/2)=3。', pointId: 'binarySearch', algorithmId: 'binary' }),
  question({ id: 'q-search-03', type: 'complexity', title: '折半查找量级', stem: '在有序数组中做折半查找，最坏比较次数的增长量级通常是？', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], answer: ['O(log n)'], explanation: '每轮候选区间约减半。', pointId: 'binarySearch', algorithmId: 'binary' }),
  question({ id: 'q-sort-01', type: 'single', title: '冒泡排序首轮', stem: '对 [3,1,2] 升序冒泡，首轮结束后哪个值到达最后位置？', options: ['1', '2', '3', '无法确定'], answer: ['3'], explanation: '相邻比较与交换把当前最大值逐步推到右端。', pointId: 'bubble', algorithmId: 'bubble' }),
  question({ id: 'q-sort-02', type: 'multiple', title: '稳定排序', stem: '按本站内置实现，以下哪些排序在相等关键字时保持原相对顺序？', options: ['冒泡排序', '归并排序', '选择排序', '快速排序'], answer: ['冒泡排序', '归并排序'], explanation: '本站冒泡相等时不交换；归并相等时先取左侧。', pointId: 'stability', algorithmId: 'bubble' }),
  question({ id: 'q-sort-03', type: 'complexity', title: '归并排序量级', stem: '数组归并排序最坏时间复杂度是什么？', options: ['O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'], answer: ['O(n log n)'], explanation: '约 log n 层拆分，每层合并总工作量 O(n)。', pointId: 'merge', algorithmId: 'merge' }),
  question({ id: 'q-sim-swap', type: 'simulation', title: '选择下一次交换', stem: '按本站冒泡排序，从左到右比较 [4,1,3]。点击下一次实际交换的两个元素。', answer: ['0', '1'], explanation: '首先比较 4 和 1，4>1，交换下标 0 和 1。', pointId: 'bubble', algorithmId: 'bubble', simulation: { kind: 'swap', initialData: [4,1,3], standardState: ['1','4','3'], validationRule: '两下标无序等价', stepReference: '首次 SWAP 操作', errorHint: '先看下标 0 与 1 的相邻比较。' } }),
  question({ id: 'q-sim-stack', type: 'simulation', title: '预测出栈元素', stem: '栈从栈底到栈顶为 [2,4,6]，点击下一次出栈的元素。', answer: ['6'], explanation: '删除操作移去栈顶 6。', pointId: 'stack', algorithmId: 'stack', simulation: { kind: 'stack-pop', initialData: [2,4,6], standardState: ['2','4'], validationRule: '单值相等', stepReference: '栈 remove 后状态', errorHint: '栈遵循后进先出。', options: { operation: 'remove' } } }),
  question({ id: 'q-sim-queue', type: 'simulation', title: '队头和队尾', stem: '队列从队头到队尾为 [2,4,6]，再入队 9。依次点击入队后的队头、队尾。', answer: ['2','9'], explanation: '9 从队尾进入，原队头 2 不变。', pointId: 'queue', algorithmId: 'queue', simulation: { kind: 'queue-ends', initialData: [2,4,6], standardState: ['2','4','6','9'], validationRule: '按队头、队尾顺序', stepReference: '队列 insert 后状态', errorHint: '队头在左、队尾在右。', options: { operation: 'insert', value: 9 } } }),
  question({ id: 'q-sim-tree', type: 'simulation', title: '点击前序遍历', stem: '按层序存储 [8,4,12,2,6] 建树，依次点击前序遍历访问的节点。', answer: ['8','4','2','6','12'], explanation: '前序按根、左、右访问：8 → 4 → 2 → 6 → 12。', pointId: 'traversal', algorithmId: 'tree', simulation: { kind: 'tree-order', initialData: [8,4,12,2,6], standardState: ['8','4','2','6','12'], validationRule: '访问顺序完全一致', stepReference: 'tree pre 的 visit 步骤', errorHint: '先访问根，再完整遍历左子树。', options: { order: 'pre' } } }),
  question({ id: 'q-sim-graph', type: 'simulation', title: '预测 BFS 下一顶点', stem: '无向图边为 0-1、0-2、1-3，从 0 开始 BFS，邻居按下标升序入队。访问 0 后，下一个访问的顶点是谁？', answer: ['1'], explanation: '1 先于 2 被取出访问。', pointId: 'graphTraversal', algorithmId: 'graph', simulation: { kind: 'graph-next', initialData: [0,1,2,3], standardState: ['0','1','2','3'], validationRule: '第二个 VISIT 顶点', stepReference: 'graph bfs 的第二个 visit 步骤', errorHint: '本题规定邻居按下标升序入队。', options: { order: 'bfs', start: 0, edges: '0-1, 0-2, 1-3', directed: false } } }),
  question({ id: 'q-sim-binary', type: 'simulation', title: '预测首次比较元素', stem: '在升序数组 [2,4,6,8,10] 中折半查找 10，点击首次比较的元素。', answer: ['6'], explanation: '首次 mid=floor((0+4)/2)=2，对应元素 6。', pointId: 'binarySearch', algorithmId: 'binary', simulation: { kind: 'binary-mid', initialData: [2,4,6,8,10], standardState: ['6'], validationRule: '首次 mid 值', stepReference: 'binary 的首个 mid 步骤', errorHint: '先算首尾下标的中点。', options: { target: 10 } } }),
]

export function deriveSimulationAnswer(item: Question): string[] {
  const simulation = item.simulation
  if (!simulation) throw new Error('题目缺少推演配置。')
  const input = simulation.initialData
  if (simulation.kind === 'swap') return (bubbleSort.generate(input) as ExecutionStep<BubbleState>[]).find(step => step.operations.some(operation => operation.type === 'SWAP'))?.operations.find(operation => operation.type === 'SWAP')?.elements ?? []
  if (simulation.kind === 'stack-pop') {
    const final = topicRun('stack', input.join(','), simulation.options ?? {}).steps.at(-1)!.state.values
    return input.slice(final.length).map(String)
  }
  if (simulation.kind === 'queue-ends') {
    const final = topicRun('queue', input.join(','), simulation.options ?? {}).steps.at(-1)!.state.values
    return [String(final[0]), String(final.at(-1))]
  }
  if (simulation.kind === 'tree-order') return topicRun('tree', input.join(','), simulation.options ?? {}).steps.at(-1)!.state.output.map(String)
  if (simulation.kind === 'graph-next') {
    const visits = topicRun('graph', input.join(','), simulation.options ?? {}).steps.filter(step => (step.state as typeof step.state & { tag: string }).tag === 'visit')
    return [String(visits[1]?.state.output.at(-1))]
  }
  const first = topicRun('binary', input.join(','), simulation.options ?? {}).steps.find(step => (step.state as typeof step.state & { tag: string }).tag === 'mid')
  return [String(input[Number(first?.state.active[0])])]
}

function deriveSimulationState(item: Question): string[] {
  const simulation = item.simulation!
  const input = simulation.initialData
  if (simulation.kind === 'swap') return ((bubbleSort.generate(input) as ExecutionStep<BubbleState>[]).find(step => step.operations.some(operation => operation.type === 'SWAP'))?.state.values ?? []).map(String)
  if (simulation.kind === 'stack-pop' || simulation.kind === 'queue-ends') return topicRun(simulation.kind === 'stack-pop' ? 'stack' : 'queue', input.join(','), simulation.options ?? {}).steps.at(-1)!.state.values.map(String)
  if (simulation.kind === 'tree-order' || simulation.kind === 'graph-next') return topicRun(simulation.kind === 'tree-order' ? 'tree' : 'graph', input.join(','), simulation.options ?? {}).steps.at(-1)!.state.output.map(String)
  return deriveSimulationAnswer(item)
}

export function gradeAnswer(item: Question, submitted: readonly string[]): { correct: boolean; explanation: string } {
  const answer = item.type === 'simulation' ? deriveSimulationAnswer(item) : item.answer
  const normalize = (value: string) => value.trim().replace(/，/g, ',')
  const actual = submitted.map(normalize), expected = answer.map(normalize)
  const unordered = item.type === 'multiple' || item.simulation?.kind === 'swap'
  const correct = actual.length === expected.length && (item.type === 'numeric' ? actual.every((value, index) => value !== '' && Number.isFinite(Number(value)) && Number(value) === Number(expected[index])) : unordered ? [...actual].sort().join('\u0000') === [...expected].sort().join('\u0000') : actual.every((value, index) => value === expected[index]))
  return { correct, explanation: item.explanation }
}

export function drawQuestions(pool: readonly Question[], count: number, random: () => number = Math.random): Question[] {
  const drawn = [...pool]
  for (let index = drawn.length - 1; index > 0; index--) {
    const choice = Math.floor(random() * (index + 1))
    ;[drawn[index], drawn[choice]] = [drawn[choice], drawn[index]]
  }
  return drawn.slice(0, Math.max(0, Math.min(drawn.length, Math.trunc(count) || 0)))
}

export function validateQuestionBank(bank: readonly Question[] = questions): string[] {
  const errors: string[] = [], ids = new Set<string>()
  for (const item of bank) {
    if (ids.has(item.id)) errors.push(`${item.id}: ID 重复`)
    ids.add(item.id)
    if (!item.title || !item.stem || !item.explanation || !item.answer.length || item.answer.some(value => !value.trim())) errors.push(`${item.id}: 内容或答案缺失`)
    if (!Number.isInteger(item.version) || item.version < 1 || item.sourceType !== 'original' || !item.sourceReference) errors.push(`${item.id}: 来源或版本无效`)
    if (!lessonById.has(item.algorithmId) || item.knowledgePointIds.some(id => !knowledgeById.has(id))) errors.push(`${item.id}: 知识点或算法映射无效`)
    if (['single', 'multiple', 'boolean', 'complexity'].includes(item.type) && (!item.options || new Set(item.options).size !== item.options.length || item.answer.some(value => !item.options?.includes(value)))) errors.push(`${item.id}: 选项无效`)
    if (item.type === 'single' && item.answer.length !== 1 || item.type === 'boolean' && item.answer.length !== 1 || item.type === 'numeric' && item.answer.some(value => !Number.isFinite(Number(value)))) errors.push(`${item.id}: 答案格式无效`)
    if (item.type === 'simulation') {
      try {
        if (!item.simulation || !item.simulation.initialData.length || item.simulation.initialData.some(value => !Number.isSafeInteger(value)) || JSON.stringify(deriveSimulationAnswer(item)) !== JSON.stringify(item.answer)) errors.push(`${item.id}: 推演答案与算法步骤不一致`)
        if (!item.simulation || !item.simulation.stepReference || !item.simulation.validationRule || !item.simulation.errorHint || JSON.stringify(deriveSimulationState(item)) !== JSON.stringify(item.simulation.standardState)) errors.push(`${item.id}: 推演状态或规则无效`)
      } catch { errors.push(`${item.id}: 推演输入非法或步骤生成失败`) }
    }
  }
  return errors
}
