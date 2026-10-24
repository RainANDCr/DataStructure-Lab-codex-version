import type { LinkedOperation } from './linkedVariants'

export type ArrayFrame={tag:string;text:string;values:number[];active:number[];done:number[];output:number[];comparisons:number;writes:number;vars:Record<string,number|string>}

export function arrayExtraTrace(input:number[],operation:Exclude<LinkedOperation,'insert'|'remove'>,options:{position?:number;value?:number;target?:number}):ArrayFrame[]{
  if(input.length>16||input.some(value=>!Number.isInteger(value)||Math.abs(value)>99))throw new Error('顺序表最多支持 16 个 -99 至 99 的整数。')
  const values=operation==='create'?[]:[...input],frames:ArrayFrame[]=[],done:number[]=[],output:number[]=[]
  let comparisons=0,writes=0
  const emit=(tag:string,text:string,active:number[]=[],vars:ArrayFrame['vars']={})=>frames.push({tag,text,values:[...values],active:[...active],done:[...done],output:[...output],comparisons,writes,vars})
  emit('init',operation==='create'?'从空顺序表开始，按下标连续写入元素。':'顺序表元素按下标连续存放。')
  if(operation==='create') input.forEach((value,i)=>{values.push(value);writes++;done.push(i);emit('write',`在下标 ${i} 写入 ${value}。`,[i],{i,value})})
  else if(operation==='search'){
    if(!Number.isInteger(options.target)||Math.abs(options.target!)>99)throw new Error('目标值必须是 -99 至 99 的整数。')
    let result=-1
    for(let i=0;i<values.length;i++){comparisons++;emit('compare',`比较 a[${i}] = ${values[i]} 与目标 ${options.target}。`,[i],{i,target:options.target!});if(values[i]===options.target){result=i;done.push(i);break}}
    emit('done',result<0?'顺序表中不存在目标值。':`在下标 ${result} 找到目标值。`,result<0?[]:[result],{result});return frames
  }else if(operation==='traverse') values.forEach((value,i)=>{output.push(value);done.push(i);emit('visit',`访问 a[${i}] = ${value}。`,[i],{i})})
  else if(operation==='modify'){
    const i=options.position
    if(!Number.isInteger(i)||i!<0||i!>=values.length)throw new Error('修改位置须为有效下标。')
    if(!Number.isInteger(options.value)||Math.abs(options.value!)>99)throw new Error('新值必须是 -99 至 99 的整数。')
    const old=values[i!];emit('select',`选中 a[${i}] = ${old}。`,[i!],{i:i!,old})
    values[i!]=options.value!;writes++;emit('modify',`把 a[${i}] 改为 ${options.value}。`,[i!],{i:i!,value:options.value!})
  }else if(operation==='clear') while(values.length){const i=values.length-1,removed=values.pop()!;writes++;emit('clear',`将有效长度减一，移除末尾 ${removed}。`,[],{i,removed})}
  else throw new Error('未知顺序表操作。')
  emit('done',`操作完成，顺序表当前为 ${values.join(' → ')||'空'}。`,[],{count:values.length})
  return frames
}

const source:Record<'C'|'C++'|'Python',string>={
  C:`init|/* a[] stores n contiguous elements */
write|a[n++] = value;
compare|if (a[i] == target) return i;
visit|visit(a[i]);
select|int old = a[position];
modify|a[position] = value;
clear|--n;
done|return n;`,
  'C++':`init|vector<int> a;
write|a.push_back(value);
compare|if (a[i] == target) return i;
visit|visit(a[i]);
select|int old = a[position];
modify|a[position] = value;
clear|a.pop_back();
done|return a;`,
  Python:`init|a = []
write|a.append(value)
compare|if a[i] == target: return i
visit|visit(a[i])
select|old = a[position]
modify|a[position] = value
clear|a.pop()
done|return a`,
}
export const arrayExtraSnippet=Object.fromEntries(Object.entries(source).map(([language,text])=>[language,text.split('\n').map(row=>{const bar=row.indexOf('|');return {tag:row.slice(0,bar),text:row.slice(bar+1)}})])) as Record<'C'|'C++'|'Python',{tag:string;text:string}[]>
