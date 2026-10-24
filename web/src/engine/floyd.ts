export type FloydFrame = { tag: string; text: string; values: number[]; active: number[]; done: number[]; output: number[]; comparisons: number; writes: number; edges: [number, number][]; weightedEdges: [number, number, number][]; selectedEdges: [number, number][]; edge: number[]; directed: boolean; distanceMatrix: number[][]; vars: Record<string, number | string> }

export function floydTrace(values: number[], rawEdges: string, start: number, target: number): FloydFrame[] {
  const n = values.length
  if (n < 2 || n > 6 || new Set(values).size !== n) throw new Error('Floyd 演示需要 2 至 6 个不重复节点。')
  if (![start, target].every(index => Number.isInteger(index) && index >= 0 && index < n)) throw new Error('起点和目标必须是有效的节点下标。')
  const edges: [number, number, number][] = [], seen = new Set<string>()
  for (const part of rawEdges.trim() ? rawEdges.split(/[,，\n]+/) : []) {
    const match = /^\s*(\d+)\s*-\s*(\d+)\s*:\s*(\d+)\s*$/.exec(part)
    if (!match) throw new Error('有向边请写成 0-1:4, 1-2:7。')
    const a = Number(match[1]), b = Number(match[2]), weight = Number(match[3]), key = `${a}-${b}`
    if (a >= n || b >= n || a === b || weight > 99 || seen.has(key)) throw new Error('边不能越界、自连、重复，边权须为 0 至 99。')
    seen.add(key); edges.push([a, b, weight])
  }
  const dist = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 0 : Infinity))
  const next = Array.from({ length: n }, () => Array<number>(n).fill(-1))
  for (const [a,b,weight] of edges) { dist[a][b] = weight; next[a][b] = b }
  const frames: FloydFrame[] = [], output: number[] = [], done: number[] = [], selectedEdges: [number,number][] = []
  let comparisons = 0, writes = 0
  const emit = (tag: string, text: string, active: number[] = [], edge: number[] = [], vars: FloydFrame['vars'] = {}) => frames.push({
    tag, text, values: [...values], active: [...active], done: [...done], output: [...output], comparisons, writes,
    edges: edges.map(([a,b]) => [a,b]), weightedEdges: edges.map(item => [...item] as [number,number,number]),
    selectedEdges: selectedEdges.map(item => [...item] as [number,number]), edge: [...edge], directed: true,
    distanceMatrix: dist.map(row => [...row]), vars: { start, target, ...vars },
  })
  emit('init', '距离矩阵已初始化：对角线为 0，有向边为其权重，其他位置为 ∞。')
  for (let k = 0; k < n; k++) {
    emit('pivot', `尝试让节点 ${values[k]} 作为中转点。`, [k], [], { k })
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (i === j || !Number.isFinite(dist[i][k]) || !Number.isFinite(dist[k][j])) continue
      comparisons++
      emit('compare', `比较 ${values[i]}→${values[j]} 的当前距离与经 ${values[k]} 中转的 ${dist[i][k] + dist[k][j]}。`, [i,k,j], [], { i, j, k })
      if (dist[i][k] + dist[k][j] < dist[i][j]) {
        dist[i][j] = dist[i][k] + dist[k][j]; next[i][j] = next[i][k]; writes++
        emit('relax', `更新距离 d[${i}][${j}] = ${dist[i][j]}。`, [i,k,j], [], { i, j, k, distance: dist[i][j] })
      }
    }
    done.push(k)
  }
  const result = Number.isFinite(dist[start][target]) ? dist[start][target] : -1
  if (result !== -1) {
    let at = start
    output.push(values[at])
    while (at !== target) { const following = next[at][target]; if (following < 0) throw new Error('路径重建失败。'); selectedEdges.push([at,following]); at = following; output.push(values[at]) }
  }
  emit('done', result < 0 ? `从 ${values[start]} 到 ${values[target]} 不可达。` : `最短距离为 ${result}，路径：${output.join(' → ')}。`, [], [], { result })
  return frames
}

const source = {
  C: `init|void floyd(int n, int dist[6][6], int next[6][6]) {
pivot|  for (int k = 0; k < n; k++)
compare|    for (int i = 0; i < n; i++) for (int j = 0; j < n; j++)
compare|      if (dist[i][k] < INF && dist[k][j] < INF && dist[i][k] + dist[k][j] < dist[i][j]) {
relax|        dist[i][j] = dist[i][k] + dist[k][j];
relax|        next[i][j] = next[i][k];
compare|      }
done|}`,
  'C++': `init|void floyd(vector<vector<int>>& dist, vector<vector<int>>& next) {
pivot|  for (int k = 0; k < (int)dist.size(); ++k)
compare|    for (int i = 0; i < (int)dist.size(); ++i) for (int j = 0; j < (int)dist.size(); ++j)
compare|      if (dist[i][k] < INF && dist[k][j] < INF && dist[i][k] + dist[k][j] < dist[i][j]) {
relax|        dist[i][j] = dist[i][k] + dist[k][j];
relax|        next[i][j] = next[i][k];
compare|      }
done|}`,
  Python: `init|def floyd(dist, next_node):
pivot|    for k in range(len(dist)):
compare|        for i in range(len(dist)):
compare|            for j in range(len(dist)):
compare|                if dist[i][k] + dist[k][j] < dist[i][j]:
relax|                    dist[i][j] = dist[i][k] + dist[k][j]
relax|                    next_node[i][j] = next_node[i][k]
done|    return dist, next_node`,
}
export const floydSnippet = Object.fromEntries(Object.entries(source).map(([language, text]) => [language, text.split('\n').map(row => { const bar = row.indexOf('|'); return { tag: row.slice(0,bar), text: row.slice(bar+1) } })])) as Record<'C'|'C++'|'Python',{tag:string;text:string}[]>
