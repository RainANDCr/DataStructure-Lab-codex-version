import { parseValues, trace } from './topicCore.mjs'
import { lessons, snippet } from './topicSnippets.mjs'
import type { AlgorithmStep } from './types'
import { bstSnippet, bstTrace } from './bst'
import { weightedSnippet, weightedTrace, type WeightedGraphId } from './weightedGraph'
import { matrixSnippets, matrixTrace, type MatrixOrder } from './matrix'
import { kmpSnippet, kmpTrace } from './kmp'
import { glistSnippet, glistTrace, type GlistNode } from './glist'
import { huffmanSnippet, huffmanTrace, type HuffmanNode } from './huffman'
import { searchExtraSnippets, searchExtraTrace, type SearchBlock, type SearchExtraId } from './searchExtras'
import { avlSnippet, avlTrace } from './avl'
import { floydSnippet, floydTrace } from './floyd'
import { dagSnippet, dagTrace, type DagId } from './dag'
import { bracketsTrace, circularQueueTrace, linearExtraSnippet, type LinearExtraId } from './linearExtras'
import { expressionSnippet, expressionTrace } from './expression'
import { threadedSnippet, threadedTreeTrace, type ThreadEdge } from './threadedTree'
import { linkedSnippet, linkedTrace, type LinkedKind, type LinkedOperation, type ListNode } from './linkedVariants'
import { arrayExtraSnippet, arrayExtraTrace } from './arrayOps'
import { linkedLinearSnippet, linkedLinearTrace, type LinkedLinearId } from './linkedStackQueue'
import { stringOpsSnippet, stringOpsTrace, type StringOperation } from './stringOps'
import { treeEditSnippet, treeEditTrace, type TreeEditOperation } from './treeEdit'
import { generalSnippet, generalTreeTrace, type GeneralOrder } from './generalTree'

export const topicIds = ['array', 'linked', 'circularLinked', 'doublyLinked', 'circularDoublyLinked', 'stack', 'linkedStack', 'queue', 'circularQueue', 'linkedQueue', 'brackets', 'expression', 'stringOps', 'string', 'kmp', 'matrix', 'glist', 'generalTree', 'tree', 'treeEdit', 'threaded', 'huffman', 'graph', 'prim', 'kruskal', 'dijkstra', 'floyd', 'topological', 'critical', 'sequential', 'binary', 'block', 'bst', 'avl', 'hash'] as const
export type TopicId = typeof topicIds[number]
export type TopicLanguage = 'C' | 'C++' | 'Python'
export type TopicOptions = { operation?: LinkedOperation | StringOperation; position?: number; count?: number; value?: number; pattern?: string; order?: 'pre' | 'in' | 'post' | 'level' | 'bfs' | 'dfs' | MatrixOrder; rows?: number; cols?: number; start?: number; edges?: string; target?: number; directed?: boolean }
export type TopicState = { values: (number | string)[]; active: number[]; done: number[]; output: (number | string)[]; comparisons: number; writes: number; linear?: (number | null)[]; triples?: [number, number, number][]; rows?: number; cols?: number; cell?: [number, number]; slot?: number; next?: (number | null)[]; alignment?: number; patternIndex?: number; prefixIndex?: number; edges?: [number, number][]; weightedEdges?: [number, number, number][]; queueIndices?: number[]; discovered?: number[]; selectedEdges?: [number, number][]; distances?: number[]; distanceMatrix?: number[][]; directed?: boolean; indegrees?: number[]; earliest?: number[]; latest?: number[]; slots?: (number | null)[]; treeSlots?: (number | null)[]; front?: number; rear?: number; stackValues?: string[]; operators?: string[]; operands?: number[]; threads?: ThreadEdge[]; listNodes?: ListNode[]; head?: number | null; pointer?: [number,number]; edge?: number[]; range?: number[]; pattern?: string; depths?: number[]; layoutValues?: number[]; vars?: Record<string, string | number | boolean>; nodes?: GlistNode[]; length?: number; depth?: number; path?: number[]; huffmanNodes?: HuffmanNode[]; roots?: number[]; codes?: Record<string, string>; blocks?: SearchBlock[]; blockIndex?: number; hashSlots?: (number | null)[]; root?: number | null }
export type TopicLesson = { title: string; principle: string; time: string; space: string; tip: string; default: (number | string)[] }

export const topicLessons = { ...lessons,
  generalTree: { title: '普通树与多叉遍历', principle: '一个节点可以有任意多个孩子；先根遍历先访问父节点，后根遍历先访问孩子，层序遍历用队列逐层处理。', time: 'O(n)', space: '递归栈 O(h) / 队列 O(w)', tip: '根固定为下标 0，父子边如 0-1；每个非根节点必须恰有一个父节点。', default: [0,1,2,3,4,5] },
  treeEdit: { title: '二叉树创建与删除', principle: '层序位置 i 的左右孩子分别为 2i+1、2i+2；创建时连入非空节点，删除节点时其整棵子树一并断开。', time: '创建 O(n) / 删除 O(子树大小)', space: 'O(h) 递归栈', tip: '输入中的 # 保留空孩子位置；非空节点必须有非空父节点。最多 15 个层序位置。', default: [8,4,12,2,10,14] },
  stringOps: { title: '串的基本操作', principle: '串是有序字符序列。可按下标求长度、连接、截取、插入、删除，或从左到右逐字符比较。', time: 'O(n + m)', space: '依操作而定', tip: '本实验仅处理英文字母和数字，以便 C、C++、Python 使用相同字符下标。', default: [...'DATA'] },
  linkedStack: { title: '链栈', principle: '栈顶就是链表头节点；入栈把新节点接到头部，出栈把头指针移向后继。', time: '入栈/出栈 O(1)', space: '每节点 O(1)', tip: '空栈时 top 为 NULL；链式存储不需要预先划出固定容量。', default: [12,25,37] },
  linkedQueue: { title: '链队列', principle: 'front 指向队首、rear 指向队尾；入队接到尾节点之后，出队移走头节点。', time: '入队/出队 O(1)', space: '每节点 O(1)', tip: '最后一个节点出队时，front 与 rear 都应变为 NULL。', default: [12,25,37] },
  circularLinked: { title: '循环单链表', principle: '尾节点的 next 指回头节点，因此从任一节点沿 next 可以回到起点；插入和删除还需更新尾部连接。', time: '定位 O(n) / 改链 O(1)', space: 'O(1)', tip: '用节点编号观察 next 的改变；空表头指针为 NULL。', default: [12,25,37] },
  doublyLinked: { title: '双向链表', principle: '每个节点同时保存 prev 与 next；插入或删除时分别修正前驱和后继的指针。', time: '定位 O(n) / 改链 O(1)', space: 'O(1)', tip: '首节点 prev 和尾节点 next 为 NULL；演示中的指针编号在一步步播放时保持稳定。', default: [12,25,37] },
  circularDoublyLinked: { title: '循环双向链表', principle: '双向链表的尾节点 next 指向头节点，头节点 prev 指向尾节点，两个方向都形成闭环。', time: '定位 O(n) / 改链 O(1)', space: 'O(1)', tip: '单节点时 prev 和 next 都指向自身；空表头指针为 NULL。', default: [12,25,37] },
  circularQueue: { title: '循环队列', principle: '固定数组首尾相接，front 指向队首，rear 指向下一个可写位置；下标按容量取模循环移动。', time: '入队/出队 O(1)', space: 'O(1) 额外空间', tip: '容量为 6，保留一个空槽区分队满与队空，因此最多容纳 5 个元素。', default: [12,25,37] },
  brackets: { title: '括号匹配', principle: '扫描表达式时把左括号压栈；遇到右括号就与栈顶比较，匹配才弹出。扫描结束时栈空才合法。', time: 'O(n)', space: 'O(n)', tip: '依次检查 ()、[]、{} 三种括号，遇到第一个错误立即停止。', default: ['(', '[', ']', ')'] },
  expression: { title: '表达式求值', principle: '数值栈保存操作数，运算符栈保存尚未执行的运算；乘除优先于加减，括号中的运算先完成。', time: 'O(n)', space: 'O(n)', tip: '支持非负整数、+ − × ÷ 与括号；不支持一元负号。除法可得小数，结果限制在 ±10⁹。', default: ['2','+','3','*','4'] },
  threaded: { title: '中序线索二叉树', principle: '按中序访问节点时，把空左孩子指针指向前驱，把空右孩子指针指向后继；线索让后续遍历可少用递归栈。', time: '构建 O(n)', space: '递归栈 O(h)', tip: '实线是原有孩子边，虚线是新建的前驱/后继线索；本例按层序输入建立完全二叉树。', default: [8,4,12,2,6,10,14] },
  kmp: { title: 'KMP 模式匹配', principle: '用模式串的 next 数组记录真前后缀长度。失配时主串下标不回退，模式串沿 next 回退到可复用的前缀。', time: 'O(n + m)', space: 'O(m)', tip: '这里的 next 采用前缀函数约定：next[p] 表示截至 p 的最长相等真前后缀长度。', default: ['A', 'B', 'A', 'B', 'A', 'B', 'C'] },
  matrix: { title: '矩阵存储', principle: '矩阵按行、列或结构特征映射到连续空间；稀疏矩阵只记录非零项的行、列和值。', time: 'O(行数 × 列数)', space: '依存储方式而定', tip: '对称、三角和三对角压缩要求方阵；三角和三对角区域之外必须为 0。', default: [1, 2, 3, 4, 5, 6] },
  glist: { title: '广义表', principle: '广义表的元素可以是原子，也可以是子表。递归进入子表，遇到原子就记录，子表结束后返回上一层。', time: 'O(n)', space: 'O(d) 递归栈', tip: '表长只数最外层的直接元素；表深度按嵌套层数计算，空表的深度为 1。', default: ['a', 'b', 'c', 'd'] },
  huffman: { title: '哈夫曼树与编码', principle: '反复合并权重最小的两棵树，得到加权路径长度最小的二叉树。从根到叶，左边记 0、右边记 1，形成各符号的前缀编码。', time: 'O(n²)', space: 'O(n)', tip: 'A、B、C…依输入顺序对应权重；相同权重优先选更早创建的节点。本例线性扫描选最小树。', default: [5, 9, 12, 13, 16, 45] },
  sequential: { title: '顺序查找', principle: '从第一个元素开始逐个比较，不要求输入有序；首次相等即返回下标。', time: 'O(n)', space: 'O(1)', tip: '成功时比较次数取决于目标位置；失败时需检查全部元素。', default: [18, 7, 42, 13, 29] },
  block: { title: '分块查找', principle: '把有序数组分成若干块，先用每块最大值定位候选块，再顺序扫描块内元素。', time: 'O(√n)', space: 'O(√n) 块索引', tip: '本例块大小取向上取整的 √n，要求整体升序；块内也保持升序。', default: [3, 8, 12, 16, 21, 27, 32, 39, 45] },
  hash: { title: '散列查找', principle: '用取模得到初始槽位；冲突时线性探测。查找沿同一路径探测到目标或空槽。', time: '平均 O(1) / 最坏 O(n)', space: 'O(m) 散列表', tip: '表长固定 11，最多输入 10 个不同整数，保留一个空槽；负数取模会归一化。', default: [22, 33, 44, 15, 26] },
  avl: { title: '平衡二叉树 AVL', principle: '插入后沿祖先路径更新高度；当左右子树高度差超过 1 时，通过左旋、右旋或双旋恢复平衡。', time: '插入/查找 O(log n)', space: '建树 O(n) / 查找 O(1)', tip: '本例展示 LL、RR、LR、RL 四类失衡，旋转后仍保持二叉排序树的中序顺序。', default: [30, 20, 10, 25, 28, 40] },
  bst: { title: '二叉排序树', principle: '左子树的值小于根，右子树的值大于根。按输入顺序插入形成树；查找时每次比较后只进入一侧。', time: '查找平均 O(log n) / 最坏 O(n)', space: '建树 O(n) / 查找 O(1)', tip: '不平衡时树可能退化为链表，逐个建树最坏 O(n²)。本例拒绝重复值，最多 12 个节点。', default: [8, 4, 12, 2, 6, 10, 14] },
  prim: { title: 'Prim 最小生成树', principle: '从起点开始，每轮选择连接已访问节点与未访问节点的最轻边，直到所有节点进入树。', time: 'O(VE)', space: 'O(V + E)', tip: '本例用边表反复扫描跨界边；图必须连通。同权时取输入中先出现的边。', default: [0, 1, 2, 3, 4] },
  kruskal: { title: 'Kruskal 最小生成树', principle: '把边按权重排序，依次加入不会形成环的边；并查集判断两端是否已连通。', time: 'O(E log E)', space: 'O(V + E)', tip: '要求无向连通图；同权边沿用输入顺序。并查集在本例中用于判环。', default: [0, 1, 2, 3, 4] },
  dijkstra: { title: 'Dijkstra 最短路径', principle: '每轮选出暂定距离最小的未确定节点，再用它的边尝试缩短邻居的距离。', time: 'O(V² + E)', space: 'O(V + E)', tip: '只接受非负边权。不可达目标返回 −1；本例使用线性扫描选取节点。', default: [0, 1, 2, 3, 4] },
  floyd: { title: 'Floyd 最短路径', principle: '依次尝试每个节点作为中转点，比较两点的原距离与经该点中转的距离，逐步求出所有节点对的最短路径。', time: 'O(V³)', space: 'O(V²)', tip: '边按箭头方向生效，边权为非负整数。距离矩阵中的 ∞ 表示尚不可达。', default: [0, 1, 2, 3] },
  topological: { title: '拓扑排序', principle: '反复取入度为 0 的节点输出，删除其出边并更新后继的入度；若仍有节点却找不到入度为 0 的节点，说明存在环。', time: 'O(V + E)', space: 'O(V + E)', tip: '多种拓扑序列可能都正确；本例始终优先选输入下标最小的可用节点。', default: [0, 1, 2, 3, 4] },
  critical: { title: '关键路径', principle: '先按拓扑序求各事件最早发生时间，再逆序求最晚发生时间；时间余量为 0 的活动决定项目工期。', time: 'O(V + E)', space: 'O(V + E)', tip: '需要单一起点与终点的 AOE 网；边权表示活动持续时间，绿色边表示关键活动。', default: [0, 1, 2, 3, 4] },
} as Record<TopicId, TopicLesson>
export const topicDefaults: Record<TopicId, { input: string; options: TopicOptions }> = {
  array: { input: '12, 25, 37, 48, 60', options: { operation: 'insert', position: 2, value: 99 } },
  linked: { input: '12, 25, 37, 48', options: { operation: 'insert', position: 2, value: 99 } },
  circularLinked: { input: '12, 25, 37', options: { operation: 'insert', position: 1, value: 99, target: 25 } },
  doublyLinked: { input: '12, 25, 37', options: { operation: 'insert', position: 1, value: 99, target: 25 } },
  circularDoublyLinked: { input: '12, 25, 37', options: { operation: 'insert', position: 1, value: 99, target: 25 } },
  stack: { input: '12, 25, 37', options: { operation: 'insert', value: 99 } },
  linkedStack: { input: '12, 25, 37', options: { operation: 'insert', value: 99 } },
  queue: { input: '12, 25, 37, 48', options: { operation: 'insert', value: 99 } },
  linkedQueue: { input: '12, 25, 37', options: { operation: 'insert', value: 99 } },
  circularQueue: { input: '12, 25, 37', options: { operation: 'insert', value: 99, position: 4 } },
  brackets: { input: '([{}])', options: {} },
  expression: { input: '2 + 3 * (4 + 1)', options: {} },
  string: { input: 'ABABAC', options: { pattern: 'ABAC' } },
  stringOps: { input: 'DATA', options: { operation: 'concat', pattern: 'LAB', position: 1, count: 2 } },
  kmp: { input: 'ABABABC', options: { pattern: 'ABABC' } },
  matrix: { input: '1, 2, 3, 4, 5, 6', options: { rows: 2, cols: 3, order: 'row' } },
  glist: { input: '(a,(b,c),(),d)', options: {} },
  tree: { input: '8, 4, 12, 2, 6, 10, 14', options: { order: 'in' } },
  generalTree: { input: '0, 1, 2, 3, 4, 5', options: { order: 'pre', edges: '0-1, 0-2, 0-3, 1-4, 1-5' } },
  treeEdit: { input: '8, 4, 12, 2, #, 10, 14', options: { operation: 'remove', position: 1, value: 6 } },
  threaded: { input: '8, 4, 12, 2, 6, 10, 14', options: {} },
  huffman: { input: '5, 9, 12, 13, 16, 45', options: {} },
  sequential: { input: '18, 7, 42, 13, 29', options: { target: 42 } },
  block: { input: '3, 8, 12, 16, 21, 27, 32, 39, 45', options: { target: 27 } },
  hash: { input: '22, 33, 44, 15, 26', options: { target: 26 } },
  avl: { input: '30, 20, 10, 25, 28, 40', options: { target: 28 } },
  graph: { input: '0, 1, 2, 3, 4, 5', options: { order: 'bfs', start: 0, edges: '0-1, 0-2, 1-3, 1-4, 2-5', directed: false } },
  prim: { input: '0, 1, 2, 3, 4', options: { start: 0, edges: '0-1:2, 0-2:4, 1-2:1, 1-3:7, 2-3:3, 3-4:2, 2-4:6' } },
  kruskal: { input: '0, 1, 2, 3, 4', options: { start: 0, edges: '0-1:2, 0-2:4, 1-2:1, 1-3:7, 2-3:3, 3-4:2, 2-4:6' } },
  dijkstra: { input: '0, 1, 2, 3, 4', options: { start: 0, target: 4, edges: '0-1:2, 0-2:4, 1-2:1, 1-3:7, 2-3:3, 3-4:2, 2-4:6' } },
  floyd: { input: '0, 1, 2, 3', options: { start: 0, target: 3, edges: '0-1:2, 0-2:9, 1-2:3, 1-3:8, 2-3:1' } },
  topological: { input: '0, 1, 2, 3, 4', options: { edges: '0-1, 0-2, 1-3, 2-3, 3-4' } },
  critical: { input: '0, 1, 2, 3, 4', options: { edges: '0-1:3, 0-2:2, 1-3:4, 2-3:6, 3-4:2' } },
  binary: { input: '8, 18, 24, 30, 42, 55, 65, 72', options: { target: 42 } },
  bst: { input: '8, 4, 12, 2, 6, 10, 14', options: { target: 10 } },
}

export function topicRun(id: TopicId, rawInput: string, options: TopicOptions) {
  const values = id === 'glist' || id==='treeEdit' ? [] : id === 'string' || id === 'stringOps' || id === 'kmp' || id === 'brackets' || id === 'expression' ? [...rawInput] : parseValues(rawInput)
  const weighted = id === 'prim' || id === 'dijkstra' || id === 'kruskal'
  const linked = id === 'linked' || id === 'circularLinked' || id === 'doublyLinked' || id === 'circularDoublyLinked'
  const linkedLinear = id === 'linkedStack' || id === 'linkedQueue'
  const arrayExtra = id === 'array' && !!options.operation && options.operation !== 'insert' && options.operation !== 'remove'
  const searchExtra = id === 'sequential' || id === 'block' || id === 'hash'
  const dag = id === 'topological' || id === 'critical'
  const linearExtra = id === 'circularQueue' || id === 'brackets'
  const frames = (id==='generalTree' ? generalTreeTrace(values as number[], options.edges??'', options.order as GeneralOrder) : id==='treeEdit' ? treeEditTrace(rawInput, options.operation as TreeEditOperation, options.position, options.value) : id === 'stringOps' ? stringOpsTrace(rawInput, options.operation as StringOperation, options.pattern ?? '', options.position, options.count) : linkedLinear ? linkedLinearTrace(id as LinkedLinearId, values as number[], options.operation as LinkedOperation ?? 'insert', options.value) : linked ? linkedTrace(id as LinkedKind, values as number[], options as {operation?:LinkedOperation;position?:number;value?:number;target?:number}) : arrayExtra ? arrayExtraTrace(values as number[], (options.operation ?? 'create') as Exclude<LinkedOperation,'insert'|'remove'>, options) : id === 'threaded' ? threadedTreeTrace(values as number[]) : id === 'expression' ? expressionTrace(rawInput) : id === 'circularQueue' ? circularQueueTrace(values as number[], options.operation === 'remove' ? 'remove' : 'insert', options.value, options.position) : id === 'brackets' ? bracketsTrace(rawInput) : dag ? dagTrace(id as DagId, values as number[], options.edges ?? '') : id === 'floyd' ? floydTrace(values as number[], options.edges ?? '', options.start as number, options.target as number) : id === 'avl' ? avlTrace(values as number[], options.target as number) : searchExtra ? searchExtraTrace(id as SearchExtraId, values as number[], options.target as number) : id === 'huffman' ? huffmanTrace(values as number[]) : id === 'glist' ? glistTrace(rawInput) : id === 'kmp' ? kmpTrace(values as string[], options.pattern as string) : id === 'matrix' ? matrixTrace(values as number[], options.rows as number, options.cols as number, options.order as MatrixOrder) : id === 'bst' ? bstTrace(values as number[], options.target as number) : weighted ? weightedTrace(id as WeightedGraphId, values as number[], options) : trace(id, values, options)) as (TopicState & { tag: string; text: string; vars: Record<string, string | number | boolean> })[]
  const taggedCode = Object.fromEntries((['C', 'C++', 'Python'] as const).map(language => [language, id==='generalTree' ? generalSnippet[options.order as GeneralOrder][language] : id==='treeEdit' ? treeEditSnippet[options.operation as TreeEditOperation][language] : id === 'stringOps' ? stringOpsSnippet[options.operation as StringOperation][language] : linkedLinear ? linkedLinearSnippet[id as LinkedLinearId][language] : linked ? linkedSnippet[language] : arrayExtra ? arrayExtraSnippet[language] : id === 'threaded' ? threadedSnippet[language] : id === 'expression' ? expressionSnippet[language] : linearExtra ? linearExtraSnippet[id as LinearExtraId][language] : dag ? dagSnippet[id as DagId][language] : id === 'floyd' ? floydSnippet[language] : id === 'avl' ? avlSnippet[language] : searchExtra ? searchExtraSnippets[id as SearchExtraId][language] : id === 'huffman' ? huffmanSnippet[language] : id === 'glist' ? glistSnippet[language] : id === 'kmp' ? kmpSnippet[language] : id === 'matrix' ? matrixSnippets[options.order as MatrixOrder][language] : id === 'bst' ? bstSnippet[language] : weighted ? weightedSnippet[id as WeightedGraphId][language] : snippet(id, language, options)])) as Record<TopicLanguage, { tag: string; text: string }[]>
  const code = Object.fromEntries((['C', 'C++', 'Python'] as const).map(language => [language, taggedCode[language].map(line => line.text)])) as Record<TopicLanguage, string[]>
  const steps: AlgorithmStep<TopicState>[] = frames.map((frame, index) => ({
    id: `${id}-${index}`,
    description: frame.text,
    state: frame,
    highlightedElements: frame.active.map(String),
    highlightedLines: Object.fromEntries((['C', 'C++', 'Python'] as const).map(language => [language, taggedCode[language].flatMap((line, position) => line.tag === frame.tag ? [position + 1] : [])])),
    variables: frame.vars,
  }))
  return { steps, code }
}
