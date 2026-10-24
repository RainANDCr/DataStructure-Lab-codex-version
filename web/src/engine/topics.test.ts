import { describe, expect, it } from 'vitest'
import { topicDefaults, topicIds, topicRun } from './topics'
import { lessons } from '../data/catalog'
import { sortAlgorithms } from './sorting'

describe('原生实验台的算法步骤', () => {
  it('课程目录的 44 个主题全部有新版实现', () => {
    expect(lessons).toHaveLength(44)
    expect(lessons.every(lesson => lesson.status === 'native' && (lesson.id === 'complexity' || topicIds.some(id => id === lesson.id) || lesson.id in sortAlgorithms))).toBe(true)
  })
  it.each(topicIds)('%s 每步都能对应 C、C++、Python 代码', id => {
    const { input, options } = topicDefaults[id]
    const run = topicRun(id, input, options)
    expect(run.steps.length).toBeGreaterThan(1)
    for (const step of run.steps) for (const language of ['C', 'C++', 'Python'] as const) {
      expect(step.highlightedLines[language].length).toBeGreaterThan(0)
      expect(run.code[language][step.highlightedLines[language][0] - 1]).toBeTruthy()
    }
  })

  it.each(['array', 'linked', 'stack', 'queue'] as const)('%s 支持插入与删除', id => {
    const base = id === 'stack' || id === 'queue' ? { operation: 'insert' as const, value: 9 } : { operation: 'insert' as const, value: 9, position: 1 }
    expect(topicRun(id, '1, 2', base).steps.at(-1)?.state.values).toHaveLength(3)
    expect(topicRun(id, '1, 2', { ...base, operation: 'remove' }).steps.at(-1)?.state.values).toHaveLength(1)
  })

  it('搜索、遍历及无效输入遵守算法约束', () => {
    expect(topicRun('binary', '1, 3, 5', { target: 5 }).steps.at(-1)?.variables?.result).toBe(2)
    expect(topicRun('string', 'ABABAC', { pattern: 'ABAC' }).steps.at(-1)?.variables?.result).toBe(2)
    expect(topicRun('tree', '8, 4, 12', { order: 'in' }).steps.at(-1)?.state.output).toEqual([4, 8, 12])
    expect(topicRun('tree', '8, 4, 12', { order: 'in' }).steps.some(step=>step.state.path?.join(',')==='0,1')).toBe(true)
    expect(topicRun('tree', '8, 4, 12, 2', { order: 'level' }).steps.at(-1)?.state.output).toEqual([8, 4, 12, 2])
    expect(topicRun('graph', '0, 1, 2', { order: 'bfs', start: 0, edges: '0-1, 1-2' }).steps.at(-1)?.state.output).toEqual([0, 1, 2])
    const directed = topicRun('graph', '0, 1, 2', { order: 'bfs', start: 2, edges: '0-1, 1-2', directed: true }).steps
    expect(directed[0].state.directed).toBe(true)
    expect(directed.at(-1)?.state.output).toEqual([2, 0, 1])
    expect(topicRun('graph', '0, 1', { order: 'bfs', start: 0, edges: '0-1, 1-0', directed: true }).steps.at(-1)?.state.output).toEqual([0, 1])
    expect(() => topicRun('binary', '3, 1', { target: 1 })).toThrow('升序')
    expect(() => topicRun('graph', '0, 1', { order: 'bfs', start: 0, edges: '0-2' })).toThrow('越界')
    expect(() => topicRun('stack', '', { operation: 'remove' })).toThrow('为空')
  })

  it('BFS 的队列、发现集和带权边随步骤快照恢复', () => {
    const steps = topicRun('graph', '0, 1, 2', { order: 'bfs', start: 0, edges: '0-1:0, 1-2:4' }).steps
    expect(steps[0].state.weightedEdges).toEqual([[0, 1, 0], [1, 2, 4]])
    expect(steps.find(step => step.state.queueIndices?.join(',') === '1')?.state.discovered).toEqual([0, 1])
    expect(steps.at(-1)?.state.queueIndices).toEqual([])
    expect(steps.at(-1)?.state.output).toEqual([0, 1, 2])
    expect(steps[0].state.queueIndices).toEqual([])
    expect(() => topicRun('graph', '0, 1', { order: 'bfs', start: 0, edges: '0-1:100' })).toThrow('边权')
  })

  it('广义表展示嵌套、空表、表长和递归访问顺序', () => {
    const steps = topicRun('glist', '(a,(b,c),(),d)', {}).steps
    expect(steps[0].state.length).toBe(4)
    expect(steps[0].state.depth).toBe(2)
    expect(steps[0].state.nodes?.filter(node => !node.atom)).toHaveLength(3)
    expect(steps.at(-1)?.state.output).toEqual(['a', 'b', 'c', 'd'])
    expect(steps.some(step => step.description.includes('空表没有元素'))).toBe(true)
    expect(steps[0].state.output).toEqual([])
    expect(topicRun('glist', '()', {}).steps.at(-1)?.state.output).toEqual([])
    expect(topicRun('glist', '()', {}).steps[0].state.depth).toBe(1)
  })

  it('广义表拒绝缺失分隔符、非法原子和超限嵌套', () => {
    for (const input of ['a', '(a,,b)', '(a,)', '(a b)', '(a', '(a)!', '(a,中)', '((((((a))))))']) {
      expect(() => topicRun('glist', input, {})).toThrow()
    }
  })

  it('哈夫曼树逐轮合并最小权重并生成前缀编码', () => {
    const steps = topicRun('huffman', '5, 9, 12, 13, 16, 45', {}).steps
    expect(steps.find(step => step.description.includes('A（5）与 B（9）'))?.state.active).toEqual([0, 1])
    expect(steps.at(-1)?.state.huffmanNodes?.at(-1)?.weight).toBe(100)
    expect(steps.at(-1)?.state.codes).toEqual({ A: '1100', B: '1101', C: '100', D: '101', E: '111', F: '0' })
    expect(steps.at(-1)?.state.roots).toHaveLength(1)
    expect(steps[0].state.huffmanNodes).toHaveLength(6)
    expect(steps[0].state.codes).toEqual({})
    expect(topicRun('huffman', '1, 1', {}).steps.at(-1)?.state.codes).toEqual({ A: '0', B: '1' })
    for (const input of ['', '1', '1,0', '1,-2', '1,2,3,4,5,6,7,8,9']) expect(() => topicRun('huffman', input, {})).toThrow()
  })

  it('顺序、分块与散列查找覆盖命中、失败和冲突路径', () => {
    expect(topicRun('sequential', '9, 3, 7', { target: 7 }).steps.at(-1)?.variables?.result).toBe(2)
    expect(topicRun('sequential', '9, 3, 7', { target: 4 }).steps.at(-1)?.variables?.result).toBe(-1)
    const block = topicRun('block', '1, 3, 5, 8, 11, 15', { target: 11 }).steps
    expect(block.at(-1)?.variables?.result).toBe(4)
    expect(block.some(step => step.state.blocks?.length === 2 && step.state.blockIndex === 1)).toBe(true)
    expect(topicRun('block', '1, 3, 5', { target: 4 }).steps.at(-1)?.variables?.result).toBe(-1)
    expect(() => topicRun('block', '3, 1', { target: 1 })).toThrow('升序')
    const hash = topicRun('hash', '22, 33, 44', { target: 44 }).steps
    expect(hash.at(-1)?.variables?.result).toBe(2)
    expect(hash.at(-1)?.state.hashSlots?.slice(0, 3)).toEqual([22, 33, 44])
    expect(hash.filter(step => step.description.includes('占用'))).toHaveLength(3)
    expect(topicRun('hash', '22, 33', { target: 44 }).steps.at(-1)?.variables?.result).toBe(-1)
    expect(() => topicRun('hash', '2, 2', { target: 2 })).toThrow('不重复')
  })

  it('AVL 的 LL、RR、LR、RL 旋转均恢复根节点平衡', () => {
    for (const input of ['30,20,10', '10,20,30', '30,10,20', '10,30,20']) {
      const steps = topicRun('avl', input, { target: 20 }).steps
      const last = steps.at(-1)!.state
      expect(last.values[last.root!]).toBe(20)
      expect(last.edges).toHaveLength(2)
      expect(last.depths?.filter(depth => depth === 1)).toHaveLength(2)
      expect(steps.filter(step => step.description.includes('旋'))).not.toHaveLength(0)
      expect(steps.at(-1)?.variables?.result).not.toBe(-1)
    }
    expect(topicRun('avl', '30,20,10', { target: 99 }).steps.at(-1)?.variables?.result).toBe(-1)
    expect(() => topicRun('avl', '2,2', { target: 2 })).toThrow('不重复')
  })

  it('矩阵按行和按列映射到不同的线性地址，且拒绝形状不匹配', () => {
    const row = topicRun('matrix', '1, 2, 3, 4, 5, 6', { rows: 2, cols: 3, order: 'row' }).steps
    const column = topicRun('matrix', '1, 2, 3, 4, 5, 6', { rows: 2, cols: 3, order: 'column' }).steps
    expect(row.at(-1)?.state.linear).toEqual([1, 2, 3, 4, 5, 6])
    expect(column.at(-1)?.state.linear).toEqual([1, 4, 2, 5, 3, 6])
    expect(column[2].state.linear).toEqual([1, null, null, null, null, null])
    expect(column[0].state.linear).toEqual([null, null, null, null, null, null])
    expect(() => topicRun('matrix', '1, 2, 3', { rows: 2, cols: 2, order: 'row' })).toThrow('乘积')
  })

  it('对称矩阵只保存下三角，镜像元素映射到同一地址', () => {
    const steps = topicRun('matrix', '1, 2, 3, 2, 4, 5, 3, 5, 6', { rows: 3, cols: 3, order: 'symmetric' }).steps
    expect(steps.at(-1)?.state.linear).toEqual([1, 2, 4, 3, 5, 6])
    expect(steps.find(step => step.state.cell?.[0] === 1 && step.state.cell?.[1] === 0)?.state.active).toEqual([3, 1])
    expect(steps.at(-1)?.state.writes).toBe(6)
    expect(() => topicRun('matrix', '1, 2, 3, 4', { rows: 2, cols: 2, order: 'symmetric' })).toThrow('镜像')
    expect(() => topicRun('matrix', '1, 2', { rows: 1, cols: 2, order: 'symmetric' })).toThrow('方阵')
  })

  it('上、下三角和三对角矩阵按各自公式紧凑存储', () => {
    const cases = [
      { order: 'lower' as const, input: '1,0,0, 2,3,0, 4,5,6', rows: 3, expected: [1,2,3,4,5,6] },
      { order: 'upper' as const, input: '1,2,3, 0,4,5, 0,0,6', rows: 3, expected: [1,2,3,4,5,6] },
      { order: 'band' as const, input: '1,2,0,0, 3,4,5,0, 0,6,7,8, 0,0,9,10', rows: 4, expected: [1,2,3,4,5,6,7,8,9,10] },
    ]
    for (const item of cases) {
      const run = topicRun('matrix', item.input, { rows: item.rows, cols: item.rows, order: item.order })
      expect(run.steps.at(-1)?.state.linear).toEqual(item.expected)
      expect(run.steps.at(-1)?.state.writes).toBe(item.expected.length)
      for (const step of run.steps) for (const language of ['C','C++','Python'] as const) expect(step.highlightedLines[language].length).toBeGreaterThan(0)
    }
    expect(() => topicRun('matrix', '1,2,3,4', { rows: 2, cols: 2, order: 'lower' })).toThrow('必须为 0')
    expect(() => topicRun('matrix', '1,2,3,4', { rows: 2, cols: 2, order: 'upper' })).toThrow('必须为 0')
    expect(() => topicRun('matrix', '1,2,0,3,4,5,0,6,7', { rows: 3, cols: 3, order: 'band' })).not.toThrow()
    expect(() => topicRun('matrix', '1,2,3,4', { rows: 1, cols: 4, order: 'band' })).toThrow('方阵')
  })

  it('稀疏矩阵仅追加非零三元组，零矩阵得到空表', () => {
    const run = topicRun('matrix', '0,5,0, 0,0,7', { rows: 2, cols: 3, order: 'sparse' })
    expect(run.steps.at(-1)?.state.triples).toEqual([[0,1,5],[1,2,7]])
    expect(run.steps[0].state.triples).toEqual([])
    expect(run.steps.some(step => step.description.includes('不写入三元组表'))).toBe(true)
    for (const step of run.steps) for (const language of ['C','C++','Python'] as const) expect(step.highlightedLines[language].length).toBeGreaterThan(0)
    expect(topicRun('matrix', '0,0,0,0', { rows: 2, cols: 2, order: 'sparse' }).steps.at(-1)?.state.triples).toEqual([])
  })

  it('KMP 构造 next、失配后回退且主串位置不回退', () => {
    const run = topicRun('kmp', 'ABABABC', { pattern: 'ABABC' })
    const steps = run.steps
    expect(steps.find(step => step.description.includes('next[4] = 0'))?.state.next).toEqual([0, 0, 1, 2, 0])
    const mismatch = steps.findIndex(step => step.description.includes('j 从 4 回退到'))
    expect(mismatch).toBeGreaterThan(0)
    expect(steps[mismatch].variables?.i).toBe(4)
    expect(steps[mismatch].highlightedLines['C++'].map(line => run.code['C++'][line - 1])).toEqual(['    } else if (j > 0) j = next[j - 1];'])
    expect(steps.at(-1)?.variables?.result).toBe(2)
    expect(topicRun('kmp', 'AAAA', { pattern: 'AAAB' }).steps.at(-1)?.variables?.result).toBe(-1)
    expect(() => topicRun('kmp', 'a!', { pattern: 'a' })).toThrow('主串')
    expect(() => topicRun('kmp', 'ABC', { pattern: '' })).toThrow('模式串')
  })

  it('KMP 对短主串与模式串的结果与字符串查找一致', () => {
    const words = (max: number) => Array.from({ length: 2 ** (max + 1) - 1 }, (_, index) => {
      const bits = (index + 1).toString(2).slice(1)
      return bits.replaceAll('0', 'A').replaceAll('1', 'B')
    })
    for (const text of words(5)) for (const pattern of words(3).filter(Boolean)) {
      expect(topicRun('kmp', text, { pattern }).steps.at(-1)?.variables?.result).toBe(text.indexOf(pattern))
    }
  })

  it('二叉排序树逐个插入并展示查找路径和结果', () => {
    const found = topicRun('bst', '8, 4, 12, 2, 6, 10, 14', { target: 10 })
    expect(found.steps.at(-1)?.variables?.result).toBe(5)
    expect(found.steps.at(-1)?.state.output).toEqual([8, 12, 10])
    expect(found.steps.at(-1)?.state.edges).toEqual([[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]])
    expect(topicRun('bst', '8, 4, 12', { target: 9 }).steps.at(-1)?.variables?.result).toBe(-1)
    expect(topicRun('bst', '', { target: 9 }).steps.at(-1)?.variables?.result).toBe(-1)
    expect(() => topicRun('bst', '8, 4, 8', { target: 8 })).toThrow('重复')
    expect(() => topicRun('bst', '8', { target: Number.NaN })).toThrow('目标值')
  })

  it('Prim 选出最小生成树并累计总权重', () => {
    const input = '0, 1, 2, 3'
    const edges = '0-1:1, 0-2:4, 1-2:2, 1-3:5, 2-3:3'
    const steps = topicRun('prim', input, { edges, start: 0 }).steps
    expect(steps.at(-1)?.state.selectedEdges).toEqual([[0, 1], [1, 2], [2, 3]])
    expect(steps.at(-1)?.variables?.total).toBe(6)
    expect(topicRun('prim', '7', { edges: '', start: 0 }).steps.at(-1)?.variables?.total).toBe(0)
    expect(topicRun('prim', '0, 1, 2', { edges: '0-2:1, 0-1:1, 1-2:3', start: 0 }).steps.at(-1)?.state.selectedEdges).toEqual([[0, 2], [0, 1]])
    expect(() => topicRun('prim', input, { edges: '0-1:2', start: 0 })).toThrow('不连通')
  })

  it('Kruskal 按权重选无环边，得到与 Prim 一致的总权重', () => {
    const input = '0, 1, 2, 3'
    const edges = '0-1:1, 1-2:2, 0-2:2, 1-3:5, 2-3:3'
    const steps = topicRun('kruskal', input, { start: 0, edges }).steps
    expect(steps.at(-1)?.state.selectedEdges).toEqual([[0, 1], [1, 2], [2, 3]])
    expect(steps.at(-1)?.variables?.total).toBe(6)
    expect(steps.some(step => step.description.includes('成环'))).toBe(true)
    expect(topicRun('prim', input, { start: 0, edges }).steps.at(-1)?.variables?.total).toBe(6)
    expect(() => topicRun('kruskal', input, { start: 0, edges: '0-1:2' })).toThrow('不连通')
  })

  it('Dijkstra 更新更短路径，并处理不可达与无效边', () => {
    const input = '0, 1, 2, 3'
    const edges = '0-1:5, 0-2:1, 2-1:1, 1-3:1'
    const steps = topicRun('dijkstra', input, { edges, start: 0, target: 3 }).steps
    expect(steps.at(-1)?.variables?.result).toBe(3)
    expect(steps.at(-1)?.state.output).toEqual([0, 2, 1, 3])
    expect(steps.some(step => step.state.distances?.[1] === 5)).toBe(true)
    expect(steps.some(step => step.state.distances?.[1] === 2)).toBe(true)
    expect(topicRun('dijkstra', input, { edges: '0-1:2', start: 0, target: 3 }).steps.at(-1)?.variables?.result).toBe(-1)
    expect(topicRun('dijkstra', '0, 1', { edges: '0-1:0', start: 0, target: 1 }).steps.at(-1)?.variables?.result).toBe(0)
    expect(topicRun('dijkstra', '0', { edges: '', start: 0, target: 0 }).steps.at(-1)?.state.output).toEqual([0])
    for (const bad of ['0-1:-1', '0-1:100', '0-4:2', '0-1:2, 1-0:3', '0-0:2']) {
      expect(() => topicRun('dijkstra', input, { edges: bad, start: 0, target: 3 })).toThrow()
    }
  })

  it('Floyd 逐轮更新距离矩阵，重建有向路径并处理不可达', () => {
    const steps = topicRun('floyd', '0,1,2,3', { edges: '0-1:2,0-2:9,1-2:3,1-3:8,2-3:1', start: 0, target: 3 }).steps
    expect(steps[0].state.distanceMatrix?.[0][3]).toBe(Infinity)
    expect(steps.at(-1)?.state.distanceMatrix?.[0][3]).toBe(6)
    expect(steps.at(-1)?.state.output).toEqual([0, 1, 2, 3])
    expect(steps.at(-1)?.variables?.result).toBe(6)
    expect(topicRun('floyd', '0,1,2', { edges: '0-1:2', start: 1, target: 2 }).steps.at(-1)?.variables?.result).toBe(-1)
    expect(topicRun('floyd', '0,1', { edges: '', start: 0, target: 0 }).steps.at(-1)?.state.output).toEqual([0])
    for (const edges of ['0-1:-1', '0-2:1', '0-1:2,0-1:3', '0-0:1']) expect(() => topicRun('floyd', '0,1', { edges, start: 0, target: 1 })).toThrow()
  })

  it('拓扑排序逐步降低入度并拒绝环', () => {
    const steps = topicRun('topological', '0,1,2,3', { edges: '0-1,0-2,1-3,2-3' }).steps
    expect(steps[0].state.indegrees).toEqual([0,1,1,2])
    expect(steps.at(-1)?.state.output).toEqual([0,1,2,3])
    expect(steps.some(step => step.state.indegrees?.[3] === 1)).toBe(true)
    expect(() => topicRun('topological', '0,1', { edges: '0-1,1-0' })).toThrow('环')
    expect(() => topicRun('topological', '0,1', { edges: '0-1,0-1' })).toThrow('重复')
  })

  it('关键路径计算事件时间和零余量活动', () => {
    const steps = topicRun('critical', '0,1,2,3,4', { edges: '0-1:3,0-2:2,1-3:4,2-3:6,3-4:2' }).steps
    expect(steps.at(-1)?.variables?.duration).toBe(10)
    expect(steps.at(-1)?.state.earliest).toEqual([0,3,2,8,10])
    expect(steps.at(-1)?.state.latest).toEqual([0,4,2,8,10])
    expect(steps.at(-1)?.state.selectedEdges).toEqual([[0,2],[2,3],[3,4]])
    expect(() => topicRun('critical', '0,1,2', { edges: '0-2:2,1-2:3' })).toThrow('单一起点')
  })

  it('循环队列在固定槽位入队、出队并检查边界', () => {
    const added = topicRun('circularQueue', '12,25,37', { operation:'insert', value:99 }).steps
    expect(added.at(-1)?.state.slots).toEqual([37,99,null,null,12,25])
    expect(added.at(-1)?.state.rear).toBe(2)
    const removed = topicRun('circularQueue', '12,25,37', { operation:'remove' }).steps
    expect(removed.at(-1)?.state.values).toEqual([25,37])
    expect(removed.at(-1)?.state.front).toBe(5)
    expect(() => topicRun('circularQueue', '1,2,3,4,5', { operation:'insert', value:6 })).toThrow('已满')
    expect(() => topicRun('circularQueue', '', { operation:'remove' })).toThrow('为空')
  })

  it('括号匹配展示入栈、弹栈与首个失配位置', () => {
    const success = topicRun('brackets', '([{}])', {}).steps
    expect(success.at(-1)?.variables?.result).toBe(1)
    expect(success.at(-1)?.state.stackValues).toEqual([])
    expect(success.some(step => step.state.stackValues?.join('') === '([{')).toBe(true)
    expect(topicRun('brackets', '([)]', {}).steps.at(-1)?.variables?.result).toBe(0)
    expect(topicRun('brackets', '(((', {}).steps.at(-1)?.variables?.result).toBe(0)
    expect(() => topicRun('brackets', 'a+b', {})).toThrow('括号')
  })

  it('双栈表达式求值遵守括号和运算优先级', () => {
    const steps = topicRun('expression', '2 + 3 * (4 + 1)', {}).steps
    expect(steps.at(-1)?.variables?.result).toBe(17)
    expect(steps.some(step => step.state.operators?.includes('('))).toBe(true)
    expect(steps.some(step => step.description.includes('4 + 1 = 5'))).toBe(true)
    expect(topicRun('expression', '10 / 4 - 1', {}).steps.at(-1)?.variables?.result).toBe(1.5)
    for (const bad of ['1/0', '(1+2', '2+', '2(3)', '-1+2', '1 2']) expect(() => topicRun('expression', bad, {})).toThrow()
  })

  it('中序线索二叉树只在线索化空孩子指针时连接前驱与后继', () => {
    const steps = topicRun('threaded', '8,4,12,2,6,10,14', {}).steps
    expect(steps.at(-1)?.state.output).toEqual([2,4,6,8,10,12,14])
    expect(steps.at(-1)?.state.threads).toEqual([[3,1,'right'],[4,1,'left'],[4,0,'right'],[5,0,'left'],[5,2,'right'],[6,2,'left']])
    expect(steps[0].state.threads).toEqual([])
    expect(topicRun('threaded', '9', {}).steps.at(-1)?.state.threads).toEqual([])
    expect(() => topicRun('threaded', '', {})).toThrow('1 至 7')
  })

  it('四类链表逐步修改指针，并支持创建、增删查改、遍历与清空', () => {
    for (const id of ['linked','circularLinked','doublyLinked','circularDoublyLinked'] as const) {
      const circular = id.includes('circular'), doubly = id === 'doublyLinked' || id === 'circularDoublyLinked'
      const inserted = topicRun(id, '10,20,30', {operation:'insert',position:1,value:15}).steps
      const last = inserted.at(-1)!.state
      expect(last.values).toEqual([10,15,20,30])
      expect(inserted.some(step => step.description.includes('尚未接入'))).toBe(true)
      const ids = [0,3,1,2], nodes = last.listNodes!
      for(let i=0;i<ids.length;i++) {
        const node = nodes.find(item=>item.id===ids[i])!
        expect(node.next).toBe(ids[i+1]??(circular?ids[0]:null))
        expect(node.prev).toBe(doubly ? ids[i-1]??(circular?ids.at(-1)!:null) : null)
      }
      expect(topicRun(id,'10,20,30',{operation:'remove',position:0}).steps.at(-1)?.state.values).toEqual([20,30])
      expect(topicRun(id,'10,20,30',{operation:'search',target:20}).steps.at(-1)?.variables?.result).toBe(1)
      expect(topicRun(id,'10,20,30',{operation:'search',target:99}).steps.at(-1)?.variables?.result).toBe(-1)
      expect(topicRun(id,'10,20,30',{operation:'traverse'}).steps.at(-1)?.state.output).toEqual([10,20,30])
      expect(topicRun(id,'10,20,30',{operation:'modify',position:1,value:25}).steps.at(-1)?.state.values).toEqual([10,25,30])
      expect(topicRun(id,'10,20,30',{operation:'clear'}).steps.at(-1)?.state.listNodes).toEqual([])
      expect(topicRun(id,'10,20,30',{operation:'create'}).steps.at(-1)?.state.values).toEqual([10,20,30])
      expect(topicRun(id,'10',{operation:'remove',position:0}).steps.at(-1)?.state.head).toBeNull()
    }
  })

  it('顺序表支持创建、查找、遍历、修改与清空', () => {
    expect(topicRun('array','3,5,7',{operation:'create'}).steps.map(step=>step.state.values.length)).toEqual([0,1,2,3,3])
    expect(topicRun('array','3,5,7',{operation:'search',target:5}).steps.at(-1)?.variables?.result).toBe(1)
    expect(topicRun('array','3,5,7',{operation:'search',target:9}).steps.at(-1)?.variables?.result).toBe(-1)
    expect(topicRun('array','3,5,7',{operation:'traverse'}).steps.at(-1)?.state.output).toEqual([3,5,7])
    expect(topicRun('array','3,5,7',{operation:'modify',position:1,value:8}).steps.at(-1)?.state.values).toEqual([3,8,7])
    expect(topicRun('array','3,5,7',{operation:'clear'}).steps.at(-1)?.state.values).toEqual([])
    expect(() => topicRun('array','3,5,7',{operation:'modify',position:3,value:8})).toThrow('有效下标')
  })

  it('链栈从表头进出，链队列从表尾入、表头出', () => {
    const stack = topicRun('linkedStack','10,20',{operation:'insert',value:30}).steps.at(-1)!.state
    expect(stack.values).toEqual([30,10,20])
    expect(stack.head).toBe(2)
    expect(topicRun('linkedStack','10,20',{operation:'remove'}).steps.at(-1)?.state.values).toEqual([20])
    const queue = topicRun('linkedQueue','10,20',{operation:'insert',value:30}).steps.at(-1)!.state
    expect(queue.values).toEqual([10,20,30])
    expect(queue.listNodes?.at(-1)?.next).toBeNull()
    expect(topicRun('linkedQueue','10,20',{operation:'remove'}).steps.at(-1)?.state.values).toEqual([20])
    expect(topicRun('linkedQueue','10',{operation:'remove'}).steps.at(-1)?.state.head).toBeNull()
    expect(() => topicRun('linkedQueue','',{operation:'remove'})).toThrow('为空')
  })

  it('串的六种基本操作逐字符产生步骤并校验范围', () => {
    expect(topicRun('stringOps','DATA',{operation:'length'}).steps.at(-1)?.variables?.result).toBe(4)
    expect(topicRun('stringOps','DATA',{operation:'concat',pattern:'LAB'}).steps.at(-1)?.state.values.join('')).toBe('DATALAB')
    expect(topicRun('stringOps','DATA',{operation:'substring',position:1,count:2}).steps.at(-1)?.state.output.join('')).toBe('AT')
    expect(topicRun('stringOps','DATA',{operation:'insert',position:2,pattern:'X'}).steps.at(-1)?.state.values.join('')).toBe('DAXTA')
    expect(topicRun('stringOps','DATA',{operation:'remove',position:1,count:2}).steps.at(-1)?.state.values.join('')).toBe('DA')
    expect(topicRun('stringOps','DATA',{operation:'compare',pattern:'DATE'}).steps.at(-1)?.variables?.result).toBe(-1)
    expect(topicRun('stringOps','DATA',{operation:'compare',pattern:'DATA'}).steps.at(-1)?.variables?.result).toBe(0)
    expect(() => topicRun('stringOps','DATA',{operation:'substring',position:3,count:3})).toThrow('越过')
  })

  it('二叉树按层序空位创建，插入空孩子并删除整棵子树', () => {
    const raw='8,4,12,2,#,10,14'
    const created=topicRun('treeEdit',raw,{operation:'create'}).steps
    expect(created[0].state.treeSlots?.every(value=>value===null)).toBe(true)
    expect(created.at(-1)?.state.treeSlots?.slice(0,7)).toEqual([8,4,12,2,null,10,14])
    expect(topicRun('treeEdit',raw,{operation:'insert',position:4,value:6}).steps.at(-1)?.state.treeSlots?.[4]).toBe(6)
    const removed=topicRun('treeEdit',raw,{operation:'remove',position:2}).steps.at(-1)!.state.treeSlots!
    expect(removed.slice(0,7)).toEqual([8,4,null,2,null,null,null])
    expect(() => topicRun('treeEdit','8,#,12,2',{operation:'create'})).toThrow('父节点')
    expect(() => topicRun('treeEdit',raw,{operation:'insert',position:1,value:5})).toThrow('必须为空')
  })

  it('普通多叉树支持先根、后根和层序遍历，并拒绝非法父子关系', () => {
    const input='0,1,2,3,4,5',edges='0-1,0-2,0-3,1-4,1-5'
    expect(topicRun('generalTree',input,{order:'pre',edges}).steps.at(-1)?.state.output).toEqual([0,1,4,5,2,3])
    expect(topicRun('generalTree',input,{order:'post',edges}).steps.at(-1)?.state.output).toEqual([4,5,1,2,3,0])
    expect(topicRun('generalTree',input,{order:'level',edges}).steps.at(-1)?.state.output).toEqual([0,1,2,3,4,5])
    expect(topicRun('generalTree',input,{order:'pre',edges}).steps[0].state.depths).toEqual([0,1,1,1,2,2])
    expect(() => topicRun('generalTree','0,1,2',{order:'pre',edges:'0-1,2-1'})).toThrow('多个父亲')
    expect(() => topicRun('generalTree','0,1,2',{order:'pre',edges:'0-1'})).toThrow('n−1')
  })
})
