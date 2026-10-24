export type ThreadEdge=[number,number,'left'|'right']
export type ThreadedFrame={tag:string;text:string;values:number[];active:number[];done:number[];output:number[];comparisons:number;writes:number;threads:ThreadEdge[];path:number[];vars:Record<string,number|string>}

export function threadedTreeTrace(values:number[]):ThreadedFrame[]{
  if(values.length<1||values.length>7||values.some(value=>!Number.isInteger(value)||Math.abs(value)>99))throw new Error('线索二叉树需要 1 至 7 个 -99 至 99 的整数节点。')
  const frames:ThreadedFrame[]=[],threads:ThreadEdge[]=[],done:number[]=[],output:number[]=[],path:number[]=[]
  let writes=0,previous=-1
  const emit=(tag:string,text:string,active:number[]=[],vars:ThreadedFrame['vars']={})=>frames.push({tag,text,values:[...values],active:[...active],done:[...done],output:[...output],comparisons:0,writes,threads:threads.map(item=>[...item]),path:[...path],vars:{previous:previous<0?'空':values[previous],...vars}})
  emit('init','按层序建立二叉树，随后中序遍历；仅空孩子指针可改为线索。')
  const walk=(i:number)=>{
    if(i>=values.length)return
    path.push(i);emit('enter',`进入节点 ${values[i]}。`,[i],{i,depth:path.length-1})
    walk(i*2+1)
    if(i*2+1>=values.length&&previous>=0){threads.push([i,previous,'left']);writes++;emit('threadLeft',`${values[i]} 的左孩子为空，改为指向中序前驱 ${values[previous]}。`,[i,previous],{i,pred:previous})}
    if(previous>=0&&previous*2+2>=values.length){threads.push([previous,i,'right']);writes++;emit('threadRight',`${values[previous]} 的右孩子为空，改为指向中序后继 ${values[i]}。`,[previous,i],{pred:previous,i})}
    output.push(values[i]);done.push(i);emit('visit',`中序访问 ${values[i]}。`,[i],{i})
    previous=i
    walk(i*2+2)
    path.pop();emit('return',`返回节点 ${values[i]} 的上层。`,[i],{i})
  }
  walk(0)
  emit('done',`中序序列：${output.join(' → ')}；已建立 ${threads.length} 条线索。`,[],{threads:threads.length})
  return frames
}

const source={
  C:`init|Node *prev = NULL;
enter|void thread_inorder(Node *node) {
enter|  if (!node) return;
enter|  thread_inorder(node->left);
threadLeft|  if (!node->left) { node->left = prev; node->ltag = THREAD; }
threadRight|  if (prev && !prev->right) { prev->right = node; prev->rtag = THREAD; }
visit|  visit(node); prev = node;
enter|  thread_inorder(node->right);
return|}
done|/* all null child pointers now carry predecessor/successor threads */`,
  'C++':`init|Node* prev = nullptr;
enter|void threadInorder(Node* node) {
enter|  if (!node) return;
enter|  threadInorder(node->left);
threadLeft|  if (!node->left) { node->left = prev; node->ltag = true; }
threadRight|  if (prev && !prev->right) { prev->right = node; prev->rtag = true; }
visit|  visit(node); prev = node;
enter|  threadInorder(node->right);
return|}
done|// null children are threaded to inorder neighbors`,
  Python:`init|previous = None
enter|def thread_inorder(node):
init|    nonlocal previous
enter|    if node is None: return
enter|    thread_inorder(node.left)
threadLeft|    if node.left is None: node.left_thread = previous
threadRight|    if previous and previous.right is None: previous.right_thread = node
visit|    visit(node); previous = node
enter|    thread_inorder(node.right)
return|    return
done|# empty child links are inorder threads`,
}
export const threadedSnippet=Object.fromEntries(Object.entries(source).map(([language,text])=>[language,text.split('\n').map(row=>{const bar=row.indexOf('|');return {tag:row.slice(0,bar),text:row.slice(bar+1)}})])) as Record<'C'|'C++'|'Python',{tag:string;text:string}[]>
