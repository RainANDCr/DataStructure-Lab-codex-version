import type { AlgorithmModule, AlgorithmStep } from './types'
import { bubbleCode, bubbleSort, type BubbleLanguage, type BubbleState } from './bubble'

export type SortId = 'bubble' | 'selection' | 'insertion' | 'quick' | 'shell' | 'heap' | 'merge' | 'radix'
type Metrics = { comparisons: number; writes: number }
type Emit = (tag: string, description: string, active?: number[], variables?: Record<string, number>, extra?: Partial<BubbleState>) => void
type Execute = (values: number[], done: number[], metrics: Metrics, emit: Emit) => void
type SortAlgorithm = AlgorithmModule<readonly number[], BubbleState> & {
  title: string
  code: Record<BubbleLanguage, string[]>
  principle: string
  time: string
  space: string
  note: string
}
const languages: BubbleLanguage[] = ['C', 'C++', 'Python']

function makeSort(id: SortId, source: Record<BubbleLanguage, string>, execute: Execute) {
  const rows = Object.fromEntries(languages.map(language => [language, source[language].split('\n').map(row => {
    const bar = row.indexOf('|')
    return { tag: row.slice(0, bar), text: row.slice(bar + 1) }
  })])) as Record<BubbleLanguage, { tag: string; text: string }[]>
  const code = Object.fromEntries(languages.map(language => [language, rows[language].map(row => row.text)])) as Record<BubbleLanguage, string[]>
  return {
    id,
    code,
    generate(input: readonly number[]) {
      if (!Array.isArray(input) || input.length > 16 || Array.from(input).some(value => !Number.isInteger(value) || Math.abs(value) > 99)) {
        throw new Error('数据必须是最多 16 个 -99 至 99 的整数。')
      }
      const values = [...input], done: number[] = [], metrics = { comparisons: 0, writes: 0 }
      const steps: AlgorithmStep<BubbleState>[] = []
      const emit: Emit = (tag, description, active = [], variables = {}, extra = {}) => steps.push({
        id: `${tag}-${steps.length}`,
        description,
        state: { values: [...values], done: [...done], ...metrics, ...extra },
        highlightedElements: active.map(String),
        highlightedLines: Object.fromEntries(languages.map(language => [language, rows[language].flatMap((row, index) => row.tag === tag ? [index + 1] : [])])),
        variables: { n: values.length, ...variables },
        duration: 800,
      })
      emit('init', '数据已就绪。点击下一步，或播放完整过程。')
      execute(values, done, metrics, emit)
      done.splice(0, done.length, ...values.map((_, index) => index))
      emit('done', values.length ? '排序完成，所有元素已到达最终位置。' : '排序完成：空数组无需比较。')
      return steps
    },
  }
}

const selection = makeSort('selection', {
  C: `init|void selection(int a[], int n) {
outer|  for (int i = 0; i < n - 1; i++) {
select|    int min = i;
compare|    for (int j = i + 1; j < n; j++) {
compare|      if (a[j] < a[min]) {
minimum|        min = j;
end|      }
end|    }
swap|    if (min != i) { int t = a[i]; a[i] = a[min]; a[min] = t; }
end|  }
done|}`,
  'C++': `init|void selection(vector<int>& a) {
outer|  for (int i = 0; i < static_cast<int>(a.size()) - 1; ++i) {
select|    int min = i;
compare|    for (int j = i + 1; j < static_cast<int>(a.size()); ++j) {
compare|      if (a[j] < a[min]) {
minimum|        min = j;
end|      }
end|    }
swap|    if (min != i) swap(a[i], a[min]);
end|  }
done|}`,
  Python: `init|def selection(a):
outer|    for i in range(len(a) - 1):
select|        minimum = i
compare|        for j in range(i + 1, len(a)):
compare|            if a[j] < a[minimum]:
minimum|                minimum = j
swap|        if minimum != i: a[i], a[minimum] = a[minimum], a[i]
done|    return a`,
}, (values, done, metrics, emit) => {
  for (let i = 0; i < values.length - 1; i++) {
    emit('outer', `第 ${i + 1} 轮：在未排序区间寻找最小值。`, [], { i })
    let min = i
    emit('select', `暂定 a[${i}] = ${values[i]} 为最小值。`, [i], { i, min })
    for (let j = i + 1; j < values.length; j++) {
      metrics.comparisons++
      emit('compare', `比较 a[${j}] = ${values[j]} 与当前最小值 ${values[min]}。`, [j, min], { i, j, min })
      if (values[j] < values[min]) {
        min = j
        emit('minimum', `发现更小值，下标 ${min} 成为新的最小值位置。`, [min], { i, j, min })
      }
    }
    if (min !== i) {
      ;[values[i], values[min]] = [values[min], values[i]]
      metrics.writes += 2
      emit('swap', `把最小值放到下标 ${i}。`, [i, min], { i, min })
    }
    done.push(i)
    emit('outer', `下标 ${i} 的元素已到达最终位置。`, [], { i, min })
  }
})

const insertion = makeSort('insertion', {
  C: `init|void insertion(int a[], int n) {
outer|  for (int i = 1; i < n; i++) {
pick|    int key = a[i], j = i - 1;
compare|    while (j >= 0 && a[j] > key) {
shift|      a[j + 1] = a[j];
shift|      j--;
end|    }
insert|    a[j + 1] = key;
end|  }
done|}`,
  'C++': `init|void insertion(vector<int>& a) {
outer|  for (int i = 1; i < static_cast<int>(a.size()); ++i) {
pick|    int key = a[i], j = i - 1;
compare|    while (j >= 0 && a[j] > key) {
shift|      a[j + 1] = a[j];
shift|      --j;
end|    }
insert|    a[j + 1] = key;
end|  }
done|}`,
  Python: `init|def insertion(a):
outer|    for i in range(1, len(a)):
pick|        key, j = a[i], i - 1
compare|        while j >= 0 and a[j] > key:
shift|            a[j + 1] = a[j]
shift|            j -= 1
insert|        a[j + 1] = key
done|    return a`,
}, (values, done, metrics, emit) => {
  if (values.length) done.push(0)
  for (let i = 1; i < values.length; i++) {
    emit('outer', `第 ${i + 1} 个元素：插入左侧有序区间。`, [], { i })
    const key = values[i]
    let j = i - 1
    emit('pick', `取出 ${key}，从有序区间末尾向左寻找位置。`, [i], { i, j, key })
    while (j >= 0) {
      metrics.comparisons++
      emit('compare', `比较 ${values[j]} 与待插入值 ${key}。`, [j, j + 1], { i, j, key })
      if (values[j] <= key) break
      values[j + 1] = values[j]
      metrics.writes++
      emit('shift', `将 ${values[j]} 右移一格，空出插入位置。`, [j, j + 1], { i, j, key })
      j--
    }
    values[j + 1] = key
    metrics.writes++
    done.push(i)
    emit('insert', `把 ${key} 放入下标 ${j + 1}，左侧区间保持有序。`, [j + 1], { i, j, key })
  }
})

const quick = makeSort('quick', {
  C: `init|void quick(int a[], int lo, int hi) {
base|  if (lo >= hi) return;
pivot|  int pivot = a[hi], i = lo;
outer|  for (int j = lo; j < hi; j++) {
compare|    if (a[j] < pivot) {
swap|      int t = a[i]; a[i] = a[j]; a[j] = t;
advance|      i++;
end|    }
end|  }
place|  int t = a[i]; a[i] = a[hi]; a[hi] = t;
recurse|  quick(a, lo, i - 1); quick(a, i + 1, hi);
done|}`,
  'C++': `init|void quick(vector<int>& a, int lo, int hi) {
base|  if (lo >= hi) return;
pivot|  int pivot = a[hi], i = lo;
outer|  for (int j = lo; j < hi; ++j) {
compare|    if (a[j] < pivot) {
swap|      swap(a[i], a[j]);
advance|      ++i;
end|    }
end|  }
place|  swap(a[i], a[hi]);
recurse|  quick(a, lo, i - 1); quick(a, i + 1, hi);
done|}`,
  Python: `init|def quick(a, lo, hi):
base|    if lo >= hi: return a
pivot|    pivot, i = a[hi], lo
outer|    for j in range(lo, hi):
compare|        if a[j] < pivot:
swap|            a[i], a[j] = a[j], a[i]
advance|            i += 1
place|    a[i], a[hi] = a[hi], a[i]
recurse|    quick(a, lo, i - 1); quick(a, i + 1, hi)
done|    return a`,
}, (values, done, metrics, emit) => {
  const sort = (lo: number, hi: number) => {
    if (lo >= hi) {
      if (lo === hi) done.push(lo)
      emit('base', lo === hi ? `下标 ${lo} 只剩一个元素，不必再分区。` : '子区间为空，返回上一层。', lo === hi ? [lo] : [], { lo, hi })
      return
    }
    const pivot = values[hi]
    let i = lo
    emit('pivot', `选末尾元素 ${pivot} 作为区间 [${lo}, ${hi}] 的基准。`, [hi], { lo, hi, pivot, i })
    for (let j = lo; j < hi; j++) {
      metrics.comparisons++
      emit('compare', `比较 ${values[j]} 与基准 ${pivot}；较小值进入左分区。`, [j, hi], { lo, hi, pivot, i, j })
      if (values[j] < pivot) {
        ;[values[i], values[j]] = [values[j], values[i]]
        metrics.writes += 2
        emit('swap', `将 ${values[i]} 放入左分区。`, [i, j], { lo, hi, pivot, i, j })
        i++
        emit('advance', '左分区边界右移一位。', [], { lo, hi, pivot, i, j })
      }
    }
    ;[values[i], values[hi]] = [values[hi], values[i]]
    metrics.writes += 2
    done.push(i)
    emit('place', `基准 ${pivot} 落在下标 ${i}，此位置不再改变。`, [i], { lo, hi, pivot, i })
    emit('recurse', '分别处理基准左右两侧。', [], { lo, hi, i })
    sort(lo, i - 1)
    sort(i + 1, hi)
  }
  sort(0, values.length - 1)
})

const shell = makeSort('shell', {
  C: `init|void shell(int a[], int n) {
gap|  for (int gap = n / 2; gap > 0; gap /= 2) {
outer|    for (int i = gap; i < n; i++) {
pick|      int key = a[i], j = i;
compare|      while (j >= gap && a[j - gap] > key) {
shift|        a[j] = a[j - gap]; j -= gap;
end|      }
insert|      a[j] = key;
end|    }
end|  }
done|}`,
  'C++': `init|void shell(vector<int>& a) {
gap|  for (int gap = a.size() / 2; gap > 0; gap /= 2) {
outer|    for (int i = gap; i < (int)a.size(); ++i) {
pick|      int key = a[i], j = i;
compare|      while (j >= gap && a[j - gap] > key) {
shift|        a[j] = a[j - gap]; j -= gap;
end|      }
insert|      a[j] = key;
end|    }
end|  }
done|}`,
  Python: `init|def shell(a):
gap|    gap = len(a) // 2
gap|    while gap:
outer|        for i in range(gap, len(a)):
pick|            key, j = a[i], i
compare|            while j >= gap and a[j - gap] > key:
shift|                a[j] = a[j - gap]; j -= gap
insert|            a[j] = key
gap|        gap //= 2
done|    return a`,
}, (values, _done, metrics, emit) => {
  for (let gap = Math.floor(values.length / 2); gap > 0; gap = Math.floor(gap / 2)) {
    emit('gap', `增量 gap = ${gap}：对相隔 ${gap} 个位置的元素做插入排序。`, [], { gap })
    for (let i = gap; i < values.length; i++) {
      const key = values[i]
      let j = i
      emit('pick', `取出 ${key}，沿增量 ${gap} 向左寻找位置。`, [i], { gap, i, key })
      while (j >= gap) {
        metrics.comparisons++
        emit('compare', `比较 ${values[j - gap]} 与 ${key}。`, [j - gap, j], { gap, i, j, key })
        if (values[j - gap] <= key) break
        values[j] = values[j - gap]
        metrics.writes++
        emit('shift', `把 ${values[j]} 向右移动 ${gap} 格。`, [j - gap, j], { gap, i, j })
        j -= gap
      }
      values[j] = key
      metrics.writes++
      emit('insert', `将 ${key} 放到下标 ${j}。`, [j], { gap, i, j })
    }
  }
})

const heap = makeSort('heap', {
  C: `init|void heap_sort(int a[], int n) {
build|  for (int i = n / 2 - 1; i >= 0; --i) sift(a, i, n);
outer|  for (int end = n - 1; end > 0; --end) {
extract|    int t = a[0]; a[0] = a[end]; a[end] = t;
sift|    sift(a, 0, end);
end|  }
done|}
sift|void sift(int a[], int root, int n) {
compare|  while (2 * root + 1 < n) {
compare|    int child = larger_child(a, root, n);
compare|    if (a[root] >= a[child]) return;
swap|    int t = a[root]; a[root] = a[child]; a[child] = t;
swap|    root = child;
end|  }
end|}`,
  'C++': `init|void heap_sort(vector<int>& a) {
build|  for (int i = a.size() / 2 - 1; i >= 0; --i) sift(a, i, a.size());
outer|  for (int end = a.size() - 1; end > 0; --end) {
extract|    swap(a[0], a[end]);
sift|    sift(a, 0, end);
end|  }
done|}
sift|void sift(vector<int>& a, int root, int n) {
compare|  while (2 * root + 1 < n) {
compare|    int child = larger_child(a, root, n);
compare|    if (a[root] >= a[child]) return;
swap|    swap(a[root], a[child]);
swap|    root = child;
end|  }
end|}`,
  Python: `init|def heap_sort(a):
build|    for i in range(len(a) // 2 - 1, -1, -1): sift(a, i, len(a))
outer|    for end in range(len(a) - 1, 0, -1):
extract|        a[0], a[end] = a[end], a[0]
sift|        sift(a, 0, end)
done|    return a
sift|def sift(a, root, n):
compare|    while 2 * root + 1 < n:
compare|        child = larger_child(a, root, n)
compare|        if a[root] >= a[child]: return
swap|        a[root], a[child] = a[child], a[root]
swap|        root = child`,
}, (values, done, metrics, emit) => {
  let heapSize = values.length
  const frame: Emit = (tag, description, active = [], vars = {}) => emit(tag, description, active, vars, { heapSize })
  const sift = (start: number) => {
    let root = start
    while (root * 2 + 1 < heapSize) {
      const left = root * 2 + 1, right = left + 1
      let child = left
      if (right < heapSize) {
        metrics.comparisons++
        frame('compare', `比较两个孩子 ${values[left]} 与 ${values[right]}，选较大者。`, [left, right], { root, left, right })
        if (values[right] > values[left]) child = right
      }
      metrics.comparisons++
      frame('compare', `比较父节点 ${values[root]} 与较大孩子 ${values[child]}。`, [root, child], { root, child })
      if (values[root] >= values[child]) break
      ;[values[root], values[child]] = [values[child], values[root]]
      metrics.writes += 2
      frame('swap', `交换父子节点，恢复大根堆。`, [root, child], { root, child })
      root = child
    }
  }
  for (let i = Math.floor(heapSize / 2) - 1; i >= 0; i--) { frame('build', `从下标 ${i} 向下调整，逐步建大根堆。`, [i], { i }); sift(i) }
  for (let end = values.length - 1; end > 0; end--) {
    frame('outer', `将堆顶最大值放到下标 ${end}。`, [0, end], { end })
    ;[values[0], values[end]] = [values[end], values[0]]
    metrics.writes += 2
    heapSize = end
    done.push(end)
    frame('extract', `最大值 ${values[end]} 已进入有序区，堆大小减为 ${end}。`, [end], { end })
    sift(0)
  }
})

const merge = makeSort('merge', {
  C: `init|void merge_sort(int a[], int lo, int hi, int tmp[]) {
base|  if (hi - lo < 2) return;
split|  int mid = (lo + hi) / 2;
split|  merge_sort(a, lo, mid, tmp); merge_sort(a, mid, hi, tmp);
compare|  int i = lo, j = mid, k = lo;
compare|  while (i < mid && j < hi) {
take|    tmp[k++] = a[i] <= a[j] ? a[i++] : a[j++];
end|  }
take|  while (i < mid) tmp[k++] = a[i++];
take|  while (j < hi) tmp[k++] = a[j++];
write|  for (k = lo; k < hi; ++k) a[k] = tmp[k];
done|}`,
  'C++': `init|void merge_sort(vector<int>& a, int lo, int hi, vector<int>& tmp) {
base|  if (hi - lo < 2) return;
split|  int mid = (lo + hi) / 2;
split|  merge_sort(a, lo, mid, tmp); merge_sort(a, mid, hi, tmp);
compare|  int i = lo, j = mid, k = lo;
compare|  while (i < mid && j < hi) {
take|    tmp[k++] = a[i] <= a[j] ? a[i++] : a[j++];
end|  }
take|  while (i < mid) tmp[k++] = a[i++];
take|  while (j < hi) tmp[k++] = a[j++];
write|  for (k = lo; k < hi; ++k) a[k] = tmp[k];
done|}`,
  Python: `init|def merge_sort(a, lo, hi, tmp):
base|    if hi - lo < 2: return
split|    mid = (lo + hi) // 2
split|    merge_sort(a, lo, mid, tmp); merge_sort(a, mid, hi, tmp)
compare|    i, j, k = lo, mid, lo
compare|    while i < mid and j < hi:
take|        if a[i] <= a[j]: tmp[k] = a[i]; i += 1
take|        else: tmp[k] = a[j]; j += 1
take|        k += 1
take|    while i < mid: tmp[k] = a[i]; i += 1; k += 1
take|    while j < hi: tmp[k] = a[j]; j += 1; k += 1
write|    for k in range(lo, hi): a[k] = tmp[k]
done|    return a`,
}, (values, _done, metrics, emit) => {
  const sort = (lo: number, hi: number) => {
    if (hi - lo < 2) return
    const mid = Math.floor((lo + hi) / 2)
    emit('split', `将区间 [${lo}, ${hi}) 分为 [${lo}, ${mid}) 与 [${mid}, ${hi})。`, [], { lo, mid, hi })
    sort(lo, mid); sort(mid, hi)
    const temp: (number | null)[] = Array(values.length).fill(null)
    let i = lo, j = mid, k = lo
    while (i < mid && j < hi) {
      metrics.comparisons++
      emit('compare', `比较左侧 ${values[i]} 与右侧 ${values[j]}。`, [i, j], { lo, mid, hi, i, j }, { temp: [...temp] })
      temp[k++] = values[i] <= values[j] ? values[i++] : values[j++]
      metrics.writes++
      emit('take', `较小值先进入临时数组。`, [k - 1], { lo, mid, hi, k }, { temp: [...temp] })
    }
    while (i < mid) { temp[k++] = values[i++]; metrics.writes++; emit('take', '左侧余项进入临时数组。', [k - 1], { lo, mid, hi, k }, { temp: [...temp] }) }
    while (j < hi) { temp[k++] = values[j++]; metrics.writes++; emit('take', '右侧余项进入临时数组。', [k - 1], { lo, mid, hi, k }, { temp: [...temp] }) }
    for (let at = lo; at < hi; at++) { values[at] = temp[at]!; metrics.writes++; emit('write', `将临时数组[${at}] 写回原数组。`, [at], { lo, mid, hi, at }, { temp: [...temp] }) }
  }
  sort(0, values.length)
})

const radix = makeSort('radix', {
  C: `init|void radix(int a[], int n) {
pass|  for (int exp = 1; exp <= 100; exp *= 10) {
bucket|    int count[10] = {0};
bucket|    for (int i = 0; i < n; ++i) count[((a[i] + 99) / exp) % 10]++;
collect|    stable_counting_pass(a, count, exp, 99);
end|  }
done|}`,
  'C++': `init|void radix(vector<int>& a) {
pass|  for (int exp = 1; exp <= 100; exp *= 10) {
bucket|    vector<vector<int>> buckets(10);
bucket|    for (int value : a) buckets[((value + 99) / exp) % 10].push_back(value);
collect|    a.clear(); for (auto& bucket : buckets) a.insert(a.end(), bucket.begin(), bucket.end());
end|  }
done|}`,
  Python: `init|def radix(a):
pass|    for exp in (1, 10, 100):
bucket|        buckets = [[] for _ in range(10)]
bucket|        for value in a: buckets[((value + 99) // exp) % 10].append(value)
collect|        a[:] = [value for bucket in buckets for value in bucket]
done|    return a`,
}, (values, _done, metrics, emit) => {
  for (const exp of [1, 10, 100]) {
    emit('pass', `按 ${exp === 1 ? '个位' : exp === 10 ? '十位' : '百位'}分桶；统一加 99 以处理负数。`, [], { exp })
    const buckets: number[][] = Array.from({ length: 10 }, () => [])
    for (let i = 0; i < values.length; i++) {
      const digit = Math.floor((values[i] + 99) / exp) % 10
      buckets[digit].push(values[i])
      emit('bucket', `${values[i]} 的当前位为 ${digit}，进入第 ${digit} 桶。`, [i], { exp, digit }, { buckets: buckets.map(bucket => [...bucket]) })
    }
    let at = 0
    for (const bucket of buckets) for (const value of bucket) { values[at] = value; metrics.writes++; emit('collect', `按桶号依次取出 ${value}，写到下标 ${at}。`, [at], { exp, at }, { buckets: buckets.map(item => [...item]) }); at++ }
  }
})

export const sortAlgorithms: Record<SortId, SortAlgorithm> = {
  bubble: { ...bubbleSort, title: '冒泡排序', code: bubbleCode, principle: '每一轮比较相邻元素，逆序就交换；一轮结束后最大值到达右侧。相等元素不交换，因此排序稳定。', time: 'O(n²)', space: 'O(1)', note: '此版本未加入提前终止优化，最好情况仍需 O(n²) 次比较。' },
  selection: { ...selection, title: '选择排序', principle: '每一轮从未排序区间选出最小值，放到区间最左端。交换次数少，但通常不稳定。', time: 'O(n²)', space: 'O(1)', note: '无论初始顺序如何，都要比较 n(n−1)/2 次。' },
  insertion: { ...insertion, title: '插入排序', principle: '左侧维持有序区间；取下一个元素，向左比较并右移较大的值，再插入空位。相等值不右移，因此稳定。', time: '最好 O(n) / 最坏 O(n²)', space: 'O(1)', note: '对接近有序的数据通常更快；移动次数随逆序程度增加。' },
  quick: { ...quick, title: '快速排序', principle: '用末尾元素作基准，将较小值分到左侧，固定基准后递归处理两边。通常不稳定。', time: '平均 O(n log n)', space: '平均 O(log n)', note: '已排序或大量重复值可退化到 O(n²) 时间和 O(n) 递归空间。' },
  shell: { ...shell, title: '希尔排序', principle: '先让间隔较远的元素分别有序，再逐步缩小增量，最后做一次普通插入排序。通常不稳定。', time: '依增量序列而定，最坏 O(n²)', space: 'O(1)', note: '这里使用增量 n/2、n/4…、1；前几轮不保证任何位置已最终排定。' },
  heap: { ...heap, title: '堆排序', principle: '先建大根堆，再反复把堆顶最大值放到数组末尾，并缩小堆区间。通常不稳定。', time: 'O(n log n)', space: 'O(1)', note: '数组下标 i 的两个孩子是 2i+1 和 2i+2；绿色区间已退出堆。' },
  merge: { ...merge, title: '归并排序', principle: '递归拆分数组，再将两个有序子区间稳定地合并到临时数组并写回。', time: 'O(n log n)', space: 'O(n)', note: '相等时先取左侧元素，所以保持原有相对顺序；临时数组展示当前合并区间。' },
  radix: { ...radix, title: '基数排序', principle: '从个位到百位稳定分桶，每一轮按桶号收集；统一加 99 后也可处理负数。', time: 'O(3n)', space: 'O(n + 10)', note: '本例输入范围 −99 至 99，固定做三轮十进制排序；它是稳定排序。' },
}
