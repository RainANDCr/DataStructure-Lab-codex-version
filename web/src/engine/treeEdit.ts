export type TreeEditOperation='create'|'insert'|'remove'
export type TreeEditFrame={tag:string;text:string;values:number[];active:number[];done:number[];output:number[];comparisons:number;writes:number;treeSlots:(number|null)[];vars:Record<string,number|string>}

export function treeEditTrace(raw:string,operation:TreeEditOperation,position?:number,value?:number):TreeEditFrame[]{
  if(!['create','insert','remove'].includes(operation))throw new Error('请选择创建、插入或删除。')
  const parts=raw.trim()?raw.split(/[,，\s]+/):[],initial:(number|null)[]=Array(15).fill(null)
  if(parts.length>15)throw new Error('二叉树最多支持 15 个层序位置。')
  parts.forEach((part,i)=>{if(part==='#')return;if(!/^-?\d+$/.test(part)||Math.abs(Number(part))>99)throw new Error('节点须为 -99 至 99 的整数，空位用 #。');initial[i]=Number(part)})
  if(initial.some((item,i)=>item!==null&&i>0&&initial[Math.floor((i-1)/2)]===null))throw new Error('非空节点必须有非空父节点；空位用 # 保留位置。')
  if(operation==='insert'&&(!Number.isInteger(value)||Math.abs(value!)>99))throw new Error('新节点值须为 -99 至 99 的整数。')
  if(operation!=='create'&&(!Number.isInteger(position)||position!<0||position!>=15))throw new Error('位置须为 0 至 14 的层序下标。')
  if(operation==='insert'&&(initial[position!]!==null||position!>0&&initial[Math.floor((position!-1)/2)]===null))throw new Error('插入位置必须为空，且父节点必须存在。')
  if(operation==='remove'&&initial[position!]===null)throw new Error('删除位置必须有节点。')
  const slots:(number|null)[]=operation==='create'?Array(15).fill(null):[...initial],frames:TreeEditFrame[]=[],done:number[]=[]
  let writes=0
  const emit=(tag:string,text:string,active:number[]=[],vars:TreeEditFrame['vars']={})=>frames.push({tag,text,values:slots.filter((item):item is number=>item!==null),active:[...active],done:[...done],output:slots.filter((item):item is number=>item!==null),comparisons:0,writes,treeSlots:[...slots],vars:{count:slots.filter(item=>item!==null).length,...vars}})
  emit('init',operation==='create'?'从空树开始，按层序位置逐个接入节点。':'二叉树已按层序位置建立；# 是空孩子。')
  if(operation==='create'){
    for(let i=0;i<initial.length;i++)if(initial[i]!==null){if(i>0)emit('parent',`找到位置 ${i} 的父节点 ${Math.floor((i-1)/2)}。`,[Math.floor((i-1)/2)],{position:i});slots[i]=initial[i];writes++;done.push(i);emit('attach',`把 ${initial[i]} 接入位置 ${i}。`,[i],{position:i})}
  }else if(operation==='insert'){
    if(position!>0)emit('parent',`找到父节点，准备在其${position!%2?'左':'右'}孩子位置接入新节点。`,[Math.floor((position!-1)/2)],{position:position!})
    slots[position!]=value!;writes++;emit('attach',`新节点 ${value} 接入位置 ${position}。`,[position!],{position:position!,value:value!})
  }else{
    const visit=(i:number)=>{if(i>=15||slots[i]===null)return;visit(2*i+1);visit(2*i+2);const removed=slots[i];slots[i]=null;writes++;emit('detach',`断开并删除位置 ${i} 的节点 ${removed}。`,[i],{position:i,removed:removed!})}
    emit('select',`选中位置 ${position}，删除该节点及整棵子树。`,[position!],{position:position!})
    visit(position!)
  }
  emit('done',`操作完成，树中还有 ${slots.filter(item=>item!==null).length} 个节点。`)
  return frames
}

const source:Record<TreeEditOperation,Record<'C'|'C++'|'Python',string>>={
  create:{C:`init|/* slots are level-order positions */
parent|int parent = (i-1)/2;
attach|slots[i] = value;
done|return root;`,'C++':`init|vector<optional<int>> slots(15);
parent|int parent = (i-1)/2;
attach|slots[i] = value;
done|return slots;`,Python:`init|slots = [None] * 15
parent|parent = (i-1) // 2
attach|slots[i] = value
done|return slots`},
  insert:{C:`init|/* insert at an empty child position */
parent|int parent = (position-1)/2;
attach|slots[position] = value;
done|return root;`,'C++':`init|// insert at an empty child position
parent|int parent = (position-1)/2;
attach|slots[position] = value;
done|return slots;`,Python:`init|# insert at an empty child position
parent|parent = (position-1) // 2
attach|slots[position] = value
done|return slots`},
  remove:{C:`init|void erase_subtree(int i) {
select|  /* selected node becomes subtree root */
detach|  erase_subtree(2*i+1); erase_subtree(2*i+2); slots[i] = EMPTY;
done|}`,'C++':`init|void eraseSubtree(int i) {
select|  // selected node becomes subtree root
detach|  eraseSubtree(2*i+1); eraseSubtree(2*i+2); slots[i].reset();
done|}`,Python:`init|def erase_subtree(i):
select|    # selected node becomes subtree root
detach|    erase_subtree(2*i+1); erase_subtree(2*i+2); slots[i] = None
done|    return slots`},
}
export const treeEditSnippet=Object.fromEntries(Object.entries(source).map(([op,languages])=>[op,Object.fromEntries(Object.entries(languages).map(([language,text])=>[language,text.split('\n').map(row=>{const bar=row.indexOf('|');return {tag:row.slice(0,bar),text:row.slice(bar+1)}})]))])) as Record<TreeEditOperation,Record<'C'|'C++'|'Python',{tag:string;text:string}[]>>
