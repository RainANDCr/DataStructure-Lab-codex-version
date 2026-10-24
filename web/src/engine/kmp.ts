export type KmpFrame = {
  tag: 'init' | 'nextBase' | 'nextCompare' | 'nextFallback' | 'nextWrite' | 'compare' | 'advance' | 'shiftFallback' | 'shiftAdvance' | 'found' | 'miss'
  text: string
  values: string[]
  pattern: string
  next: (number | null)[]
  alignment?: number
  patternIndex?: number
  prefixIndex?: number
  active: number[]
  done: number[]
  output: string[]
  comparisons: number
  writes: number
  vars: Record<string, number | string>
}

export function kmpTrace(text: string[], pattern: string): KmpFrame[] {
  if (text.length > 16 || text.some(char => !/^[A-Za-z0-9]$/.test(char))) throw new Error('主串最多 16 个字符，只能输入英文字母和数字。')
  if (!/^[A-Za-z0-9]{1,8}$/.test(pattern)) throw new Error('模式串需为 1 至 8 个英文字母或数字。')
  const next: (number | null)[] = Array(pattern.length).fill(null)
  const frames: KmpFrame[] = []
  let comparisons = 0
  const emit = (tag: KmpFrame['tag'], description: string, data: Partial<KmpFrame> = {}, vars: Record<string, number | string> = {}) => {
    frames.push({ tag, text: description, values: [...text], pattern, next: [...next], active: [], done: [], output: [], comparisons, writes: next.filter(value => value !== null).length, vars, ...data })
  }
  emit('init', '先构造模式串的 next 数组，再开始主串匹配。', {}, { n: text.length, m: pattern.length })
  next[0] = 0
  emit('nextBase', 'next[0] = 0：单个字符没有非空真前后缀。', { patternIndex: 0 }, { p: 0, next: 0 })
  for (let p = 1; p < pattern.length; p++) {
    let k = next[p - 1]!
    while (k > 0 && pattern[p] !== pattern[k]) {
      comparisons++
      emit('nextCompare', `生成 next[${p}]：${pattern[p]} 与 ${pattern[k]} 不同。`, { patternIndex: p, prefixIndex: k }, { p, k })
      const previous = k
      k = next[k - 1]!
      emit('nextFallback', `前缀长度从 ${previous} 回退到 next[${previous - 1}] = ${k}。`, { patternIndex: p, prefixIndex: k }, { p, k })
    }
    comparisons++
    emit('nextCompare', `生成 next[${p}]：比较 ${pattern[p]} 与 ${pattern[k]}，${pattern[p] === pattern[k] ? '可延长公共前后缀' : '保持长度 0'}。`, { patternIndex: p, prefixIndex: k }, { p, k })
    if (pattern[p] === pattern[k]) k++
    next[p] = k
    emit('nextWrite', `写入 next[${p}] = ${k}。`, { patternIndex: p }, { p, next: k })
  }
  let i = 0, j = 0
  while (i < text.length) {
    comparisons++
    emit('compare', `比较主串[${i}] = ${text[i]} 与模式串[${j}] = ${pattern[j]}。`, { alignment: i - j, patternIndex: j, active: [i] }, { i, j })
    if (text[i] === pattern[j]) {
      i++; j++
      emit('advance', `字符相同，主串位置前进到 ${i}，已匹配 ${j} 个字符。`, { alignment: i - j, patternIndex: j < pattern.length ? j : undefined, active: [i - 1] }, { i, j })
      if (j === pattern.length) {
        emit('found', `匹配成功，起始下标为 ${i - j}。`, { alignment: i - j, done: Array.from({ length: j }, (_, offset) => i - j + offset) }, { result: i - j })
        return frames
      }
    } else if (j > 0) {
      const previous = j
      j = next[j - 1]!
      emit('shiftFallback', `失配：j 从 ${previous} 回退到 next[${previous - 1}] = ${j}，主串下标 ${i} 不回退。`, { alignment: i - j, patternIndex: j, active: [i] }, { i, j })
    } else {
      i++
      emit('shiftAdvance', `首字符失配，模式串右移一格，主串继续到 ${i}。`, { alignment: i }, { i, j })
    }
  }
  emit('miss', '主串已扫描完，未找到模式串。', {}, { result: -1 })
  return frames
}

export const kmpSnippet = {
  C: [
    { tag: 'init', text: 'int kmp(const char *s, int n, const char *p, int m) {' },
    { tag: 'nextBase', text: '  int next[8] = {0};' },
    { tag: 'nextCompare', text: '  for (int a = 1, k = 0; a < m; a++) {' },
    { tag: 'nextFallback', text: '    while (k > 0 && p[a] != p[k]) k = next[k - 1];' },
    { tag: 'nextCompare', text: '    if (p[a] == p[k]) k++;' },
    { tag: 'nextWrite', text: '    next[a] = k;' },
    { tag: 'nextWrite', text: '  }' },
    { tag: 'init', text: '  int i = 0, j = 0;' },
    { tag: 'compare', text: '  while (i < n) {' },
    { tag: 'compare', text: '    if (s[i] == p[j]) {' },
    { tag: 'advance', text: '      i++; j++;' },
    { tag: 'found', text: '      if (j == m) return i - j;' },
    { tag: 'shiftFallback', text: '    } else if (j > 0) j = next[j - 1];' },
    { tag: 'shiftAdvance', text: '    else i++;' },
    { tag: 'miss', text: '  }' },
    { tag: 'miss', text: '  return -1;' },
    { tag: 'miss', text: '}' },
  ],
  'C++': [
    { tag: 'init', text: 'int kmp(const string& s, const string& p) {' },
    { tag: 'nextBase', text: '  vector<int> next(p.size(), 0);' },
    { tag: 'nextCompare', text: '  for (int a = 1, k = 0; a < (int)p.size(); a++) {' },
    { tag: 'nextFallback', text: '    while (k > 0 && p[a] != p[k]) k = next[k - 1];' },
    { tag: 'nextCompare', text: '    if (p[a] == p[k]) k++;' },
    { tag: 'nextWrite', text: '    next[a] = k;' },
    { tag: 'nextWrite', text: '  }' },
    { tag: 'init', text: '  int i = 0, j = 0;' },
    { tag: 'compare', text: '  while (i < (int)s.size()) {' },
    { tag: 'compare', text: '    if (s[i] == p[j]) {' },
    { tag: 'advance', text: '      i++; j++;' },
    { tag: 'found', text: '      if (j == (int)p.size()) return i - j;' },
    { tag: 'shiftFallback', text: '    } else if (j > 0) j = next[j - 1];' },
    { tag: 'shiftAdvance', text: '    else i++;' },
    { tag: 'miss', text: '  }' },
    { tag: 'miss', text: '  return -1;' },
    { tag: 'miss', text: '}' },
  ],
  Python: [
    { tag: 'init', text: 'def kmp(s, p):' },
    { tag: 'nextBase', text: '    next = [0] * len(p)' },
    { tag: 'nextCompare', text: '    k = 0' },
    { tag: 'nextCompare', text: '    for a in range(1, len(p)):' },
    { tag: 'nextFallback', text: '        while k > 0 and p[a] != p[k]: k = next[k - 1]' },
    { tag: 'nextCompare', text: '        if p[a] == p[k]: k += 1' },
    { tag: 'nextWrite', text: '        next[a] = k' },
    { tag: 'init', text: '    i = j = 0' },
    { tag: 'compare', text: '    while i < len(s):' },
    { tag: 'compare', text: '        if s[i] == p[j]:' },
    { tag: 'advance', text: '            i += 1; j += 1' },
    { tag: 'found', text: '            if j == len(p): return i - j' },
    { tag: 'shiftFallback', text: '        elif j > 0: j = next[j - 1]' },
    { tag: 'shiftAdvance', text: '        else: i += 1' },
    { tag: 'miss', text: '    return -1' },
  ],
} as const
