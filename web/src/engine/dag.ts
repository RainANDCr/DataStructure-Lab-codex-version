export type DagId = 'topological' | 'critical'
export type DagFrame = { tag: string; text: string; values: number[]; active: number[]; done: number[]; output: number[]; comparisons: number; writes: number; edges: [number,number][]; weightedEdges?: [number,number,number][]; selectedEdges: [number,number][]; edge: number[]; directed: true; indegrees: number[]; earliest?: number[]; latest?: number[]; vars: Record<string,number|string> }

export function dagTrace(id: DagId, values: number[], rawEdges: string): DagFrame[] {
  const n = values.length
  if (n < 2 || n > 8 || new Set(values).size !== n) throw new Error('有向无环图需要 2 至 8 个不重复节点。')
  const edges: [number,number,number][] = [], seen = new Set<string>()
  for (const part of rawEdges.trim() ? rawEdges.split(/[,，\n]+/) : []) {
    const match = /^\s*(\d+)\s*-\s*(\d+)(?:\s*:\s*(\d+))?\s*$/.exec(part)
    if (!match || id === 'critical' && match[3] === undefined || id === 'topological' && match[3] !== undefined) throw new Error(id === 'critical' ? '活动边请写成 0-1:4。' : '有向边请写成 0-1。')
    const a = Number(match[1]), b = Number(match[2]), weight = Number(match[3] ?? 1), key = `${a}-${b}`
    if (a >= n || b >= n || a === b || weight < 1 || weight > 99 || seen.has(key)) throw new Error('边不能越界、自连、重复；活动持续时间须为 1 至 99。')
    seen.add(key); edges.push([a,b,weight])
  }
  const indegrees = Array<number>(n).fill(0), outdegrees = Array<number>(n).fill(0)
  for (const [a,b] of edges) { indegrees[b]++; outdegrees[a]++ }
  const originalIndegrees = [...indegrees], earliest = Array<number>(n).fill(0), latest = Array<number>(n).fill(0)
  const frames: DagFrame[] = [], done: number[] = [], output: number[] = [], selectedEdges: [number,number][] = []
  let comparisons = 0, writes = 0, lateReady = false
  const emit = (tag: string, text: string, active: number[] = [], edge: number[] = [], vars: DagFrame['vars'] = {}) => frames.push({
    tag, text, values: [...values], active: [...active], done: [...done], output: [...output], comparisons, writes,
    edges: edges.map(([a,b]) => [a,b]), weightedEdges: id === 'critical' ? edges.map(item => [...item]) : undefined,
    selectedEdges: selectedEdges.map(item => [...item]), edge: [...edge], directed: true, indegrees: [...indegrees],
    earliest: id === 'critical' ? [...earliest] : undefined, latest: id === 'critical' && lateReady ? [...latest] : undefined, vars,
  })
  emit('init', '统计每个节点的入度，入度为 0 的节点可以先处理。')
  while (done.length < n) {
    const u = values.findIndex((_, i) => !done.includes(i) && indegrees[i] === 0)
    if (u < 0) throw new Error('图中存在环，无法进行拓扑排序。')
    emit('select', `选取入度为 0 的节点 ${values[u]}。`, [u], [], { u, indegree: 0 })
    done.push(u); output.push(values[u]); writes++
    emit('visit', `把节点 ${values[u]} 加入拓扑序列。`, [u], [], { u })
    for (const [a,b,weight] of edges) if (a === u) {
      comparisons++
      if (id === 'critical' && earliest[a] + weight > earliest[b]) { earliest[b] = earliest[a] + weight; writes++; emit('early', `最早发生时间 ve[${b}] 更新为 ${earliest[b]}。`, [a,b], [a,b], { u:a,v:b,weight }) }
      indegrees[b]--; writes++
      emit('decrement', `移除 ${values[a]}→${values[b]} 后，节点 ${values[b]} 的入度变为 ${indegrees[b]}。`, [a,b], [a,b], { u:a,v:b,indegree:indegrees[b] })
    }
  }
  if (id === 'critical') {
    const sources = originalIndegrees.flatMap((degree, i) => degree === 0 ? [i] : [])
    const sinks = outdegrees.flatMap((degree, i) => degree === 0 ? [i] : [])
    if (sources.length !== 1 || sinks.length !== 1 || earliest.some((_,i) => i !== sources[0] && !edges.some(([,b]) => b === i))) throw new Error('关键路径需要单一起点与终点的连通 AOE 网。')
    const duration = earliest[sinks[0]]
    latest.fill(duration)
    lateReady = true
    emit('lateInit', `项目总工期为 ${duration}，从终点逆向计算最晚发生时间。`, [sinks[0]], [], { duration })
    for (let p = done.length - 1; p >= 0; p--) {
      const u = done[p]
      for (const [a,b,weight] of edges) if (a === u) {
        comparisons++
        if (latest[b] - weight < latest[a]) { latest[a] = latest[b] - weight; writes++; emit('late', `最晚发生时间 vl[${a}] 更新为 ${latest[a]}。`, [a,b], [a,b], { u:a,v:b,weight }) }
      }
    }
    for (const [a,b,weight] of edges) {
      comparisons++
      const slack = latest[b] - earliest[a] - weight
      if (slack === 0) selectedEdges.push([a,b])
      emit('check', `${values[a]}→${values[b]} 的时间余量为 ${slack}${slack === 0 ? '，属于关键活动' : ''}。`, [a,b], [a,b], { u:a,v:b,slack })
    }
    emit('done', `项目工期 ${duration}；绿色边为关键活动。`, [], [], { duration, critical: selectedEdges.length })
  } else emit('done', `拓扑序列：${output.join(' → ')}。`, [], [], { count: output.length })
  return frames
}

const source: Record<DagId,Record<'C'|'C++'|'Python',string>> = {
  topological: {
    C: `init|void topo(int n, int indeg[], int edge[8][8]) {
select|  while (count < n) { int u = first_zero_indegree(indeg);
visit|    order[count++] = u; indeg[u] = -1;
decrement|    for (int v = 0; v < n; v++) if (edge[u][v]) indeg[v]--;
select|  }
done|}`,
    'C++': `init|vector<int> topo(vector<vector<int>> adj, vector<int> indeg) {
select|  while (order.size() < adj.size()) { int u = firstZero(indeg);
visit|    order.push_back(u); indeg[u] = -1;
decrement|    for (int v : adj[u]) --indeg[v];
select|  }
done|  return order;
done|}`,
    Python: `init|def topo(adj, indeg):
select|    while len(order) < len(adj):
select|        u = next(i for i, d in enumerate(indeg) if d == 0)
visit|        order.append(u); indeg[u] = -1
decrement|        for v in adj[u]: indeg[v] -= 1
done|    return order`,
  },
  critical: {
    C: `init|void critical_path(int n, int edge[8][8], int indeg[]) {
select|  while (count < n) { int u = first_zero_indegree(indeg);
visit|    order[count++] = u; indeg[u] = -1;
early|    for (int v = 0; v < n; v++) if (edge[u][v]) ve[v] = max(ve[v], ve[u] + edge[u][v]);
decrement|    for (int v = 0; v < n; v++) if (edge[u][v]) indeg[v]--;
select|  }
lateInit|  for (int i = 0; i < n; i++) vl[i] = ve[finish];
late|  for (int p = n-1; p >= 0; p--) for (int v = 0; v < n; v++) if (edge[order[p]][v]) vl[order[p]] = min(vl[order[p]], vl[v]-edge[order[p]][v]);
check|  for (int u = 0; u < n; u++) for (int v = 0; v < n; v++) if (edge[u][v] && ve[u] == vl[v]-edge[u][v]) mark_critical(u,v);
done|}`,
    'C++': `init|void criticalPath(const vector<vector<Edge>>& adj) {
select|  for (int u : topoOrder(adj)) {
visit|    order.push_back(u);
early|    for (auto [v,w] : adj[u]) ve[v] = max(ve[v], ve[u] + w);
decrement|    for (auto [v,w] : adj[u]) --indeg[v];
select|  }
lateInit|  fill(vl.begin(), vl.end(), ve[finish]);
late|  for (int u : reverse(order)) for (auto [v,w] : adj[u]) vl[u] = min(vl[u], vl[v]-w);
check|  for (int u : order) for (auto [v,w] : adj[u]) if (ve[u] == vl[v]-w) markCritical(u,v);
done|}`,
    Python: `init|def critical_path(adj, indeg):
select|    for u in topological_order(adj, indeg):
visit|        order.append(u)
early|        for v, w in adj[u]: ve[v] = max(ve[v], ve[u] + w)
decrement|        for v, w in adj[u]: indeg[v] -= 1
lateInit|    vl = [ve[finish]] * len(adj)
late|    for u in reversed(order):
late|        for v, w in adj[u]: vl[u] = min(vl[u], vl[v] - w)
check|    critical = [(u,v) for u in order for v,w in adj[u] if ve[u] == vl[v]-w]
done|    return critical, ve[finish]`,
  },
}
export const dagSnippet = Object.fromEntries(Object.entries(source).map(([id, languages]) => [id, Object.fromEntries(Object.entries(languages).map(([language,text]) => [language, text.split('\n').map(row => { const bar = row.indexOf('|'); return { tag: row.slice(0,bar), text: row.slice(bar+1) } })]))])) as Record<DagId,Record<'C'|'C++'|'Python',{tag:string;text:string}[]>>
