export type HuffmanNode = { id: number; weight: number; symbol?: string; left?: number; right?: number }
export type HuffmanFrame = {
  tag: 'init' | 'select' | 'merge' | 'edge' | 'code' | 'done'
  text: string
  values: number[]
  huffmanNodes: HuffmanNode[]
  roots: number[]
  codes: Record<string, string>
  active: number[]
  done: number[]
  output: string[]
  comparisons: number
  writes: number
  edge?: [number, number]
  vars: Record<string, string | number>
}

export function huffmanTrace(weights: number[]): HuffmanFrame[] {
  // shortcut: fixed A–H labels keep the tree legible; add custom labels with a wider diagram.
  if (weights.length < 2 || weights.length > 8 || weights.some(weight => !Number.isInteger(weight) || weight < 1 || weight > 99)) throw new Error('请输入 2 至 8 个 1 至 99 的正整数权重。')
  const nodes: HuffmanNode[] = weights.map((weight, id) => ({ id, weight, symbol: String.fromCharCode(65 + id) }))
  let roots = nodes.map(node => node.id)
  const codes: Record<string, string> = {}, output: string[] = [], done: number[] = [], frames: HuffmanFrame[] = []
  let comparisons = 0, merges = 0
  const emit = (tag: HuffmanFrame['tag'], text: string, active: number[] = [], vars: HuffmanFrame['vars'] = {}, edge?: [number, number]) => frames.push({
    tag, text, values: [...weights], huffmanNodes: nodes.map(node => ({ ...node })), roots: [...roots], codes: { ...codes },
    active: [...active], done: [...done], output: [...output], comparisons, writes: merges, edge, vars,
  })
  const less = (a: number, b: number) => {
    comparisons++
    return nodes[a].weight < nodes[b].weight || (nodes[a].weight === nodes[b].weight && a < b)
  }
  emit('init', '每个符号先是一棵单节点树；每轮合并权重最小的两棵树。', [], { trees: roots.length })
  while (roots.length > 1) {
    let first = -1, second = -1
    for (const id of roots) {
      if (first < 0 || less(id, first)) { second = first; first = id }
      else if (second < 0 || less(id, second)) second = id
    }
    const left = nodes[first], right = nodes[second]
    emit('select', `选中最小的两棵树：${left.symbol ?? left.weight}（${left.weight}）与 ${right.symbol ?? right.weight}（${right.weight}）。`, [first, second], { left: left.weight, right: right.weight })
    const parent: HuffmanNode = { id: nodes.length, weight: left.weight + right.weight, left: first, right: second }
    nodes.push(parent)
    roots = roots.filter(id => id !== first && id !== second)
    roots.push(parent.id)
    merges++
    emit('merge', `合并为权重 ${parent.weight} 的新树；左边记 0，右边记 1。`, [parent.id], { sum: parent.weight, trees: roots.length })
  }
  const visit = (id: number, prefix: string) => {
    const node = nodes[id]
    if (node.symbol) {
      codes[node.symbol] = prefix
      output.push(`${node.symbol}: ${prefix}`)
      done.push(id)
      emit('code', `${node.symbol} 的编码是 ${prefix}，由根到叶的 0/1 路径组成。`, [id], { symbol: node.symbol, code: prefix })
      return
    }
    for (const [child, bit] of [[node.left!, '0'], [node.right!, '1']] as const) {
      emit('edge', `沿 ${bit} 边前进，当前编码前缀为 ${prefix + bit}。`, [id, child], { bit, prefix: prefix + bit }, [id, child])
      visit(child, prefix + bit)
    }
  }
  visit(roots[0], '')
  const cost = weights.reduce((sum, weight, index) => sum + weight * codes[String.fromCharCode(65 + index)].length, 0)
  emit('done', `所有符号已编码，加权路径长度为 ${cost}。`, [], { cost })
  return frames
}

export const huffmanSnippet = {
  C: [
    { tag: 'init', text: 'while (count > 1) {' },
    { tag: 'select', text: '  int i = find_min(forest, count);' },
    { tag: 'select', text: '  Node *left = take_at(forest, &count, i);' },
    { tag: 'select', text: '  int j = find_min(forest, count);' },
    { tag: 'select', text: '  Node *right = take_at(forest, &count, j);' },
    { tag: 'merge', text: '  forest[count++] = join(left, right);' },
    { tag: 'merge', text: '}' },
    { tag: 'edge', text: 'void encode(Node *node, char *path) {' },
    { tag: 'code', text: '  if (node->symbol) { save_code(node->symbol, path); return; }' },
    { tag: 'edge', text: '  encode(node->left, append(path, \'0\'));' },
    { tag: 'edge', text: '  encode(node->right, append(path, \'1\'));' },
    { tag: 'done', text: '}' },
  ],
  'C++': [
    { tag: 'init', text: 'while (forest.size() > 1) {' },
    { tag: 'select', text: '  auto a = min_element(forest.begin(), forest.end(), byWeight);' },
    { tag: 'select', text: '  auto left = *a; forest.erase(a);' },
    { tag: 'select', text: '  auto b = min_element(forest.begin(), forest.end(), byWeight);' },
    { tag: 'select', text: '  auto right = *b; forest.erase(b);' },
    { tag: 'merge', text: '  forest.push_back(join(left, right));' },
    { tag: 'merge', text: '}' },
    { tag: 'edge', text: 'void encode(const Node& node, string path) {' },
    { tag: 'code', text: '  if (node.symbol) { codes[node.symbol] = path; return; }' },
    { tag: 'edge', text: '  encode(*node.left, path + "0");' },
    { tag: 'edge', text: '  encode(*node.right, path + "1");' },
    { tag: 'done', text: '}' },
  ],
  Python: [
    { tag: 'init', text: 'while len(forest) > 1:' },
    { tag: 'select', text: '    left = min(forest, key=lambda n: (n.weight, n.id))' },
    { tag: 'select', text: '    forest.remove(left)' },
    { tag: 'select', text: '    right = min(forest, key=lambda n: (n.weight, n.id))' },
    { tag: 'select', text: '    forest.remove(right)' },
    { tag: 'merge', text: '    forest.append(Node(left.weight + right.weight, left, right))' },
    { tag: 'edge', text: 'def encode(node, path):' },
    { tag: 'code', text: '    if node.symbol: codes[node.symbol] = path; return' },
    { tag: 'edge', text: '    encode(node.left, path + "0")' },
    { tag: 'edge', text: '    encode(node.right, path + "1")' },
    { tag: 'done', text: 'encode(forest[0], "")' },
  ],
} as const
