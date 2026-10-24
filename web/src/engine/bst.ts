type BstNode = { value: number; left: number; right: number; depth: number }
export type BstFrame = { tag: string; text: string; values: number[]; active: number[]; done: number[]; output: number[]; comparisons: number; writes: number; edges: [number, number][]; depths: number[]; layoutValues: number[]; vars: Record<string, number | string> }

export function bstTrace(input: number[], target: number): BstFrame[] {
  if (input.length > 12) throw new Error('二叉排序树最多支持 12 个节点。')
  if (new Set(input).size !== input.length) throw new Error('二叉排序树不接受重复值，请删除重复节点。')
  if (!Number.isInteger(target) || Math.abs(target) > 99) throw new Error('目标值必须是 -99 至 99 的整数。')
  const nodes: BstNode[] = [], edges: [number, number][] = [], done: number[] = [], output: number[] = [], steps: BstFrame[] = []
  let comparisons = 0, writes = 0
  const emit = (tag: string, text: string, active: number[] = [], vars: Record<string, number | string> = {}) => steps.push({
    tag, text, values: nodes.map(node => node.value), active: [...active], done: [...done], output: [...output], comparisons, writes,
    edges: edges.map(edge => [...edge] as [number, number]), depths: nodes.map(node => node.depth), layoutValues: [...input].sort((a, b) => a - b), vars: { target, ...vars },
  })
  emit('init', '空树已就绪。按输入顺序逐个插入节点，然后查找目标值。')
  for (const value of input) {
    if (!nodes.length) { nodes.push({ value, left: -1, right: -1, depth: 0 }); writes++; emit('root', `插入 ${value}，作为根节点。`, [0], { value }); continue }
    let current = 0
    while (true) {
      comparisons++; emit('compare-insert', `比较待插入值 ${value} 与节点 ${nodes[current].value}。`, [current], { value, node: nodes[current].value })
      const side = value < nodes[current].value ? 'left' : 'right'
      const child = nodes[current][side]
      if (child === -1) {
        const next = nodes.length
        nodes.push({ value, left: -1, right: -1, depth: nodes[current].depth + 1 })
        nodes[current][side] = next; edges.push([current, next]); writes++
        emit(side === 'left' ? 'insert-left' : 'insert-right', `${value} ${side === 'left' ? '小于' : '大于'} ${nodes[current].value}，接到其${side === 'left' ? '左' : '右'}孩子。`, [next], { value, parent: nodes[current].value })
        break
      }
      emit(side, `${value} ${side === 'left' ? '小于' : '大于'} ${nodes[current].value}，沿${side === 'left' ? '左' : '右'}孩子继续。`, [current, child], { value, node: nodes[current].value })
      current = child
    }
  }
  emit('built', `建树完成，共 ${nodes.length} 个节点；开始查找 ${target}。`, [], { n: nodes.length })
  let current = nodes.length ? 0 : -1
  while (current !== -1) {
    comparisons++; done.push(current); output.push(nodes[current].value)
    emit('search', `比较目标 ${target} 与节点 ${nodes[current].value}。`, [current], { node: nodes[current].value })
    if (target === nodes[current].value) { emit('found', `找到目标 ${target}；查找路径：${output.join(' → ')}。`, [current], { result: current }); return steps }
    const side = target < nodes[current].value ? 'left' : 'right'
    emit(side === 'left' ? 'go-left' : 'go-right', `目标${side === 'left' ? '较小' : '较大'}，转向${side === 'left' ? '左' : '右'}子树。`, [current], { node: nodes[current].value })
    current = nodes[current][side]
  }
  emit('miss', `查找路径结束，未找到 ${target}。`, [], { result: -1 })
  return steps
}

const source: Record<'C' | 'C++' | 'Python', string> = {
  C: `init|Node* insert(Node* root, int x) {
root|  if (!root) return new_node(x);
setup|  Node* cur = root;
loop|  while (1) {
compare-insert|    if (x < cur->value) {
insert-left|      if (!cur->left) { cur->left = new_node(x); return root; }
left|      cur = cur->left;
end|    } else {
insert-right|      if (!cur->right) { cur->right = new_node(x); return root; }
right|      cur = cur->right;
end|    }
end|  }
end|}
init|Node* find(Node* root, int target) {
built|  Node* cur = root;
search|  while (cur) {
found|    if (cur->value == target) return cur;
go-left|    if (target < cur->value) cur = cur->left;
go-right|    else cur = cur->right;
end|  }
miss|  return NULL;
end|}`,
  'C++': `init|Node* insert(Node* root, int x) {
root|  if (!root) return new Node{x, nullptr, nullptr};
setup|  Node* cur = root;
loop|  while (true) {
compare-insert|    if (x < cur->value) {
insert-left|      if (!cur->left) { cur->left = new Node{x, nullptr, nullptr}; return root; }
left|      cur = cur->left;
end|    } else {
insert-right|      if (!cur->right) { cur->right = new Node{x, nullptr, nullptr}; return root; }
right|      cur = cur->right;
end|    }
end|  }
end|}
init|Node* find(Node* root, int target) {
built|  Node* cur = root;
search|  while (cur) {
found|    if (cur->value == target) return cur;
go-left|    if (target < cur->value) cur = cur->left;
go-right|    else cur = cur->right;
end|  }
miss|  return nullptr;
end|}`,
  Python: `init|def insert(root, x):
root|    if root is None: return Node(x)
setup|    cur = root
loop|    while True:
compare-insert|        if x < cur.value:
insert-left|            if cur.left is None: cur.left = Node(x); return root
left|            cur = cur.left
end|        else:
insert-right|            if cur.right is None: cur.right = Node(x); return root
right|            cur = cur.right
init|def find(root, target):
built|    cur = root
search|    while cur is not None:
found|        if cur.value == target: return cur
go-left|        if target < cur.value: cur = cur.left
go-right|        else: cur = cur.right
miss|    return None`,
}

export const bstSnippet = Object.fromEntries(Object.entries(source).map(([language, text]) => [language, text.split('\n').map(row => { const divider = row.indexOf('|'); return { tag: row.slice(0, divider), text: row.slice(divider + 1) } })])) as Record<'C' | 'C++' | 'Python', { tag: string; text: string }[]>
