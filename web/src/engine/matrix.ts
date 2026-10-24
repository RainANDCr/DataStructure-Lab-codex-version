export type MatrixOrder = 'row' | 'column' | 'symmetric' | 'lower' | 'upper' | 'band' | 'sparse'
export type MatrixFrame = {
  tag: 'init' | 'select' | 'skip' | 'write' | 'done'
  text: string
  values: number[]
  linear: (number | null)[]
  triples?: [number, number, number][]
  rows: number
  cols: number
  order: MatrixOrder
  cell?: [number, number]
  slot?: number
  active: number[]
  done: number[]
  output: number[]
  comparisons: number
  writes: number
  vars: Record<string, number | string>
}

export function matrixTrace(values: number[], rows: number, cols: number, order: MatrixOrder): MatrixFrame[] {
  if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows < 1 || cols < 1 || rows > 4 || cols > 4 || rows * cols !== values.length)
    throw new Error('行数和列数须为 1 至 4，且乘积等于输入元素个数。')
  if (!['row', 'column', 'symmetric', 'lower', 'upper', 'band', 'sparse'].includes(order)) throw new Error('请选择有效的存储方式。')
  if (['symmetric', 'lower', 'upper', 'band'].includes(order) && rows !== cols) throw new Error('这种压缩方式要求方阵。')
  if (order === 'symmetric' && (rows !== cols || values.some((value, index) => value !== values[index % cols * cols + Math.floor(index / cols)])))
    throw new Error('对称压缩要求方阵，且镜像位置 A[r][c] 与 A[c][r] 相等。')
  // shortcut: triangular modes require zero outside the stored half; add one shared slot if constant-filled triangles enter the syllabus.
  if (values.some((value, index) => {
    const r = Math.floor(index / cols), c = index % cols
    return value !== 0 && (order === 'lower' && c > r || order === 'upper' && r > c || order === 'band' && Math.abs(r - c) > 1)
  })) throw new Error('压缩区域外的元素必须为 0。')
  const packed = ['symmetric', 'lower', 'upper'].includes(order) ? rows * (rows + 1) / 2 : order === 'band' ? 3 * rows - 2 : order === 'sparse' ? 0 : values.length
  const linear: (number | null)[] = Array(packed).fill(null)
  const triples: [number, number, number][] = []
  const done: number[] = []
  const frames: MatrixFrame[] = []
  const emit = (tag: MatrixFrame['tag'], text: string, cell?: [number, number], slot?: number) => {
    frames.push({ tag, text, values: [...values], linear: [...linear], ...(order === 'sparse' ? { triples: triples.map(item => [...item] as [number, number, number]) } : {}), rows, cols, order, cell, slot,
      active: cell ? order === 'symmetric' ? [...new Set([cell[0] * cols + cell[1], cell[1] * cols + cell[0]])] : [cell[0] * cols + cell[1]] : [], done: [...done], output: [], comparisons: 0,
      writes: done.length, vars: cell ? { r: cell[0], c: cell[1], ...(slot !== undefined ? { k: slot } : {}), value: values[cell[0] * cols + cell[1]] } : { rows, cols } })
  }
  const names: Record<MatrixOrder, string> = { row: '按行存储', column: '按列存储', symmetric: '对称压缩：只存下三角', lower: '下三角压缩', upper: '上三角压缩', band: '三对角压缩', sparse: '稀疏矩阵三元组' }
  emit('init', `${rows} × ${cols} 矩阵已就绪，采用${names[order]}。`)
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (order === 'symmetric' && c > r) continue
    const value = values[r * cols + c]
    const omitted = order === 'lower' && c > r || order === 'upper' && r > c || order === 'band' && Math.abs(r - c) > 1 || order === 'sparse' && value === 0
    if (omitted) {
      emit('select', `检查 A[${r}][${c}] = ${value}。`, [r, c])
      emit('skip', `A[${r}][${c}] 为 0，${order === 'sparse' ? '不写入三元组表' : '不占用压缩存储位置'}。`, [r, c])
      continue
    }
    const k = order === 'symmetric' || order === 'lower' ? r * (r + 1) / 2 + c : order === 'upper' ? r * (2 * rows - r + 1) / 2 + c - r : order === 'band' ? 2 * r + c : order === 'row' ? r * cols + c : order === 'column' ? c * rows + r : triples.length
    const formula = order === 'symmetric' || order === 'lower' ? `r(r+1)/2+c = ${k}` : order === 'upper' ? `r(2n-r+1)/2+c-r = ${k}` : order === 'band' ? `2r+c = ${k}` : order === 'row' ? `r×列数+c = ${k}` : order === 'column' ? `c×行数+r = ${k}` : `第 ${k} 个非零项`
    emit('select', order === 'symmetric' ? `A[${r}][${c}]${r === c ? '' : ` 与 A[${c}][${r}]`} 共用 B[${k}]：${formula}。` : `A[${r}][${c}] = ${value}，${formula}。`, [r, c], k)
    if (order === 'sparse') { triples.push([r, c, value]); linear.push(value) }
    else linear[k] = value
    done.push(k)
    emit('write', order === 'sparse' ? `追加三元组 (${r}, ${c}, ${value})。` : `把 ${value} 写入 B[${k}]。`, [r, c], k)
  }
  emit('done', order === 'row' || order === 'column' ? '映射完成。矩阵和线性数组保存的是同一组元素。' : `压缩完成：${rows * cols} 个矩阵单元只需 ${order === 'sparse' ? `${triples.length} 个三元组` : `${linear.length} 个存储位置`}。`)
  return frames
}

export const matrixSnippet = {
  C: [
    { tag: 'init', text: 'void flatten(int rows, int cols, int a[4][4], int out[16], int rowMajor) {' },
    { tag: 'select', text: '  for (int r = 0; r < rows; r++)' },
    { tag: 'select', text: '    for (int c = 0; c < cols; c++) {' },
    { tag: 'select', text: '      int k = rowMajor ? r * cols + c : c * rows + r;' },
    { tag: 'write', text: '      out[k] = a[r][c];' },
    { tag: 'done', text: '    }' },
    { tag: 'done', text: '}' },
  ],
  'C++': [
    { tag: 'init', text: 'vector<int> flatten(const vector<vector<int>>& a, bool rowMajor) {' },
    { tag: 'init', text: '  int rows = a.size(), cols = a[0].size();' },
    { tag: 'init', text: '  vector<int> out(rows * cols);' },
    { tag: 'select', text: '  for (int r = 0; r < rows; ++r)' },
    { tag: 'select', text: '    for (int c = 0; c < cols; ++c) {' },
    { tag: 'select', text: '      int k = rowMajor ? r * cols + c : c * rows + r;' },
    { tag: 'write', text: '      out[k] = a[r][c];' },
    { tag: 'done', text: '    }' },
    { tag: 'done', text: '  return out;' },
    { tag: 'done', text: '}' },
  ],
  Python: [
    { tag: 'init', text: 'def flatten(a, row_major=True):' },
    { tag: 'init', text: '    rows, cols = len(a), len(a[0])' },
    { tag: 'init', text: '    out = [None] * (rows * cols)' },
    { tag: 'select', text: '    for r in range(rows):' },
    { tag: 'select', text: '        for c in range(cols):' },
    { tag: 'select', text: '            k = r * cols + c if row_major else c * rows + r' },
    { tag: 'write', text: '            out[k] = a[r][c]' },
    { tag: 'done', text: '    return out' },
  ],
} as const

export const symmetricSnippet = {
  C: [
    { tag: 'init', text: 'void compress(int n, int a[4][4], int out[10]) {' },
    { tag: 'select', text: '  for (int r = 0; r < n; r++)' },
    { tag: 'select', text: '    for (int c = 0; c <= r; c++) {' },
    { tag: 'select', text: '      int k = r * (r + 1) / 2 + c;' },
    { tag: 'write', text: '      out[k] = a[r][c];' },
    { tag: 'done', text: '    }' },
    { tag: 'done', text: '}' },
  ],
  'C++': [
    { tag: 'init', text: 'vector<int> compress(const vector<vector<int>>& a) {' },
    { tag: 'init', text: '  int n = a.size();' },
    { tag: 'init', text: '  vector<int> out(n * (n + 1) / 2);' },
    { tag: 'select', text: '  for (int r = 0; r < n; ++r)' },
    { tag: 'select', text: '    for (int c = 0; c <= r; ++c) {' },
    { tag: 'select', text: '      int k = r * (r + 1) / 2 + c;' },
    { tag: 'write', text: '      out[k] = a[r][c];' },
    { tag: 'done', text: '    }' },
    { tag: 'done', text: '  return out;' },
    { tag: 'done', text: '}' },
  ],
  Python: [
    { tag: 'init', text: 'def compress(a):' },
    { tag: 'init', text: '    n = len(a)' },
    { tag: 'init', text: '    out = [None] * (n * (n + 1) // 2)' },
    { tag: 'select', text: '    for r in range(n):' },
    { tag: 'select', text: '        for c in range(r + 1):' },
    { tag: 'select', text: '            k = r * (r + 1) // 2 + c' },
    { tag: 'write', text: '            out[k] = a[r][c]' },
    { tag: 'done', text: '    return out' },
  ],
} as const

export const triangularSnippet = {
  C: [
    { tag: 'init', text: 'void triangle(int n, int a[4][4], int out[10], int lower) {' },
    { tag: 'select', text: '  for (int r = 0; r < n; r++) for (int c = 0; c < n; c++) {' },
    { tag: 'skip', text: '    if ((lower && c > r) || (!lower && r > c)) continue;' },
    { tag: 'select', text: '    int k = lower ? r * (r + 1) / 2 + c' },
    { tag: 'select', text: '                  : r * (2 * n - r + 1) / 2 + c - r;' },
    { tag: 'write', text: '    out[k] = a[r][c];' },
    { tag: 'done', text: '  }' },
    { tag: 'done', text: '}' },
  ],
  'C++': [
    { tag: 'init', text: 'vector<int> triangle(const vector<vector<int>>& a, bool lower) {' },
    { tag: 'init', text: '  int n = a.size();' },
    { tag: 'init', text: '  vector<int> out(n * (n + 1) / 2);' },
    { tag: 'select', text: '  for (int r = 0; r < n; ++r) for (int c = 0; c < n; ++c) {' },
    { tag: 'skip', text: '    if ((lower && c > r) || (!lower && r > c)) continue;' },
    { tag: 'select', text: '    int k = lower ? r * (r + 1) / 2 + c' },
    { tag: 'select', text: '                  : r * (2 * n - r + 1) / 2 + c - r;' },
    { tag: 'write', text: '    out[k] = a[r][c];' },
    { tag: 'done', text: '  }' },
    { tag: 'done', text: '  return out;' },
    { tag: 'done', text: '}' },
  ],
  Python: [
    { tag: 'init', text: 'def triangle(a, lower=True):' },
    { tag: 'init', text: '    n = len(a)' },
    { tag: 'init', text: '    out = [None] * (n * (n + 1) // 2)' },
    { tag: 'select', text: '    for r in range(n):' },
    { tag: 'select', text: '        for c in range(n):' },
    { tag: 'skip', text: '            if (lower and c > r) or (not lower and r > c): continue' },
    { tag: 'select', text: '            k = r * (r + 1) // 2 + c if lower else r * (2*n-r+1) // 2 + c-r' },
    { tag: 'write', text: '            out[k] = a[r][c]' },
    { tag: 'done', text: '    return out' },
  ],
} as const

export const bandSnippet = {
  C: [
    { tag: 'init', text: 'void tridiagonal(int n, int a[4][4], int out[10]) {' },
    { tag: 'select', text: '  for (int r = 0; r < n; r++) for (int c = 0; c < n; c++) {' },
    { tag: 'skip', text: '    if (abs(r - c) > 1) continue;' },
    { tag: 'select', text: '    int k = 2 * r + c;' },
    { tag: 'write', text: '    out[k] = a[r][c];' },
    { tag: 'done', text: '  }' },
    { tag: 'done', text: '}' },
  ],
  'C++': [
    { tag: 'init', text: 'vector<int> tridiagonal(const vector<vector<int>>& a) {' },
    { tag: 'init', text: '  int n = a.size();' },
    { tag: 'init', text: '  vector<int> out(3 * n - 2);' },
    { tag: 'select', text: '  for (int r = 0; r < n; ++r) for (int c = 0; c < n; ++c) {' },
    { tag: 'skip', text: '    if (abs(r - c) > 1) continue;' },
    { tag: 'select', text: '    int k = 2 * r + c;' },
    { tag: 'write', text: '    out[k] = a[r][c];' },
    { tag: 'done', text: '  }' },
    { tag: 'done', text: '  return out;' },
    { tag: 'done', text: '}' },
  ],
  Python: [
    { tag: 'init', text: 'def tridiagonal(a):' },
    { tag: 'init', text: '    n = len(a)' },
    { tag: 'init', text: '    out = [None] * (3 * n - 2)' },
    { tag: 'select', text: '    for r in range(n):' },
    { tag: 'select', text: '        for c in range(n):' },
    { tag: 'skip', text: '            if abs(r - c) > 1: continue' },
    { tag: 'select', text: '            k = 2 * r + c' },
    { tag: 'write', text: '            out[k] = a[r][c]' },
    { tag: 'done', text: '    return out' },
  ],
} as const

export const sparseSnippet = {
  C: [
    { tag: 'init', text: 'int sparse(int rows, int cols, int a[4][4], int out[16][3]) {' },
    { tag: 'init', text: '  int count = 0;' },
    { tag: 'select', text: '  for (int r = 0; r < rows; r++) for (int c = 0; c < cols; c++) {' },
    { tag: 'skip', text: '    if (a[r][c] == 0) continue;' },
    { tag: 'write', text: '    out[count][0] = r; out[count][1] = c;' },
    { tag: 'write', text: '    out[count++][2] = a[r][c];' },
    { tag: 'done', text: '  }' },
    { tag: 'done', text: '  return count;' },
    { tag: 'done', text: '}' },
  ],
  'C++': [
    { tag: 'init', text: 'vector<array<int, 3>> sparse(const vector<vector<int>>& a) {' },
    { tag: 'init', text: '  vector<array<int, 3>> out;' },
    { tag: 'select', text: '  for (int r = 0; r < (int)a.size(); ++r)' },
    { tag: 'select', text: '    for (int c = 0; c < (int)a[r].size(); ++c) {' },
    { tag: 'skip', text: '      if (a[r][c] == 0) continue;' },
    { tag: 'write', text: '      out.push_back({r, c, a[r][c]});' },
    { tag: 'done', text: '    }' },
    { tag: 'done', text: '  return out;' },
    { tag: 'done', text: '}' },
  ],
  Python: [
    { tag: 'init', text: 'def sparse(a):' },
    { tag: 'init', text: '    out = []' },
    { tag: 'select', text: '    for r in range(len(a)):' },
    { tag: 'select', text: '        for c in range(len(a[r])):' },
    { tag: 'skip', text: '            if a[r][c] == 0: continue' },
    { tag: 'write', text: '            out.append((r, c, a[r][c]))' },
    { tag: 'done', text: '    return out' },
  ],
} as const

export const matrixSnippets = { row: matrixSnippet, column: matrixSnippet, symmetric: symmetricSnippet, lower: triangularSnippet, upper: triangularSnippet, band: bandSnippet, sparse: sparseSnippet }
