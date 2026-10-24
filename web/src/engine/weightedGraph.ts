export type WeightedGraphId = 'prim' | 'dijkstra' | 'kruskal'
export type WeightedEdge = [number, number, number]
export type WeightedFrame = { tag: string; text: string; values: number[]; active: number[]; done: number[]; output: (number | string)[]; comparisons: number; writes: number; edges: [number, number][]; weightedEdges: WeightedEdge[]; selectedEdges: [number, number][]; edge: number[]; distances?: number[]; vars: Record<string, string | number> }

function parseGraph(values: number[], raw: string, start: number, target?: number): WeightedEdge[] {
  if (!values.length || values.length > 10 || new Set(values).size !== values.length) throw new Error('带权图需要 1 至 10 个不重复的整数节点。')
  if (!Number.isInteger(start) || start < 0 || start >= values.length) throw new Error('起点必须是有效的节点下标。')
  if (target !== undefined && (!Number.isInteger(target) || target < 0 || target >= values.length)) throw new Error('目标必须是有效的节点下标。')
  const seen = new Set<string>(), edges: WeightedEdge[] = []
  for (const part of raw.trim() ? raw.trim().split(/[,，\n]+/) : []) {
    const match = /^\s*(\d+)\s*-\s*(\d+)\s*:\s*(-?\d+)\s*$/.exec(part)
    if (!match) throw new Error('边请写成 0-1:4, 1-2:7，用节点下标和权重表示。')
    const a = Number(match[1]), b = Number(match[2]), weight = Number(match[3])
    if (a >= values.length || b >= values.length || a === b) throw new Error('边不能越界或连接节点自身。')
    if (!Number.isInteger(weight) || weight < 0 || weight > 99) throw new Error('边权必须是 0 至 99 的整数。')
    const key = [a, b].sort((x, y) => x - y).join('-')
    if (seen.has(key)) throw new Error('同一条无向边不能重复输入。')
    seen.add(key); edges.push([a, b, weight])
  }
  return edges
}

export function weightedTrace(id: WeightedGraphId, values: number[], options: { edges?: string; start?: number; target?: number }): WeightedFrame[] {
  const start = options.start as number, target = options.target as number
  const edges = parseGraph(values, options.edges ?? '', start, id === 'dijkstra' ? target : undefined)
  if (id === 'prim' || id === 'kruskal') {
    const connected = new Set([start])
    let previous = -1
    while (previous !== connected.size) { previous = connected.size; for (const [a, b] of edges) { if (connected.has(a)) connected.add(b); if (connected.has(b)) connected.add(a) } }
    if (connected.size !== values.length) throw new Error('图不连通，无法形成一棵覆盖全部节点的最小生成树。')
  }
  const done: number[] = [], output: (number | string)[] = [], selectedEdges: [number, number][] = [], frames: WeightedFrame[] = []
  let comparisons = 0, writes = 0, total = 0
  const distances = id === 'dijkstra' ? values.map(() => Infinity) : undefined
  const emit = (tag: string, text: string, active: number[] = [], edge: number[] = [], vars: Record<string, string | number> = {}) => frames.push({
    tag, text, values: [...values], active: [...active], done: [...done], output: [...output], comparisons, writes,
    edges: edges.map(([a, b]) => [a, b]), weightedEdges: edges.map(([a, b, weight]) => [a, b, weight]),
    selectedEdges: selectedEdges.map(([a, b]) => [a, b]), edge: [...edge], ...(distances ? { distances: [...distances] } : {}),
    vars: { ...(id === 'dijkstra' ? { start, target, dist: (distances ?? []).map(value => Number.isFinite(value) ? value : '∞').join(', ') } : { total }), ...vars },
  })
  emit('init', '带权无向图已就绪。点击下一步观察算法。', [], [], { n: values.length })
  if (id === 'prim') {
    const visited = new Set([start]); done.push(start)
    emit('seed', `从节点 ${values[start]} 开始构造最小生成树。`, [start])
    while (visited.size < values.length) {
      let best: WeightedEdge | undefined
      for (const candidate of edges) {
        const [a, b, weight] = candidate
        if (visited.has(a) === visited.has(b)) continue
        comparisons++; emit('inspect', `检查跨越树边界的边 ${values[a]}–${values[b]}，权重 ${weight}。`, [a, b], [a, b], { weight })
        if (!best || weight < best[2]) {
          best = candidate; emit('choose', `目前最轻的候选边是 ${values[a]}–${values[b]}，权重 ${weight}。`, [a, b], [a, b], { weight })
        }
      }
      if (!best) throw new Error('图不连通，无法形成最小生成树。')
      const [a, b, weight] = best, next = visited.has(a) ? b : a
      visited.add(next); done.push(next); selectedEdges.push([a, b]); output.push(`${values[a]}–${values[b]} (${weight})`); total += weight; writes++
      emit('add', `选定边 ${values[a]}–${values[b]}，将节点 ${values[next]} 加入树；当前总权重 ${total}。`, [a, b], [a, b], { weight, total })
    }
    emit('done', `最小生成树完成，总权重 ${total}。`, [], [], { total })
    return frames
  }

  if (id === 'kruskal') {
    const parent = values.map((_, i) => i)
    const find = (i: number): number => { while (parent[i] !== i) i = parent[i]; return i }
    const sorted = edges.map((edge, index) => ({ edge, index })).sort((a, b) => a.edge[2] - b.edge[2] || a.index - b.index)
    emit('sort', '将所有边按权重从小到大排序；同权沿用输入顺序。', [], [], { edges: sorted.length })
    for (const { edge: [a, b, weight] } of sorted) {
      comparisons++
      emit('inspect', `检查边 ${values[a]}–${values[b]}，权重 ${weight}。`, [a, b], [a, b], { weight })
      const ra = find(a), rb = find(b)
      if (ra === rb) { emit('cycle', '两端已在同一连通分量，加入会成环，跳过。', [a, b], [a, b]); continue }
      parent[rb] = ra; writes++; total += weight
      selectedEdges.push([a, b]); output.push(`${values[a]}–${values[b]} (${weight})`)
      emit('add', `加入边 ${values[a]}–${values[b]}，当前总权重 ${total}。`, [a, b], [a, b], { total })
      if (selectedEdges.length === values.length - 1) break
    }
    done.push(...values.map((_, i) => i))
    emit('done', `最小生成树完成，总权重 ${total}。`, [], [], { total })
    return frames
  }

  const dist = distances!, prev = values.map(() => -1), settled = new Set<number>()
  dist[start] = 0; emit('seed', `起点 ${values[start]} 的距离设为 0，其余暂为 ∞。`, [start])
  while (true) {
    let current = -1
    for (let i = 0; i < values.length; i++) if (!settled.has(i) && Number.isFinite(dist[i]) && (current === -1 || dist[i] < dist[current])) current = i
    if (current === -1) break
    emit('pick', `选择尚未确定且暂定距离最小的节点 ${values[current]}，距离 ${dist[current]}。`, [current], [], { current, distance: dist[current] })
    settled.add(current); done.push(current)
    emit('settle', `节点 ${values[current]} 的最短距离已确定。`, [current], [], { current, distance: dist[current] })
    for (const [a, b, weight] of edges) {
      const neighbor = a === current ? b : b === current ? a : -1
      if (neighbor === -1 || settled.has(neighbor)) continue
      comparisons++; emit('inspect', `检查边 ${values[current]}–${values[neighbor]}，尝试距离 ${dist[current]} + ${weight}。`, [current, neighbor], [current, neighbor], { weight })
      const candidate = dist[current] + weight
      if (candidate < dist[neighbor]) {
        dist[neighbor] = candidate; prev[neighbor] = current; writes++
        selectedEdges.length = 0
        prev.forEach((parent, child) => { if (parent !== -1) selectedEdges.push([parent, child]) })
        emit('relax', `找到到 ${values[neighbor]} 的更短路径，距离更新为 ${candidate}。`, [current, neighbor], [current, neighbor], { distance: candidate })
      }
    }
  }
  const path: number[] = []
  if (Number.isFinite(dist[target])) for (let i = target; i !== -1; i = prev[i]) path.unshift(i)
  output.push(...path.map(i => values[i]))
  selectedEdges.length = 0
  for (let i = 1; i < path.length; i++) selectedEdges.push([path[i - 1], path[i]])
  const result = Number.isFinite(dist[target]) ? dist[target] : -1
  emit('done', result === -1 ? `目标 ${values[target]} 不可达。` : `到 ${values[target]} 的最短距离为 ${result}，路径：${output.join(' → ')}。`, path, [], { result })
  return frames
}

const primSource = {
  C: `init|int prim(Edge edges[], int m, int n, int start) {
seed|  int used[10] = {0}, total = 0; used[start] = 1;
loop|  for (int count = 1; count < n; ++count) {
setup|    int best = -1;
inspect|    for (int i = 0; i < m; ++i) {
guard|      if (used[edges[i].a] == used[edges[i].b]) continue;
choose|      if (best < 0 || edges[i].weight < edges[best].weight) best = i;
end|    }
guard|    if (best < 0) return -1;
add|    int a = edges[best].a, b = edges[best].b;
add|    used[used[a] ? b : a] = 1; total += edges[best].weight;
end|  }
done|  return total;
end|}`,
  'C++': `init|int prim(const vector<Edge>& edges, int n, int start) {
seed|  vector<bool> used(n); used[start] = true; int total = 0;
loop|  for (int count = 1; count < n; ++count) {
setup|    int best = -1;
inspect|    for (int i = 0; i < (int)edges.size(); ++i) {
guard|      if (used[edges[i].a] == used[edges[i].b]) continue;
choose|      if (best < 0 || edges[i].weight < edges[best].weight) best = i;
end|    }
guard|    if (best < 0) return -1;
add|    int a = edges[best].a, b = edges[best].b;
add|    used[used[a] ? b : a] = true; total += edges[best].weight;
end|  }
done|  return total;
end|}`,
  Python: `init|def prim(edges, n, start):
seed|    used, total = {start}, 0
loop|    while len(used) < n:
setup|        best = None
inspect|        for a, b, weight in edges:
guard|            if (a in used) == (b in used): continue
choose|            if best is None or weight < best[2]: best = (a, b, weight)
guard|        if best is None: return -1
add|        a, b, weight = best
add|        used.add(b if a in used else a); total += weight
done|    return total`,
}
const dijkstraSource = {
  C: `init|int dijkstra(int n, int weight[10][10], int start, int target) {
setup|  const int INF = 1000000;
setup|  int dist[10], prev[10], used[10] = {0};
setup|  for (int i = 0; i < n; ++i) { dist[i] = INF; prev[i] = -1; }
seed|  dist[start] = 0;
loop|  for (int count = 0; count < n; ++count) {
pick|    int u = -1;
pick|    for (int i = 0; i < n; ++i)
pick|      if (!used[i] && dist[i] < INF && (u < 0 || dist[i] < dist[u])) u = i;
end|    if (u < 0) break;
settle|    used[u] = 1;
inspect|    for (int v = 0; v < n; ++v) if (weight[u][v] >= 0 && !used[v]) {
relax|      if (dist[u] + weight[u][v] < dist[v]) { dist[v] = dist[u] + weight[u][v]; prev[v] = u; }
end|    }
end|  }
done|  return dist[target] == INF ? -1 : dist[target]; // prev 可回溯路径
end|}`,
  'C++': `init|int dijkstra(const vector<vector<pair<int,int>>>& adj, int start, int target) {
setup|  const int INF = 1000000;
setup|  vector<int> dist(adj.size(), INF), prev(adj.size(), -1), used(adj.size());
seed|  dist[start] = 0;
loop|  for (int count = 0; count < (int)adj.size(); ++count) {
pick|    int u = -1;
pick|    for (int i = 0; i < (int)adj.size(); ++i)
pick|      if (!used[i] && dist[i] < INF && (u < 0 || dist[i] < dist[u])) u = i;
end|    if (u < 0) break;
settle|    used[u] = 1;
inspect|    for (auto [v, weight] : adj[u]) if (!used[v]) {
relax|      if (dist[u] + weight < dist[v]) { dist[v] = dist[u] + weight; prev[v] = u; }
end|    }
end|  }
done|  return dist[target] == INF ? -1 : dist[target]; // prev 可回溯路径
end|}`,
  Python: `init|def dijkstra(adj, start, target):
setup|    dist, prev, used = [float('inf')]*len(adj), [-1]*len(adj), set()
seed|    dist[start] = 0
loop|    for _ in range(len(adj)):
pick|        candidates = [i for i in range(len(adj)) if i not in used and dist[i] < float('inf')]
end|        if not candidates: break
pick|        u = min(candidates, key=lambda i: dist[i])
settle|        used.add(u)
inspect|        for v, weight in adj[u]:
relax|            if v not in used and dist[u] + weight < dist[v]:
relax|                dist[v], prev[v] = dist[u] + weight, u
done|    return (-1 if dist[target] == float('inf') else dist[target]), prev`,
}
const kruskalSource = {
  C: `init|int kruskal(Edge edges[], int m, int n) {
sort|  sort_edges_by_weight(edges, m);
sort|  int parent[10]; for (int i=0; i<n; ++i) parent[i]=i;
inspect|  for (int i=0, count=0, total=0; i<m; ++i) {
inspect|    int a=find(parent,edges[i].a), b=find(parent,edges[i].b);
cycle|    if (a==b) continue;
add|    parent[b]=a; total+=edges[i].weight;
done|    if (++count==n-1) return total;
inspect|  }
done|  return -1;
done|}`,
  'C++': `init|int kruskal(vector<Edge> edges, int n) {
sort|  stable_sort(edges.begin(), edges.end(), byWeight);
sort|  DSU dsu(n); int total=0, count=0;
inspect|  for (const auto& edge : edges) {
inspect|    int a=dsu.find(edge.a), b=dsu.find(edge.b);
cycle|    if (a==b) continue;
add|    dsu.unite(a,b); total+=edge.weight;
done|    if (++count==n-1) return total;
inspect|  }
done|  return -1;
done|}`,
  Python: `init|def kruskal(edges, n):
sort|    parent = list(range(n)); total = 0; count = 0
sort|    for a, b, weight in sorted(edges, key=lambda e: e[2]):
inspect|        ra, rb = find(parent, a), find(parent, b)
cycle|        if ra == rb: continue
add|        parent[rb] = ra; total += weight
done|        count += 1
done|        if count == n - 1: return total
done|    return -1`,
}
const sources = { prim: primSource, dijkstra: dijkstraSource, kruskal: kruskalSource }
export const weightedSnippet = Object.fromEntries(Object.entries(sources).map(([id, variants]) => [id, Object.fromEntries(Object.entries(variants).map(([language, text]) => [language, text.split('\n').map(row => { const divider = row.indexOf('|'); return { tag: row.slice(0, divider), text: row.slice(divider + 1) } })]))])) as Record<WeightedGraphId, Record<'C' | 'C++' | 'Python', { tag: string; text: string }[]>>
