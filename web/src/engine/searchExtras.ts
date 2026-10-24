export type SearchExtraId = 'sequential' | 'block' | 'hash'
export type SearchBlock = { start: number; end: number; max: number }
export type SearchFrame = {
  tag: string; text: string; values: number[]; active: number[]; done: number[]; output: number[]
  comparisons: number; writes: number; vars: Record<string, number | string>; range?: number[]
  blocks?: SearchBlock[]; blockIndex?: number; hashSlots?: (number | null)[]; slot?: number
}

export function searchExtraTrace(id: SearchExtraId, values: number[], target: number): SearchFrame[] {
  if (!Number.isInteger(target) || Math.abs(target) > 99) throw new Error('目标值必须是 -99 至 99 的整数。')
  if (id === 'hash' && (values.length > 10 || new Set(values).size !== values.length)) throw new Error('散列表示例最多 10 个不重复的整数。')
  if (id === 'block' && values.some((value, i) => i > 0 && value < values[i - 1])) throw new Error('分块查找需要升序数据。')
  const frames: SearchFrame[] = [], done: number[] = [], output: number[] = []
  let comparisons = 0, writes = 0
  const emit = (tag: string, text: string, active: number[] = [], vars: SearchFrame['vars'] = {}, extra: Partial<SearchFrame> = {}) => frames.push({
    tag, text, values: [...values], active: [...active], done: [...done], output: [...output], comparisons, writes, vars, ...extra,
  })
  if (id === 'sequential') {
    emit('init', '从第一个元素开始，逐个与目标比较。', [], { target })
    for (let i = 0; i < values.length; i++) {
      comparisons++
      emit('compare', `比较 a[${i}] = ${values[i]} 与目标 ${target}。`, [i], { i, target })
      if (values[i] === target) { done.push(i); emit('found', `找到目标，下标为 ${i}。`, [i], { result: i }); return frames }
      done.push(i)
    }
    emit('miss', '扫描结束，目标不存在。', [], { result: -1 })
    return frames
  }
  if (id === 'block') {
    const size = Math.max(1, Math.ceil(Math.sqrt(values.length)))
    const blocks: SearchBlock[] = []
    for (let start = 0; start < values.length; start += size) {
      const end = Math.min(start + size, values.length)
      blocks.push({ start, end, max: values[end - 1] })
    }
    emit('init', `每 ${size} 个元素组成一块，先查块索引，再查块内元素。`, [], { target, size }, { blocks })
    for (let b = 0; b < blocks.length; b++) {
      const block = blocks[b]
      comparisons++
      emit('block', `比较目标 ${target} 与第 ${b + 1} 块最大值 ${block.max}。`, [], { b, max: block.max, target }, { blocks, blockIndex: b, range: [block.start, block.end - 1] })
      if (target > block.max) continue
      for (let i = block.start; i < block.end; i++) {
        comparisons++
        emit('compare', `在候选块中比较 a[${i}] = ${values[i]}。`, [i], { b, i, target }, { blocks, blockIndex: b, range: [block.start, block.end - 1] })
        if (values[i] === target) { done.push(i); emit('found', `找到目标，下标为 ${i}。`, [i], { result: i }, { blocks, blockIndex: b, range: [block.start, block.end - 1] }); return frames }
        if (values[i] > target) break
      }
      emit('miss', '候选块内没有目标。', [], { result: -1 }, { blocks, blockIndex: b, range: [block.start, block.end - 1] })
      return frames
    }
    emit('miss', '所有块的最大值都小于目标。', [], { result: -1 }, { blocks })
    return frames
  }
  const slots: (number | null)[] = Array(11).fill(null)
  const hash = (value: number) => ((value % 11) + 11) % 11
  emit('init', '散列表有 11 个槽位；发生冲突时向右逐格探测。', [], { target }, { hashSlots: [...slots] })
  for (const value of values) {
    let slot = hash(value)
    emit('hash', `${value} 对 11 取模，初始地址为 ${slot}。`, [], { value, slot }, { hashSlots: [...slots], slot })
    while (slots[slot] !== null) {
      comparisons++
      emit('collision', `槽位 ${slot} 已被 ${slots[slot]} 占用，向后探测。`, [], { value, slot }, { hashSlots: [...slots], slot })
      slot = (slot + 1) % 11
    }
    slots[slot] = value
    writes++
    emit('insert', `把 ${value} 放入槽位 ${slot}。`, [], { value, slot }, { hashSlots: [...slots], slot })
  }
  let slot = hash(target)
  emit('search', `查找 ${target}：从地址 ${slot} 开始探测。`, [], { target, slot }, { hashSlots: [...slots], slot })
  for (let count = 0; count < slots.length && slots[slot] !== null; count++) {
    comparisons++
    output.push(slot)
    emit('probe', `检查槽位 ${slot}：${slots[slot]}${slots[slot] === target ? '，命中目标' : '，继续探测'}。`, [], { target, slot }, { hashSlots: [...slots], slot })
    if (slots[slot] === target) { emit('found', `找到目标，散列地址为 ${slot}。`, [], { result: slot }, { hashSlots: [...slots], slot }); return frames }
    slot = (slot + 1) % 11
  }
  emit('miss', `探测至空槽位 ${slot}，目标不存在。`, [], { result: -1 }, { hashSlots: [...slots], slot })
  return frames
}

export const searchExtraSnippets: Record<SearchExtraId, Record<'C' | 'C++' | 'Python', { tag: string; text: string }[]>> = {
  sequential: {
    C: [{ tag:'init', text:'int sequential(const int a[], int n, int x) {' },{ tag:'compare', text:'  for (int i = 0; i < n; i++) {' },{ tag:'found', text:'    if (a[i] == x) return i;' },{ tag:'compare', text:'  }' },{ tag:'miss', text:'  return -1;' }],
    'C++': [{ tag:'init', text:'int sequential(const vector<int>& a, int x) {' },{ tag:'compare', text:'  for (int i = 0; i < (int)a.size(); ++i) {' },{ tag:'found', text:'    if (a[i] == x) return i;' },{ tag:'compare', text:'  }' },{ tag:'miss', text:'  return -1;' }],
    Python: [{ tag:'init', text:'def sequential(a, x):' },{ tag:'compare', text:'    for i, value in enumerate(a):' },{ tag:'found', text:'        if value == x: return i' },{ tag:'miss', text:'    return -1' }],
  },
  block: {
    C: [{ tag:'init', text:'int block_search(int a[], Block idx[], int m, int x) {' },{ tag:'block', text:'  for (int b = 0; b < m; b++) {' },{ tag:'block', text:'    if (x > idx[b].max) continue;' },{ tag:'compare', text:'    for (int i = idx[b].start; i < idx[b].end; i++) {' },{ tag:'found', text:'      if (a[i] == x) return i;' },{ tag:'compare', text:'      if (a[i] > x) break;' },{ tag:'compare', text:'    }' },{ tag:'miss', text:'    return -1;' },{ tag:'block', text:'  }' },{ tag:'miss', text:'  return -1;' }],
    'C++': [{ tag:'init', text:'int block_search(const vector<int>& a, const vector<Block>& idx, int x) {' },{ tag:'block', text:'  for (const auto& block : idx) {' },{ tag:'block', text:'    if (x > block.max) continue;' },{ tag:'compare', text:'    for (int i = block.start; i < block.end; ++i) {' },{ tag:'found', text:'      if (a[i] == x) return i;' },{ tag:'compare', text:'      if (a[i] > x) break;' },{ tag:'compare', text:'    }' },{ tag:'miss', text:'    return -1;' },{ tag:'block', text:'  }' },{ tag:'miss', text:'  return -1;' }],
    Python: [{ tag:'init', text:'def block_search(a, blocks, x):' },{ tag:'block', text:'    for start, end, maximum in blocks:' },{ tag:'block', text:'        if x > maximum: continue' },{ tag:'compare', text:'        for i in range(start, end):' },{ tag:'found', text:'            if a[i] == x: return i' },{ tag:'compare', text:'            if a[i] > x: break' },{ tag:'miss', text:'        return -1' },{ tag:'miss', text:'    return -1' }],
  },
  hash: {
    C: [{ tag:'init', text:'int table[11] = {0}; /* occupied[] 区分空槽 */' },{ tag:'hash', text:'int slot = ((value % 11) + 11) % 11;' },{ tag:'collision', text:'while (occupied[slot]) slot = (slot + 1) % 11;' },{ tag:'insert', text:'table[slot] = value; occupied[slot] = 1;' },{ tag:'search', text:'slot = ((target % 11) + 11) % 11;' },{ tag:'probe', text:'while (occupied[slot]) {' },{ tag:'found', text:'  if (table[slot] == target) return slot;' },{ tag:'probe', text:'  slot = (slot + 1) % 11;' },{ tag:'miss', text:'return -1;' }],
    'C++': [{ tag:'init', text:'vector<optional<int>> table(11);' },{ tag:'hash', text:'int slot = ((value % 11) + 11) % 11;' },{ tag:'collision', text:'while (table[slot]) slot = (slot + 1) % 11;' },{ tag:'insert', text:'table[slot] = value;' },{ tag:'search', text:'slot = ((target % 11) + 11) % 11;' },{ tag:'probe', text:'while (table[slot]) {' },{ tag:'found', text:'  if (*table[slot] == target) return slot;' },{ tag:'probe', text:'  slot = (slot + 1) % 11;' },{ tag:'miss', text:'return -1;' }],
    Python: [{ tag:'init', text:'table = [None] * 11' },{ tag:'hash', text:'slot = value % 11' },{ tag:'collision', text:'while table[slot] is not None: slot = (slot + 1) % 11' },{ tag:'insert', text:'table[slot] = value' },{ tag:'search', text:'slot = target % 11' },{ tag:'probe', text:'while table[slot] is not None:' },{ tag:'found', text:'    if table[slot] == target: return slot' },{ tag:'probe', text:'    slot = (slot + 1) % 11' },{ tag:'miss', text:'return -1' }],
  },
}
