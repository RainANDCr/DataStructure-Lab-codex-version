export type LinkedKind = 'linked' | 'circularLinked' | 'doublyLinked' | 'circularDoublyLinked'
export type LinkedOperation = 'create' | 'insert' | 'remove' | 'search' | 'traverse' | 'modify' | 'clear'
export type ListNode = { id: number; value: number; next: number | null; prev: number | null }
export type LinkedFrame = { tag: string; text: string; values: number[]; active: number[]; done: number[]; output: number[]; comparisons: number; writes: number; listNodes: ListNode[]; head: number | null; pointer?: [number, number]; vars: Record<string, number | string> }

export function linkedTrace(kind: LinkedKind, input: number[], options: {operation?: LinkedOperation; position?: number; value?: number; target?: number}): LinkedFrame[] {
  if (input.length > 12 || input.some(value => !Number.isInteger(value) || Math.abs(value) > 99)) throw new Error('链表最多支持 12 个 -99 至 99 的整数。')
  const operation = options.operation ?? 'insert', circular = kind === 'circularLinked' || kind === 'circularDoublyLinked', doubly = kind === 'doublyLinked' || kind === 'circularDoublyLinked'
  if (!(['create','insert','remove','search','traverse','modify','clear'] as string[]).includes(operation)) throw new Error('请选择有效的链表操作。')
  const position = options.position, value = options.value
  if ((operation === 'insert' || operation === 'modify') && (!Number.isInteger(value) || Math.abs(value!) > 99)) throw new Error('新值必须是 -99 至 99 的整数。')
  if (operation === 'search' && (!Number.isInteger(options.target) || Math.abs(options.target!) > 99)) throw new Error('目标值必须是 -99 至 99 的整数。')
  if ((operation === 'remove' || operation === 'modify') && !input.length) throw new Error('链表为空，无法执行该操作。')
  if ((operation === 'insert' || operation === 'remove' || operation === 'modify') && (!Number.isInteger(position) || position! < 0 || position! > input.length - (operation === 'insert' ? 0 : 1))) throw new Error('位置越界：插入可选 0 到 n，删除或修改可选 0 到 n−1。')
  if (operation === 'insert' && input.length === 12) throw new Error('链表已达到 12 个节点。')
  const nodes: ListNode[] = [], order: number[] = [], done: number[] = [], output: number[] = [], frames: LinkedFrame[] = []
  let head: number | null = null, comparisons = 0, writes = 0
  const node = (id: number) => nodes.find(item => item.id === id)!
  const emit = (tag: string, text: string, active: number[] = [], pointer?: [number,number], vars: LinkedFrame['vars'] = {}) => frames.push({ tag, text, values: order.map(id => node(id).value), active: [...active], done: [...done], output: [...output], comparisons, writes, listNodes: [...order.map(node),...nodes.filter(item=>!order.includes(item.id))].map(item => ({...item})), head, pointer, vars: {head: head === null ? '空' : head, ...vars} })
  const insertAt = (at: number, itemValue: number) => {
    const id = nodes.length ? Math.max(...nodes.map(item => item.id)) + 1 : 0
    const newNode: ListNode = {id,value:itemValue,next:null,prev:null}
    nodes.push(newNode);emit('allocate',`创建节点 #${id}，值为 ${itemValue}；此时尚未接入链表。`,[id],undefined,{id,value:itemValue})
    const pred = at > 0 ? order[at-1] : circular && order.length ? order.at(-1)! : null
    const succ = at < order.length ? order[at] : circular && order.length ? order[0] : null
    newNode.next = succ ?? (circular ? id : null);writes++
    emit('setNext',`新节点 #${id} 的 next 指向 ${newNode.next === null ? 'NULL' : `#${newNode.next}`}。`,[id],succ===null?undefined:[id,succ],{id})
    if (doubly) {newNode.prev = pred ?? (circular ? id : null);writes++;emit('setPrev',`新节点 #${id} 的 prev 指向 ${newNode.prev === null ? 'NULL' : `#${newNode.prev}`}。`,[id],pred===null?undefined:[id,pred],{id})}
    if (pred !== null) {node(pred).next = id;writes++;emit('relinkNext',`前驱 #${pred} 的 next 改指新节点 #${id}。`,[pred,id],[pred,id],{pred,id})}
    if (doubly && succ !== null) {node(succ).prev = id;writes++;emit('relinkPrev',`后继 #${succ} 的 prev 改指新节点 #${id}。`,[succ,id],[succ,id],{succ,id})}
    if (at === 0 || head === null) {head=id;emit('head',`头指针指向节点 #${id}。`,[id],undefined,{id})}
    order.splice(at,0,id);emit('commit',`节点 ${itemValue} 已接入位置 ${at}。`,[id],undefined,{position:at})
  }
  if (operation !== 'create') {
    input.forEach((item,id)=>{nodes.push({id,value:item,next:id+1<input.length?id+1:circular&&input.length?0:null,prev:doubly?(id? id-1:circular&&input.length?input.length-1:null):null});order.push(id)})
    head = order[0] ?? null
  }
  emit('init',operation==='create'?'从空链表开始，依次创建并接入节点。':'链表已就绪；节点编号在本次演示中保持不变。')
  if (operation === 'create') input.forEach((item,i)=>insertAt(i,item))
  else if (operation === 'insert') {
    for(let i=0;i<position!;i++){comparisons++;emit('seek',`沿 next 找到位置 ${i} 的节点。`,[order[i]],undefined,{position:i})}
    insertAt(position!,value!)
  } else if (operation === 'remove') {
    for(let i=0;i<position!;i++){comparisons++;emit('seek',`沿 next 经过位置 ${i} 的节点。`,[order[i]],undefined,{position:i})}
    const target=order[position!], pred=position!>0?order[position!-1]:circular&&order.length>1?order.at(-1)!:null, succ=position!<order.length-1?order[position!+1]:circular&&order.length>1?order[0]:null
    emit('select',`选中节点 #${target}，值为 ${node(target).value}。`,[target],undefined,{position:position!})
    if (pred !== null) {node(pred).next=succ;writes++;emit('unlinkNext',`前驱 #${pred} 的 next 跳过节点 #${target}。`,[pred,target],succ===null?undefined:[pred,succ],{pred,target})}
    if (doubly && succ !== null) {node(succ).prev=pred;writes++;emit('unlinkPrev',`后继 #${succ} 的 prev 跳过节点 #${target}。`,[succ,target],pred===null?undefined:[succ,pred],{succ,target})}
    if(position===0){head=succ;emit('head',`头指针改指 ${succ===null?'NULL':`#${succ}`}。`,succ===null?[]:[succ],undefined,{head:head??'空'})}
    nodes.splice(nodes.findIndex(item=>item.id===target),1);order.splice(position!,1);writes++
    emit('free',`释放节点 #${target}，链表剩余 ${order.length} 个节点。`,[],undefined,{target})
  } else if (operation === 'search') {
    let result=-1
    for(let i=0;i<order.length;i++){const id=order[i];comparisons++;emit('compare',`比较节点 #${id} 的 ${node(id).value} 与目标 ${options.target}。`,[id],undefined,{position:i,target:options.target!});if(node(id).value===options.target){result=i;done.push(id);break}}
    emit('done',result<0?'遍历结束，目标不存在。':`在位置 ${result} 找到目标。`,result<0?[]:[order[result]],undefined,{result});return frames
  } else if (operation === 'traverse') {
    for(let i=0;i<order.length;i++){const id=order[i];output.push(node(id).value);done.push(id);emit('visit',`访问节点 #${id}，记录 ${node(id).value}。`,[id],undefined,{position:i})}
  } else if (operation === 'modify') {
    for(let i=0;i<=position!;i++){comparisons++;emit('seek',`沿 next 到达位置 ${i}。`,[order[i]],undefined,{position:i})}
    const id=order[position!],old=node(id).value;node(id).value=value!;writes++;emit('modify',`节点 #${id} 的值由 ${old} 改为 ${value}。`,[id],undefined,{old,value:value!})
  } else if (operation === 'clear') {
    while(order.length){const id=order[0],next=order[1]??null;head=next;nodes.splice(nodes.findIndex(item=>item.id===id),1);order.shift();writes++;if(circular&&order.length)node(order.at(-1)!).next=head;if(doubly&&circular&&head!==null)node(head).prev=order.at(-1)!;if(doubly&&!circular&&head!==null)node(head).prev=null;emit('free',`释放节点 #${id}，头指针移向下一节点。`,[],undefined,{id})}
  }
  emit('done',`操作完成；当前链表为 ${order.map(id=>node(id).value).join(' → ')||'空'}。`,[],undefined,{count:order.length})
  return frames
}

const tagged = {
  C: `init|/* head points to the first node */
allocate|Node *new_node = malloc(sizeof(Node)); new_node->value = value;
seek|for (int i = 0; i < position; ++i) cursor = cursor->next;
setNext|new_node->next = successor;
setPrev|new_node->prev = predecessor;
relinkNext|if (predecessor) predecessor->next = new_node;
relinkPrev|if (successor) successor->prev = new_node;
head|head = successor_or_new_head;
commit|/* node is now reachable from head */
select|Node *target = cursor;
unlinkNext|if (predecessor) predecessor->next = successor;
unlinkPrev|if (successor) successor->prev = predecessor;
free|free(target);
compare|if (cursor->value == target_value) return position;
visit|visit(cursor->value);
modify|cursor->value = value;
done|return head;`,
  'C++': `init|// head points to the first node
allocate|Node* fresh = new Node{value};
seek|for (int i = 0; i < position; ++i) cursor = cursor->next;
setNext|fresh->next = successor;
setPrev|fresh->prev = predecessor;
relinkNext|if (predecessor) predecessor->next = fresh;
relinkPrev|if (successor) successor->prev = fresh;
head|head = nextHead;
commit|// new node is reachable from head
select|Node* victim = cursor;
unlinkNext|if (predecessor) predecessor->next = successor;
unlinkPrev|if (successor) successor->prev = predecessor;
free|delete victim;
compare|if (cursor->value == target) return position;
visit|visit(cursor->value);
modify|cursor->value = value;
done|return head;`,
  Python: `init|# head points to the first node
allocate|fresh = Node(value)
seek|for _ in range(position): cursor = cursor.next
setNext|fresh.next = successor
setPrev|fresh.prev = predecessor
relinkNext|if predecessor: predecessor.next = fresh
relinkPrev|if successor: successor.prev = fresh
head|head = next_head
commit|# fresh is reachable from head
select|victim = cursor
unlinkNext|if predecessor: predecessor.next = successor
unlinkPrev|if successor: successor.prev = predecessor
free|del victim
compare|if cursor.value == target: return position
visit|visit(cursor.value)
modify|cursor.value = value
done|return head`,
}
export const linkedSnippet = Object.fromEntries(Object.entries(tagged).map(([language,text])=>[language,text.split('\n').map(row=>{const bar=row.indexOf('|');return {tag:row.slice(0,bar),text:row.slice(bar+1)}})])) as Record<'C'|'C++'|'Python',{tag:string;text:string}[]>
