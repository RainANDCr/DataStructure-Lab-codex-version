export type GeneralOrder='pre'|'post'|'level'
export type GeneralFrame={tag:string;text:string;values:number[];active:number[];done:number[];output:number[];comparisons:number;writes:number;edges:[number,number][];depths:number[];path:number[];vars:Record<string,number|string>}

export function generalTreeTrace(values:number[],rawEdges:string,order:GeneralOrder):GeneralFrame[]{
  const n=values.length
  if(n<1||n>10||new Set(values).size!==n)throw new Error('普通树需要 1 至 10 个不重复整数节点。')
  if(!['pre','post','level'].includes(order))throw new Error('请选择先根、后根或层序遍历。')
  const edges:[number,number][]=[],children:number[][]=Array.from({length:n},()=>[]),parent=Array<number>(n).fill(-1)
  for(const part of rawEdges.trim()?rawEdges.split(/[,，\n]+/):[]){const match=/^\s*(\d+)\s*-\s*(\d+)\s*$/.exec(part);if(!match)throw new Error('父子边请写成 0-1, 0-2。');const a=Number(match[1]),b=Number(match[2]);if(a>=n||b>=n||a===b||b===0||parent[b]!==-1)throw new Error('边越界、自连、指向根节点或一个节点有多个父亲。');parent[b]=a;children[a].push(b);edges.push([a,b])}
  if(edges.length!==n-1||parent.slice(1).some(item=>item<0))throw new Error('普通树需要 n−1 条父子边，根节点为下标 0。')
  const depths=Array<number>(n).fill(-1);depths[0]=0
  const discover=(i:number)=>{for(const child of children[i]){if(depths[child]>=0)throw new Error('父子边中存在环。');depths[child]=depths[i]+1;discover(child)}}
  discover(0)
  if(depths.some(depth=>depth<0))throw new Error('所有节点都必须从根节点可达。')
  children.forEach(items=>items.sort((a,b)=>a-b))
  const frames:GeneralFrame[]=[],done:number[]=[],output:number[]=[],path:number[]=[]
  let comparisons=0
  const emit=(tag:string,text:string,active:number[]=[],vars:GeneralFrame['vars']={})=>frames.push({tag,text,values:[...values],active:[...active],done:[...done],output:[...output],comparisons,writes:0,edges:edges.map(item=>[...item]),depths:[...depths],path:[...path],vars})
  emit('init',`以节点 ${values[0]} 为根，孩子按下标升序访问。`)
  const visit=(i:number)=>{done.push(i);output.push(values[i]);emit('visit',`访问节点 ${values[i]}。`,[i],{i,depth:depths[i]})}
  if(order==='level'){
    const queue=[0];emit('enqueue',`根节点 ${values[0]} 入队。`,[0],{queue:values[0]})
    while(queue.length){const i=queue.shift()!;emit('dequeue',`节点 ${values[i]} 出队。`,[i],{queue:queue.map(j=>values[j]).join(',')});visit(i);for(const child of children[i]){queue.push(child);comparisons++;emit('enqueue',`孩子 ${values[child]} 入队。`,[child],{queue:queue.map(j=>values[j]).join(',')})}}
  }else{
    const walk=(i:number)=>{path.push(i);emit('enter',`进入节点 ${values[i]}，递归深度 ${path.length-1}。`,[i],{i,depth:path.length-1});if(order==='pre')visit(i);for(const child of children[i]){comparisons++;emit('child',`沿父子边进入 ${values[child]}。`,[i,child],{parent:i,child});walk(child)}if(order==='post')visit(i);path.pop();emit('return',`返回节点 ${values[i]} 的父节点。`,[i],{i})}
    walk(0)
  }
  emit('done',`遍历完成：${output.join(' → ')}。`,[],{count:output.length})
  return frames
}

const source:Record<GeneralOrder,Record<'C'|'C++'|'Python',string>>={
  pre:{C:`init|/* childCount[u] and children[u][k] store child indices */
enter|void preorder(int u) {
visit|  visit(u);
child|  for (int k=0;k<childCount[u];k++) preorder(children[u][k]);
return|}
done|preorder(root);`,'C++':`init|// children[u] stores all children of u
enter|void preorder(int u) {
visit|  visit(u);
child|  for (int v : children[u]) preorder(v);
return|}
done|preorder(root);`,Python:`init|# children[u] stores all children of u
enter|def preorder(u):
visit|    visit(u)
child|    for v in children[u]: preorder(v)
return|    return
done|preorder(root)`},
  post:{C:`init|/* childCount[u] and children[u][k] store child indices */
enter|void postorder(int u) {
child|  for (int k=0;k<childCount[u];k++) postorder(children[u][k]);
visit|  visit(u);
return|}
done|postorder(root);`,'C++':`init|// children[u] stores all children of u
enter|void postorder(int u) {
child|  for (int v : children[u]) postorder(v);
visit|  visit(u);
return|}
done|postorder(root);`,Python:`init|# children[u] stores all children of u
enter|def postorder(u):
child|    for v in children[u]: postorder(v)
visit|    visit(u)
return|    return
done|postorder(root)`},
  level:{C:`init|int queue[10], head=0, tail=0;
enqueue|queue[tail++] = root;
dequeue|while (head < tail) { int u=queue[head++];
visit|  visit(u);
enqueue|  for (int k=0;k<childCount[u];k++) queue[tail++]=children[u][k];
done|}`,'C++':`init|queue<int> q;
enqueue|q.push(root);
dequeue|while (!q.empty()) { int u=q.front(); q.pop();
visit|  visit(u);
enqueue|  for (int v : children[u]) q.push(v);
done|}`,Python:`init|from collections import deque
enqueue|queue = deque([root])
dequeue|while queue:
dequeue|    u = queue.popleft()
visit|    visit(u)
enqueue|    for v in children[u]: queue.append(v)
done|return`},
}
export const generalSnippet=Object.fromEntries(Object.entries(source).map(([order,languages])=>[order,Object.fromEntries(Object.entries(languages).map(([language,text])=>[language,text.split('\n').map(row=>{const bar=row.indexOf('|');return {tag:row.slice(0,bar),text:row.slice(bar+1)}})]))])) as Record<GeneralOrder,Record<'C'|'C++'|'Python',{tag:string;text:string}[]>>
