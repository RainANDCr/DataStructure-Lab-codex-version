type Node = { value: number; left: number | null; right: number | null; parent: number | null; height: number }
export type AvlFrame = { tag: string; text: string; values: number[]; active: number[]; done: number[]; output: number[]; comparisons: number; writes: number; edges: [number, number][]; depths: number[]; layoutValues: number[]; root: number | null; vars: Record<string, number | string> }

export function avlTrace(input: number[], target: number): AvlFrame[] {
  if (input.length > 10 || new Set(input).size !== input.length) throw new Error('AVL 树最多支持 10 个不重复的整数。')
  if (!Number.isInteger(target) || Math.abs(target) > 99) throw new Error('目标值必须是 -99 至 99 的整数。')
  const nodes: Node[] = [], frames: AvlFrame[] = [], done: number[] = [], output: number[] = []
  let root: number | null = null, comparisons = 0, writes = 0
  const height = (id: number | null) => id === null ? 0 : nodes[id].height
  const update = (id: number) => { nodes[id].height = 1 + Math.max(height(nodes[id].left), height(nodes[id].right)) }
  const balance = (id: number) => height(nodes[id].left) - height(nodes[id].right)
  const emit = (tag: string, text: string, active: number[] = [], vars: AvlFrame['vars'] = {}) => {
    const edges: [number, number][] = [], depths = nodes.map(() => 0)
    const walk = (id: number, depth: number) => { depths[id] = depth; for (const child of [nodes[id].left, nodes[id].right]) if (child !== null) { edges.push([id, child]); walk(child, depth + 1) } }
    if (root !== null) walk(root, 0)
    frames.push({ tag, text, values: nodes.map(node => node.value), active: [...active], done: [...done], output: [...output], comparisons, writes, edges, depths, layoutValues: [...input].sort((a,b) => a-b), root, vars: { target, ...vars } })
  }
  const replace = (oldId: number, newId: number) => {
    const parent = nodes[oldId].parent
    nodes[newId].parent = parent
    if (parent === null) root = newId
    else if (nodes[parent].left === oldId) nodes[parent].left = newId
    else nodes[parent].right = newId
  }
  const rotateLeft = (x: number) => {
    const y = nodes[x].right!
    nodes[x].right = nodes[y].left
    if (nodes[y].left !== null) nodes[nodes[y].left!].parent = x
    replace(x, y)
    nodes[y].left = x; nodes[x].parent = y
    update(x); update(y); writes++
    emit('rotate-left', `以 ${nodes[x].value} 为轴左旋，${nodes[y].value} 上升。`, [x, y], { axis: nodes[x].value, balance: balance(y) })
  }
  const rotateRight = (y: number) => {
    const x = nodes[y].left!
    nodes[y].left = nodes[x].right
    if (nodes[x].right !== null) nodes[nodes[x].right!].parent = y
    replace(y, x)
    nodes[x].right = y; nodes[y].parent = x
    update(y); update(x); writes++
    emit('rotate-right', `以 ${nodes[y].value} 为轴右旋，${nodes[x].value} 上升。`, [y, x], { axis: nodes[y].value, balance: balance(x) })
  }
  emit('init', '从空树开始逐个插入；每次回溯时检查平衡因子。')
  for (const value of input) {
    const id = nodes.length
    const path: number[] = []
    let parent: number | null = null, current = root
    while (current !== null) {
      parent = current; path.push(current); comparisons++
      emit('compare', `比较 ${value} 与节点 ${nodes[current].value}。`, [current], { value, node: nodes[current].value })
      current = value < nodes[current].value ? nodes[current].left : nodes[current].right
    }
    nodes.push({ value, left: null, right: null, parent, height: 1 })
    if (parent === null) root = id
    else if (value < nodes[parent].value) nodes[parent].left = id
    else nodes[parent].right = id
    writes++
    emit('insert', `插入 ${value}${parent === null ? ' 作为根节点' : `，连接到 ${nodes[parent].value} 的${value < nodes[parent].value ? '左' : '右'}侧`}。`, [id], { value })
    for (let i = path.length - 1; i >= 0; i--) {
      const at = path[i]
      update(at)
      const factor = balance(at)
      emit('balance', `节点 ${nodes[at].value} 的平衡因子为 ${factor}。`, [at], { node: nodes[at].value, factor })
      if (factor > 1) {
        if (balance(nodes[at].left!) < 0) rotateLeft(nodes[at].left!)
        rotateRight(at)
      } else if (factor < -1) {
        if (balance(nodes[at].right!) > 0) rotateRight(nodes[at].right!)
        rotateLeft(at)
      }
    }
  }
  emit('built', `AVL 树已建好，根节点为 ${root === null ? '空' : nodes[root].value}；开始查找 ${target}。`, [], { n: nodes.length })
  let current = root
  while (current !== null) {
    comparisons++; done.push(current); output.push(nodes[current].value)
    emit('search', `比较目标 ${target} 与节点 ${nodes[current].value}。`, [current], { node: nodes[current].value })
    if (nodes[current].value === target) { emit('found', `找到 ${target}，查找路径为 ${output.join(' → ')}。`, [current], { result: current }); return frames }
    current = target < nodes[current].value ? nodes[current].left : nodes[current].right
  }
  emit('miss', `查找结束，未找到 ${target}。`, [], { result: -1 })
  return frames
}

const source: Record<'C' | 'C++' | 'Python', string> = {
  C: `init|Node* avl_insert(Node* root, int x) {
insert|  if (!root) return new_node(x);
compare|  if (x < root->value) root->left = avl_insert(root->left, x);
compare|  else root->right = avl_insert(root->right, x);
balance|  update_height(root); int b = balance(root);
rotate-left|  if (b > 1 && x > root->left->value) root->left = rotate_left(root->left);
rotate-right|  if (b < -1 && x < root->right->value) root->right = rotate_right(root->right);
rotate-right|  if (b > 1) return rotate_right(root);
rotate-left|  if (b < -1) return rotate_left(root);
built|  return root;
built|}
search|Node* avl_find(Node* root, int x) { while (root) {
found|  if (root->value == x) return root;
search|  root = x < root->value ? root->left : root->right;
miss|} return NULL; }`,
  'C++': `init|Node* avlInsert(Node* root, int x) {
insert|  if (!root) return new Node{x};
compare|  if (x < root->value) root->left = avlInsert(root->left, x);
compare|  else root->right = avlInsert(root->right, x);
balance|  updateHeight(root); int b = balance(root);
rotate-left|  if (b > 1 && x > root->left->value) root->left = rotateLeft(root->left);
rotate-right|  if (b < -1 && x < root->right->value) root->right = rotateRight(root->right);
rotate-right|  if (b > 1) return rotateRight(root);
rotate-left|  if (b < -1) return rotateLeft(root);
built|  return root;
built|}
search|Node* avlFind(Node* root, int x) { while (root) {
found|  if (root->value == x) return root;
search|  root = x < root->value ? root->left : root->right;
miss|} return nullptr; }`,
  Python: `init|def avl_insert(root, x):
insert|    if root is None: return Node(x)
compare|    if x < root.value: root.left = avl_insert(root.left, x)
compare|    else: root.right = avl_insert(root.right, x)
balance|    update_height(root); b = balance(root)
rotate-left|    if b > 1 and x > root.left.value: root.left = rotate_left(root.left)
rotate-right|    if b < -1 and x < root.right.value: root.right = rotate_right(root.right)
rotate-right|    if b > 1: return rotate_right(root)
rotate-left|    if b < -1: return rotate_left(root)
built|    return root
search|def avl_find(root, x):
search|    while root is not None:
found|        if root.value == x: return root
search|        root = root.left if x < root.value else root.right
miss|    return None`,
}
export const avlSnippet = Object.fromEntries(Object.entries(source).map(([language, text]) => [language, text.split('\n').map(row => { const divider = row.indexOf('|'); return { tag: row.slice(0, divider), text: row.slice(divider + 1) } })])) as Record<'C' | 'C++' | 'Python', { tag: string; text: string }[]>
