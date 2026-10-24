export function parseValues(text) {
  if (!text.trim()) return [];
  const parts = text.trim().split(/[\s,，]+/);
  if (parts.length > 16 || parts.some(x => !/^-?\d+$/.test(x) || Math.abs(Number(x)) > 99))
    throw new Error('请输入最多 16 个 -99 至 99 的整数，用逗号或空格分隔。');
  return parts.map(Number);
}

export function trace(id, input, options = {}) {
  if(id==='string') {
    if(!Array.isArray(input)||input.length>16||input.some(x=>typeof x!=='string'||!/^[A-Za-z0-9]$/.test(x))) throw new Error('主串最多 16 个字符，只能输入英文字母和数字。');
    if(typeof options.pattern!=='string'||! /^[A-Za-z0-9]{1,8}$/.test(options.pattern)) throw new Error('模式串需为 1 至 8 个英文字母或数字。');
  } else if (!Array.isArray(input) || input.length > 16 || input.some(x => !Number.isInteger(x) || Math.abs(x) > 99)) throw new Error('数据必须是最多 16 个 -99 至 99 的整数。');
  const values = [...input], steps = [], output = [], done = [];
  let comparisons = 0, writes = 0;
  const emit = (tag, text, active = [], vars = {}, extra = {}) => steps.push(structuredClone({values, tag, text, active, done, vars, output, comparisons, writes, ...extra}));
  if(id!=='graph') emit('init', '数据已就绪。点击下一步，或播放完整过程。', [], {n: values.length});
  if(id==='string') {
    const pattern=options.pattern;
    for(let i=0;i<=values.length-pattern.length;i++) {
      done.length=0;
      emit('outer',`从主串下标 ${i} 开始尝试对齐模式串。`,[],{i,j:0},{pattern});
      let matched=true;
      for(let j=0;j<pattern.length;j++) {
        comparisons++;emit('compare',`比较主串[${i+j}] = ${values[i+j]} 与模式串[${j}] = ${pattern[j]}。`,[i+j],{i,j},{pattern});
        if(values[i+j]!==pattern[j]) {matched=false;emit('shift',`字符不同，起点从 ${i} 移到 ${i+1}。`,[i+j],{i,j},{pattern});break;}
        done.push(i+j);emit('match',`字符相同，继续比较模式串的下一个字符。`,[i+j],{i,j},{pattern});
      }
      if(matched){emit('found',`模式串首次出现的位置是 ${i}。`,[i],{i,result:i},{pattern});return steps;}
    }
    done.length=0;emit('done','所有起点都尝试过，未找到模式串，返回 -1。',[],{result:-1},{pattern});return steps;
  } else if (id === 'bubble') {
    for (let i = 0; i < values.length - 1; i++) {
      emit('outer', `第 ${i + 1} 轮：把未排序部分的最大值逐步移到右侧。`, [], {i});
      for (let j = 0; j < values.length - 1 - i; j++) {
        comparisons++;
        emit('compare', `比较 a[${j}] = ${values[j]} 与 a[${j + 1}] = ${values[j+1]}。`, [j,j+1], {i,j});
        if (values[j] > values[j+1]) {
          [values[j],values[j+1]] = [values[j+1],values[j]]; writes += 2;
          emit('swap', '左边较大，交换这两个元素的位置。', [j,j+1], {i,j});
        }
      }
      done.push(values.length-1-i);
      emit('outer', '本轮结束，右侧又有一个元素到达最终位置。', [], {i});
    }
  } else if (id === 'quick') {
    function sort(lo,hi) {
      if(lo>=hi) { if(lo===hi) done.push(lo); return; }
      const pivot = values[hi]; let i=lo;
      emit('pivot', `选择区间 [${lo}, ${hi}] 的末尾元素 ${pivot} 作为基准。`, [hi], {lo,hi,pivot,i});
      for(let j=lo;j<hi;j++) {
        comparisons++;
        emit('compare', `将 ${values[j]} 与基准 ${pivot} 比较。小于基准的元素移到左侧。`, [j,hi], {lo,hi,pivot,i,j});
        if(values[j]<pivot) {
          [values[i],values[j]]=[values[j],values[i]]; writes+=2;
          emit('swap', '把较小元素放入左分区。', [i,j], {lo,hi,pivot,i,j});
          i++; emit('advance','左分区边界向右移动一位。',[],{lo,hi,pivot,i,j});
        }
      }
      [values[i],values[hi]]=[values[hi],values[i]]; writes+=2; done.push(i);
      emit('place', `基准 ${pivot} 落在下标 ${i}，此位置不再改变。`, [i], {lo,hi,pivot,i});
      emit('recurse', '递归处理基准两侧的子区间。',[],{lo,hi,i});
      sort(lo,i-1); sort(i+1,hi);
    }
    sort(0,values.length-1);
  } else if(id==='binary') {
    const target=options.target;
    if(!Number.isInteger(target) || Math.abs(target)>99) throw new Error('目标值必须是 -99 至 99 的整数。');
    if(values.some((v,i)=>i>0&&v<values[i-1])) throw new Error('二分查找需要升序数据，请先按从小到大排列。');
    let lo=0,hi=values.length-1;
    emit('bounds','设定左右边界。',[],{lo,hi,target});
    while(lo<=hi) {
      const mid=Math.floor((lo+hi)/2); comparisons++;
      emit('mid',`取中点 mid = ${mid}，值为 ${values[mid]}。`,[mid],{lo,hi,mid,target},{range:[lo,hi]});
      if(values[mid]===target) { emit('found',`找到目标 ${target}，下标为 ${mid}。`,[mid],{lo,hi,mid,target,result:mid},{done:[mid]}); return steps; }
      if(values[mid]<target) {lo=mid+1;emit('right','中点值较小，排除中点及其左侧。',[],{lo,hi,mid,target},{range:[lo,hi]});}
      else {hi=mid-1;emit('left','中点值较大，排除中点及其右侧。',[],{lo,hi,mid,target},{range:[lo,hi]});}
    }
    emit('done','搜索区间为空，目标不存在，返回 -1。',[],{lo,hi,target,result:-1}); return steps;
  } else if(id==='graph') {
    if(values.length>10 || new Set(values).size!==values.length) throw new Error('图需要 1 至 10 个不重复的整数节点。');
    if(!values.length) throw new Error('图至少需要一个节点。');
    const start=options.start, order=options.order;
    if(!Number.isInteger(start)||start<0||start>=values.length) throw new Error('起点必须是有效的节点下标。');
    if(!['bfs','dfs'].includes(order)) throw new Error('请选择广度优先或深度优先。');
    const directed=options.directed===true, raw=(options.edges||'').trim(), pairs=raw?raw.split(/[,，\n]+/):[], hasWeights=pairs.some(part=>part.includes(':')), seenEdges=new Set(), edges=[], weightedEdges=[], adj=values.map(()=>[]);
    for(const pair of pairs) {
      const match=/^\s*(\d+)\s*-\s*(\d+)(?:\s*:\s*(\d+))?\s*$/.exec(pair);
      if(!match) throw new Error('边请写成 0-1 或 0-1:4，用节点下标连接，边权范围 0 至 99。');
      const a=Number(match[1]),b=Number(match[2]),key=directed?`${a}-${b}`:[a,b].sort((x,y)=>x-y).join('-');
      const weight=match[3]===undefined?1:Number(match[3]);
      if(a>=values.length||b>=values.length||a===b||seenEdges.has(key)||weight>99) throw new Error('边不能越界、自连或重复；边权须为 0 至 99。');
      seenEdges.add(key);edges.push([a,b]);weightedEdges.push([a,b,weight]);adj[a].push(b);if(!directed) adj[b].push(a);
    }
    adj.forEach(neighbors=>neighbors.sort((a,b)=>a-b));
    const visited=new Set(), discovered=new Set();
    const queueState=[];
    const frame=(tag,text,active=[],vars={},edge=[])=>emit(tag,text,active,vars,{edges,edge,directed,done:[...visited],output,queueIndices:[...queueState],discovered:[...discovered],...(hasWeights?{weightedEdges}:{})});
    frame('init','图已就绪。点击下一步，或播放完整过程。',[],{n:values.length});
    for(const root of [start,...values.map((_,i)=>i).filter(i=>i!==start)]) {
      if(discovered.has(root)) continue;
      frame('component',`从节点 ${values[root]} 开始探索一个连通分量。`,[root],{root});
      if(order==='bfs') {
        const queue=queueState;queue.push(root);discovered.add(root);
        frame('enqueue',`将节点 ${values[root]} 加入队列。`,[root],{queue:queue.map(i=>values[i]).join(', ')});
        while(queue.length) {
          const i=queue.shift();frame('dequeue',`从队首取出 ${values[i]}。`,[i],{queue:queue.map(j=>values[j]).join(', ')});
          visited.add(i);output.push(values[i]);frame('visit',`访问 ${values[i]}，记录遍历结果。`,[i],{queue:queue.map(j=>values[j]).join(', ')});
          for(const j of adj[i]) {
            frame('inspect',`检查 ${values[i]} 与 ${values[j]} 之间的边。`,[i,j],{queue:queue.map(k=>values[k]).join(', ')},[i,j]);
            if(!discovered.has(j)) {discovered.add(j);queue.push(j);frame('enqueue',`首次发现 ${values[j]}，加入队尾。`,[j],{queue:queue.map(k=>values[k]).join(', ')},[i,j]);}
          }
        }
      } else {
        function walk(i,depth) {
          discovered.add(i);frame('enter',`进入节点 ${values[i]}，递归深度 ${depth}。`,[i],{depth});
          visited.add(i);output.push(values[i]);frame('visit',`访问 ${values[i]}，记录遍历结果。`,[i],{depth});
          for(const j of adj[i]) {
            frame('inspect',`检查 ${values[i]} 与 ${values[j]} 之间的边。`,[i,j],{depth},[i,j]);
            if(!discovered.has(j)){frame('recurse',`沿这条边深入节点 ${values[j]}。`,[j],{depth},[i,j]);walk(j,depth+1);}
          }
        }
        walk(root,0);
      }
    }
    frame('done',`遍历完成：${output.join(' → ')}。`,[],{n:values.length});return steps;
  } else if(id==='tree') {
    if(values.length>15) throw new Error('树演示最多支持 15 个节点。');
    const order=options.order||'in';
    if(!['pre','in','post','level'].includes(order)) throw new Error('请选择有效的遍历顺序。');
    const visited=[];
    if(order==='level') {
      const queue=[];
      if(values.length) {queue.push(0);emit('enqueue',`将根节点 ${values[0]} 入队。`,[0],{queue:values[0]},{done:visited});}
      while(queue.length) {
        const i=queue.shift();
        emit('dequeue',`从队首取出节点 ${values[i]}。`,[i],{i,queue:queue.map(j=>values[j]).join(', ')},{done:visited});
        output.push(values[i]);visited.push(i);
        emit('visit',`访问节点 ${values[i]}，加入层序结果。`,[i],{i,queue:queue.map(j=>values[j]).join(', ')},{done:visited});
        for(const child of [i*2+1,i*2+2]) if(child<values.length) {
          queue.push(child);emit('enqueue',`将孩子节点 ${values[child]} 入队。`,[child],{i,queue:queue.map(j=>values[j]).join(', ')},{done:visited});
        }
      }
      emit('done',`层序遍历完成：${output.join(' → ')||'空树'}。`,[],{n:values.length},{done:visited});return steps;
    }
    const path=[];
    function walk(i,depth) {
      if(i>=values.length) return;
      path.push(i);emit('enter',`进入节点 ${values[i]}，递归深度 ${depth}。`,[i],{i,depth},{done:visited,path:[...path]});
      const visit=()=>{output.push(values[i]);visited.push(i);emit('visit',`访问节点 ${values[i]}，加入遍历结果。`,[i],{i,depth},{done:visited,path:[...path]});};
      if(order==='pre') visit();
      emit('left',`递归访问 ${values[i]} 的左子树。`,[i],{i,depth},{done:visited,path:[...path]});walk(i*2+1,depth+1);
      if(order==='in') visit();
      emit('right',`递归访问 ${values[i]} 的右子树。`,[i],{i,depth},{done:visited,path:[...path]});walk(i*2+2,depth+1);
      if(order==='post') visit();
      path.pop();
    }
    walk(0,0);
    emit('done',`遍历完成：${output.join(' → ')||'空树'}。`,[],{n:values.length},{done:visited}); return steps;
  } else if(['array','linked','stack','queue'].includes(id)) {
    const operation=options.operation||'insert', value=options.value;
    if(!['insert','remove'].includes(operation)) throw new Error('请选择插入或删除操作。');
    if(operation==='insert' && (!Number.isInteger(value)||Math.abs(value)>99)) throw new Error('插入值必须是 -99 至 99 的整数。');
    if(operation==='insert'&&values.length===16) throw new Error('演示最多容纳 16 个元素，请先删除一个。');
    if(operation==='remove'&&!values.length) throw new Error('结构为空，无法删除元素。');
    const pos=id==='stack'?values.length-(operation==='remove'?1:0):id==='queue'?(operation==='insert'?values.length:0):options.position;
    if(!Number.isInteger(pos)||pos<0||pos>values.length-(operation==='remove'?1:0)) throw new Error('位置越界：插入可选 0 到 n，删除可选 0 到 n−1。');
    if(id==='array') {
      if(operation==='insert') {
        for(let j=values.length;j>pos;j--) {values[j]=values[j-1];writes++;emit('shift',`a[${j-1}] 移到 a[${j}]，为新元素留出位置。`,[j-1,j],{pos,value,j});}
        values[pos]=value;writes++;emit('insert',`在下标 ${pos} 写入 ${value}。`,[pos],{pos,value});
      } else {
        emit('select',`删除下标 ${pos} 的元素 ${values[pos]}。`,[pos],{pos});
        for(let j=pos;j<values.length-1;j++){values[j]=values[j+1];writes++;emit('shift',`a[${j+1}] 左移到 a[${j}]。`,[j,j+1],{pos,j});}
        values.pop(); emit('remove','有效长度减一。',[],{pos,n:values.length});
      }
    } else if(id==='linked') {
      for(let j=0;j<pos;j++) emit('seek',`沿 next 指针经过下标 ${j} 的节点。`,[j],{pos,j});
      emit('link',operation==='insert'?'新节点指向原后继，再让前驱指向新节点；头部操作使用哨兵节点。':'让前驱跳过目标节点，连接它的后继。',[pos].filter(i=>i<values.length),{pos,...(operation==='insert'?{value}:{})});
      if(operation==='insert') values.splice(pos,0,value); else values.splice(pos,1);
      writes++;emit(operation,'链表连接更新完成。',operation==='insert'?[pos]:[],{pos,n:values.length});
    } else {
      if(operation==='insert') values.push(value); else if(id==='stack') values.pop(); else values.shift();
      writes++;emit(operation,id==='stack'?(operation==='insert'?'新元素入栈，成为栈顶。':'移除栈顶元素，后进先出。'):(operation==='insert'?'新元素从队尾入队。':'队首元素出队，先进先出。'),operation==='insert'?[values.length-1]:[],id==='stack'?{top:values.length-1,n:values.length}:{front:0,rear:values.length,n:values.length});
    }
    emit('done','操作完成。修改参数可生成新的演示。',[],{n:values.length});return steps;
  } else throw new Error('未知算法。');
  emit('done','排序完成，所有元素已按升序排列。',[],{n:values.length},{done:values.map((_,i)=>i)});
  return steps;
}
