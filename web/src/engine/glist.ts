export type GlistNode = { id: number; parent: number | null; label: string; atom: boolean; depth: number }
export type GlistFrame = {
  tag: 'init' | 'enter' | 'atom' | 'leave' | 'done'
  text: string
  values: string[]
  nodes: GlistNode[]
  active: number[]
  done: number[]
  output: string[]
  comparisons: number
  writes: number
  length: number
  depth: number
  path: number[]
  vars: Record<string, string | number>
}

export function glistTrace(input: string): GlistFrame[] {
  if (input.length > 100) throw new Error('广义表输入最多 100 个字符。')
  // shortcut: keep diagrams to 20 nodes and 5 list levels; raise limits after adding a scalable layout.
  const nodes: GlistNode[] = []
  let cursor = 0
  const skip = () => { while (/\s/.test(input[cursor] ?? '')) cursor++ }
  const parseList = (parent: number | null, depth: number): number => {
    if (depth > 5) throw new Error('广义表最多嵌套 5 层。')
    skip()
    if (input[cursor++] !== '(') throw new Error('广义表必须用括号表示子表。')
    const id = nodes.length
    nodes.push({ id, parent, label: parent === null ? '根表' : '子表', atom: false, depth })
    if (nodes.length > 20) throw new Error('广义表最多 20 个节点。')
    skip()
    if (input[cursor] === ')') { cursor++; return id }
    while (true) {
      skip()
      if (input[cursor] === '(') parseList(id, depth + 1)
      else {
        const match = /^[A-Za-z0-9]+/.exec(input.slice(cursor))
        if (!match) throw new Error('元素只能是英文字母、数字或括号包围的子表。')
        nodes.push({ id: nodes.length, parent: id, label: match[0], atom: true, depth: depth + 1 })
        if (nodes.length > 20) throw new Error('广义表最多 20 个节点。')
        cursor += match[0].length
      }
      skip()
      if (input[cursor] === ')') { cursor++; return id }
      if (input[cursor++] !== ',') throw new Error('元素之间需要逗号，末尾需要右括号。')
    }
  }
  parseList(null, 1)
  skip()
  if (cursor !== input.length) throw new Error('右括号后不能有其他内容。')
  const length = nodes.filter(node => node.parent === 0).length
  const depth = Math.max(...nodes.filter(node => !node.atom).map(node => node.depth))
  const frames: GlistFrame[] = []
  const done: number[] = [], output: string[] = [], path: number[] = []
  const emit = (tag: GlistFrame['tag'], text: string, active: number[] = [], vars: GlistFrame['vars'] = {}) => frames.push({
    tag, text, values: nodes.map(node => node.label), nodes, active: [...active], done: [...done], output: [...output],
    comparisons: 0, writes: output.length, length, depth, path: [...path], vars,
  })
  emit('init', `根表有 ${length} 个直接元素，深度为 ${depth}。从根表开始递归访问。`, [0], { length, depth })
  const visit = (id: number) => {
    const node = nodes[id]
    if (node.atom) {
      output.push(node.label)
      done.push(id)
      emit('atom', `遇到原子 ${node.label}，加入访问结果。`, [id], { atom: node.label, level: node.depth })
      return
    }
    path.push(id)
    const children = nodes.filter(child => child.parent === id)
    emit('enter', `进入${node.label}（第 ${node.depth} 层，${children.length} 个直接元素）。`, [id], { level: node.depth, length: children.length })
    for (const child of children) visit(child.id)
    done.push(id)
    emit('leave', children.length ? `已访问${node.label}的所有元素，返回上一层。` : '空表没有元素，返回上一层。', [id], { level: node.depth })
    path.pop()
  }
  visit(0)
  emit('done', `遍历完成，依次访问 ${output.length} 个原子。`, [], { length, depth, atoms: output.length })
  return frames
}

export const glistSnippet = {
  C: [
    { tag: 'init', text: 'void visit(const Node *node) {' },
    { tag: 'enter', text: '  if (node->kind == LIST) {' },
    { tag: 'enter', text: '    for (const Node *p = node->first; p; p = p->next)' },
    { tag: 'enter', text: '      visit(p);' },
    { tag: 'leave', text: '    return;' },
    { tag: 'leave', text: '  }' },
    { tag: 'atom', text: '  emit(node->value);' },
    { tag: 'done', text: '}' },
  ],
  'C++': [
    { tag: 'init', text: 'void visit(const Node& node) {' },
    { tag: 'enter', text: '  if (!node.isAtom) {' },
    { tag: 'enter', text: '    for (const Node& child : node.children)' },
    { tag: 'enter', text: '      visit(child);' },
    { tag: 'leave', text: '    return;' },
    { tag: 'leave', text: '  }' },
    { tag: 'atom', text: '  output.push_back(node.value);' },
    { tag: 'done', text: '}' },
  ],
  Python: [
    { tag: 'init', text: 'def visit(node):' },
    { tag: 'atom', text: '    if isinstance(node, str):' },
    { tag: 'atom', text: '        output.append(node)' },
    { tag: 'atom', text: '        return' },
    { tag: 'enter', text: '    for child in node:' },
    { tag: 'enter', text: '        visit(child)' },
    { tag: 'leave', text: '    return' },
    { tag: 'done', text: '# output 为按深度优先顺序访问的原子' },
  ],
} as const
