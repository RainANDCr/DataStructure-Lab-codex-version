import type { ExecutionStep, OperationEvent } from './types'

export type MemoryScenario = 'pointer' | 'dynamic' | 'insert' | 'remove' | 'doubleInsert' | 'nullDeref' | 'dangling' | 'useAfterFree' | 'leak' | 'brokenLink' | 'overwrite' | 'outOfBounds'
export type MemoryObject = { id: string; address: string; region: 'stack' | 'heap'; type: string; value: number; name?: string; ownerFrame?: string; next?: string | null; prev?: string | null; status: 'allocated' | 'freed' }
export type PointerReference = { name: string; target: string | null; status: 'valid' | 'null' | 'dangling' }
export type StackFrame = { name: string; locals: { name: string; type: string; value: string; target?: string | null; address?: string }[] }
export type MemorySnapshot = { frames: StackFrame[]; objects: MemoryObject[]; references: PointerReference[]; chain: string[]; warnings: string[] }
export type MemoryStep = ExecutionStep<MemorySnapshot>

export const memoryScenarios: Record<MemoryScenario, { title: string; group: '实验' | '常见错误'; note: string; code: { C: string[]; 'C++': string[] } }> = {
  pointer: { title: '变量与指针', group: '实验', note: '观察栈变量地址、指针赋值和间接写入。', code: { C: ['int a = 10;', 'int *p = NULL;', 'p = &a;', '*p = 20;'], 'C++': ['int a = 10;', 'int* p = nullptr;', 'p = &a;', '*p = 20;'] } },
  dynamic: { title: '动态节点', group: '实验', note: 'new / calloc 创建初始化的堆对象，delete / free 结束其生命周期。', code: { C: ['Node *p = calloc(1, sizeof(Node));', 'p->value = 10;', 'p->next = NULL;', 'free(p);', 'p = NULL;'], 'C++': ['Node* p = new Node{};', 'p->value = 10;', 'p->next = nullptr;', 'delete p;', 'p = nullptr;'] } },
  insert: { title: '单链表插入', group: '实验', note: '在 10 与 30 之间插入 20；先接新节点，再修改前驱链接。', code: { C: ['Node *head = make_list(10, 30);', 'Node *pred = head;', 'Node *fresh = calloc(1, sizeof(Node));', 'fresh->value = 20;', 'fresh->next = pred->next;', 'pred->next = fresh;'], 'C++': ['Node* head = make_list(10, 30);', 'Node* pred = head;', 'Node* fresh = new Node{};', 'fresh->value = 20;', 'fresh->next = pred->next;', 'pred->next = fresh;'] } },
  remove: { title: '单链表删除', group: '实验', note: '删除中间的 20；先绕过目标，再释放对象并清空局部指针。', code: { C: ['Node *head = make_list(10, 20, 30);', 'Node *pred = head;', 'Node *victim = pred->next;', 'pred->next = victim->next;', 'free(victim);', 'victim = NULL;'], 'C++': ['Node* head = make_list(10, 20, 30);', 'Node* pred = head;', 'Node* victim = pred->next;', 'pred->next = victim->next;', 'delete victim;', 'victim = nullptr;'] } },
  doubleInsert: { title: '双链表插入', group: '实验', note: '分别修正新节点的 prev/next，以及两侧节点的链接。', code: { C: ['Node *head = make_dlist(10, 30);', 'Node *fresh = calloc(1, sizeof(Node));', 'fresh->value = 20;', 'fresh->next = head->next;', 'fresh->prev = head;', 'head->next->prev = fresh;', 'head->next = fresh;'], 'C++': ['Node* head = make_dlist(10, 30);', 'Node* fresh = new Node{};', 'fresh->value = 20;', 'fresh->next = head->next;', 'fresh->prev = head;', 'head->next->prev = fresh;', 'head->next = fresh;'] } },
  nullDeref: { title: '空指针解引用', group: '常见错误', note: 'NULL/nullptr 没有目标对象，不能读取其数据域。', code: { C: ['Node *p = NULL;', '/* 错误示例：p->value */'], 'C++': ['Node* p = nullptr;', '// 错误示例：p->value'] } },
  dangling: { title: '悬空指针', group: '常见错误', note: '释放对象后，尚未清空的指针仍保存旧地址。', code: { C: ['Node *p = make_node(10);', 'free(p);', '/* p 仍保存旧地址 */'], 'C++': ['Node* p = new Node{10};', 'delete p;', '// p 仍保存旧地址'] } },
  useAfterFree: { title: '释放后访问', group: '常见错误', note: '已释放对象的内容不再可用；只展示错误状态，不实际访问。', code: { C: ['Node *p = make_node(10);', 'free(p);', '/* 错误示例：p->value */'], 'C++': ['Node* p = new Node{10};', 'delete p;', '// 错误示例：p->value'] } },
  leak: { title: '内存泄漏', group: '常见错误', note: '堆对象仍存活，但失去最后一个可到达引用。', code: { C: ['Node *p = make_node(10);', 'p = NULL;', '/* 无法再 free 原对象 */'], 'C++': ['Node* p = new Node{10};', 'p = nullptr;', '// 无法再 delete 原对象'] } },
  brokenLink: { title: '链表断链', group: '常见错误', note: '覆盖 head->next 前没保存后继，后半段链表变得不可达。', code: { C: ['Node *head = make_list(10, 20, 30);', 'head->next = NULL;', '/* 20 与 30 不可达 */'], 'C++': ['Node* head = make_list(10, 20, 30);', 'head->next = nullptr;', '// 20 与 30 不可达'] } },
  overwrite: { title: '引用覆盖', group: '常见错误', note: '把唯一指向堆对象的指针改指别处，会失去原对象。', code: { C: ['Node *p = make_node(10);', 'Node *q = make_node(20);', 'p = q;', '/* 原 p 对象失去引用 */'], 'C++': ['Node* p = new Node{10};', 'Node* q = new Node{20};', 'p = q;', '// 原 p 对象失去引用'] } },
  outOfBounds: { title: '越界访问', group: '常见错误', note: '下标必须位于 [0, 长度)；不实际执行越界读写。', code: { C: ['int a[3] = {10, 20, 30};', 'int i = 3;', '/* 错误示例：a[i] */'], 'C++': ['int a[3] = {10, 20, 30};', 'int i = 3;', '// 错误示例：a[i]'] } },
}

export class MemoryMachine {
  objects: MemoryObject[] = []
  pointers = new Map<string, string | null>()
  warnings: string[] = []
  private nextId = 0

  allocate(value: number, type = 'Node', region: 'stack' | 'heap' = 'heap', name?: string) {
    const id = `${region === 'heap' ? 'h' : 's'}${this.nextId++}`
    this.objects.push({ id, address: `${region === 'heap' ? 'H' : 'S'}:${String(region === 'heap' ? 1000 + this.nextId * 16 : 100 + this.nextId * 8).padStart(4, '0')}`, region, type, value, ...(region === 'stack' ? { name: name ?? id, ownerFrame: 'main()' } : {}), ...(type === 'Node' ? { next: null } : {}), status: 'allocated' })
    return id
  }
  object(id: string) { const item = this.objects.find(object => object.id === id); if (!item) throw new Error('对象不存在。'); return item }
  point(name: string, target: string | null) { if (target !== null) this.object(target); this.pointers.set(name, target) }
  write(id: string, value: number) { const item = this.object(id); if (item.status !== 'allocated') throw new Error('不能访问已释放的对象。'); item.value = value }
  link(id: string, field: 'next' | 'prev', target: string | null) { const item = this.object(id); if (item.status !== 'allocated') throw new Error('不能修改已释放的对象。'); if (target !== null && this.object(target).status !== 'allocated') throw new Error('不能链接到已释放的对象。'); item[field] = target }
  free(id: string) { const item = this.object(id); if (item.region !== 'heap' || item.status === 'freed') throw new Error('对象不能重复释放或释放栈变量。'); item.status = 'freed' }
  snapshot(): MemorySnapshot {
    const objects = structuredClone(this.objects)
    const references: PointerReference[] = [...this.pointers].map(([name, target]) => ({ name, target, status: target === null ? 'null' : this.object(target).status === 'freed' ? 'dangling' : 'valid' }))
    for (const item of objects) if (item.status === 'allocated' && item.region === 'heap') for (const field of ['next', 'prev'] as const) if (field in item) {
      const target = item[field] ?? null
      references.push({ name: `${item.id}.${field}`, target, status: target === null ? 'null' : this.object(target).status === 'freed' ? 'dangling' : 'valid' })
    }
    const chain: string[] = [], seen = new Set<string>()
    let id = this.pointers.get('head') ?? null
    while (id && !seen.has(id) && this.object(id).status === 'allocated') { chain.push(id); seen.add(id); id = this.object(id).next ?? null }
    const locals: StackFrame['locals'] = [...this.pointers].map(([name, target]) => ({ name, type: target !== null && this.object(target).type === 'int' ? 'int*' : 'Node*', value: target === null ? 'nullptr' : this.object(target).address, target }))
    for (const item of objects.filter(item => item.region === 'stack')) locals.push({ name: item.name ?? item.id, type: item.type, value: String(item.value), address: item.address })
    return { frames: [{ name: 'main()', locals }], objects, references, chain, warnings: [...this.warnings] }
  }
}

export function generateMemorySteps(scenario: MemoryScenario): MemoryStep[] {
  const machine = new MemoryMachine(), steps: MemoryStep[] = []
  let writes = 0
  const emit = (phase: string, description: string, line: number, operations: OperationEvent[] = [], active: string[] = []) => {
    writes += operations.filter(event => ['WRITE', 'POINTER_UPDATE', 'INSERT', 'DELETE'].includes(event.type)).length
    const state = machine.snapshot(), stepIndex = steps.length, highlightedLines = { C: [line], 'C++': [line] }
    steps.push({ id: `${scenario}-${stepIndex}`, stepId: `${scenario}-${stepIndex}`, stepIndex, algorithmId: `memory-${scenario}`, phase, description, state, highlightedElements: active, highlightedLines, variables: { heapObjects: state.objects.filter(item => item.region === 'heap' && item.status === 'allocated').length, references: state.references.length }, operations, metrics: { comparisons: 0, swaps: 0, reads: 0, writes, visits: 0 }, sourceMap: { codeVersion: 'memory-demo-v1', lines: highlightedLines }, memoryState: state.objects.map(item => ({ address: item.address, value: item.status === 'freed' ? '已释放' : item.value })), duration: 700 })
  }
  const event = (type: OperationEvent['type'], ...elements: string[]): OperationEvent => ({ type, elements })
  const add = (value: number, type?: string) => machine.allocate(value, type)
  const list = (values: number[], doubly = false) => { const ids = values.map(value => add(value)); ids.forEach((id, i) => { machine.link(id, 'next', ids[i + 1] ?? null); if (doubly) machine.link(id, 'prev', ids[i - 1] ?? null) }); machine.point('head', ids[0] ?? null); return ids }
  if (scenario === 'pointer') {
    const a = machine.allocate(10, 'int', 'stack', 'a'); emit('declare', '栈上创建整数 a = 10，地址为教学模拟地址。', 1, [event('WRITE', a)], [a])
    machine.point('p', null); emit('null', '指针 p 初始为 nullptr，不指向任何对象。', 2, [event('POINTER_UPDATE', 'p')])
    machine.point('p', a); emit('address', 'p 保存 a 的模拟地址；箭头指向栈变量 a。', 3, [event('POINTER_UPDATE', 'p', a)], [a])
    machine.write(a, 20); emit('deref', '通过 *p 修改 a，两个视图中的值同时变为 20。', 4, [event('WRITE', a)], [a])
  } else if (scenario === 'dynamic') {
    const id = add(0); machine.point('p', id); emit('allocate', '在堆区分配节点，p 保存其教学模拟地址。', 1, [event('INSERT', id)], [id])
    machine.write(id, 10); emit('write', '写入节点的数据域 value = 10。', 2, [event('WRITE', id)], [id])
    emit('next', 'next 为 nullptr，当前没有后继。', 3, [], [id])
    machine.free(id); emit('free', '释放节点；p 此刻仍保存旧地址，形成悬空指针。', 4, [event('DELETE', id)], [id])
    machine.point('p', null); emit('clear', '把 p 设为 nullptr，避免继续保存旧地址。', 5, [event('POINTER_UPDATE', 'p')])
  } else if (scenario === 'insert' || scenario === 'remove' || scenario === 'doubleInsert') {
    const double = scenario === 'doubleInsert', ids = list(scenario === 'remove' ? [10, 20, 30] : [10, 30], double)
    emit('init', `原链表为 ${scenario === 'remove' ? '10 → 20 → 30' : '10 → 30'}。`, 1, [], ids)
    machine.point('pred', ids[0]); emit('locate', 'pred 指向前驱节点 10。', scenario === 'doubleInsert' ? 1 : 2, [event('POINTER_UPDATE', 'pred', ids[0])], [ids[0]])
    if (scenario === 'remove') {
      machine.point('victim', ids[1]); emit('select', 'victim 指向待删除节点 20。', 3, [event('POINTER_UPDATE', 'victim', ids[1])], [ids[1]])
      machine.link(ids[0], 'next', ids[2]); emit('unlink', '前驱直接指向 30，先保持链表连通。', 4, [event('POINTER_UPDATE', ids[0], ids[2])], [ids[0], ids[2]])
      machine.free(ids[1]); emit('free', '释放 20；victim 尚未清空，因此显示悬空引用。', 5, [event('DELETE', ids[1])], [ids[1]])
      machine.point('victim', null); emit('clear', '清空 victim；最终链表为 10 → 30。', 6, [event('POINTER_UPDATE', 'victim')])
    } else {
      const fresh = add(0); machine.point('fresh', fresh); emit('allocate', '分配新节点，尚未连入链表。', double ? 2 : 3, [event('INSERT', fresh)], [fresh])
      machine.write(fresh, 20); emit('value', '写入数据域 value = 20。', double ? 3 : 4, [event('WRITE', fresh)], [fresh])
      machine.link(fresh, 'next', ids[1]); emit('setNext', '新节点 next 指向原后继 30。', double ? 4 : 5, [event('POINTER_UPDATE', fresh, ids[1])], [fresh, ids[1]])
      if (double) {
        machine.link(fresh, 'prev', ids[0]); emit('setPrev', '新节点 prev 指向前驱 10。', 5, [event('POINTER_UPDATE', fresh, ids[0])], [fresh, ids[0]])
        machine.link(ids[1], 'prev', fresh); emit('successor', '后继 30 的 prev 改指新节点。', 6, [event('POINTER_UPDATE', ids[1], fresh)], [ids[1], fresh])
      }
      machine.link(ids[0], 'next', fresh); emit('commit', '前驱 10 的 next 改指新节点；链表现在为 10 → 20 → 30。', double ? 7 : 6, [event('POINTER_UPDATE', ids[0], fresh)], [ids[0], fresh])
    }
  } else if (scenario === 'outOfBounds') {
    [10, 20, 30].forEach((value, index) => machine.allocate(value, 'int', 'stack', `a[${index}]`)); emit('array', '栈数组 a 有 3 个位置：下标 0、1、2。', 1)
    emit('index', 'i = 3，已经等于数组长度。', 2)
    machine.warnings.push('越界访问：a[3] 不在 [0, 3) 内。这里只标注错误，不执行读写。'); emit('error', '阻止越界访问；真实 C/C++ 程序的行为未定义。', 3)
  } else {
    const ids = scenario === 'brokenLink' ? list([10, 20, 30]) : scenario === 'overwrite' ? [add(10), add(20)] : scenario === 'nullDeref' ? [] : [add(10)]
    if (scenario !== 'brokenLink' && scenario !== 'nullDeref') machine.point('p', ids[0])
    if (scenario === 'overwrite') machine.point('q', ids[1])
    if (scenario === 'nullDeref') machine.point('p', null)
    emit('init', scenario === 'nullDeref' ? 'p 为 nullptr。' : '堆对象与指针已准备。', 1, [], ids)
    if (scenario === 'dangling' || scenario === 'useAfterFree') {
      machine.free(ids[0]); emit('free', '对象已释放，但 p 尚未清空。', 2, [event('DELETE', ids[0])], ids)
      if (scenario === 'useAfterFree') { machine.warnings.push('释放后访问：p 指向已释放对象，不能再读取 value。'); emit('error', '阻止读取已释放节点；真实程序的行为未定义。', 3) }
      else { machine.warnings.push('悬空指针：p 保留了已释放对象的旧地址。'); emit('error', '旧地址看似还在，但对象生命周期已结束。', 3) }
    } else if (scenario === 'nullDeref') { machine.warnings.push('空指针解引用：p 没有目标对象。'); emit('error', '阻止 p->value；真实程序的行为未定义。', 2) }
    else if (scenario === 'leak') { machine.point('p', null); machine.warnings.push('内存泄漏：堆对象仍存活，但已失去唯一引用。'); emit('error', 'p 改为 nullptr，原对象仍占用堆内存。', 2, [event('POINTER_UPDATE', 'p')]) }
    else if (scenario === 'brokenLink') { machine.link(ids[0], 'next', null); machine.warnings.push('链表断链：20 与 30 仍在堆中，但无法从 head 到达。'); emit('error', '错误地覆盖 head->next；后半段链表丢失入口。', 2, [event('POINTER_UPDATE', ids[0])]) }
    else if (scenario === 'overwrite') { machine.point('p', ids[1]); machine.warnings.push('引用覆盖：原 p 对象仍在堆中，但已失去唯一引用。'); emit('error', 'p 改指 q 的对象，原节点变得不可达。', 3, [event('POINTER_UPDATE', 'p', ids[1])]) }
  }
  return steps
}
