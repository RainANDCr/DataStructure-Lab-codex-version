export type LinearExtraId = 'circularQueue' | 'brackets'
export type LinearExtraFrame = { tag:string; text:string; values:(number|string)[]; active:number[]; done:number[]; output:(number|string)[]; comparisons:number; writes:number; slots?:(number|null)[]; front?:number; rear?:number; stackValues?:string[]; vars:Record<string,number|string> }

export function circularQueueTrace(input:number[], operation:'insert'|'remove', value?:number, offset=4):LinearExtraFrame[] {
  if (input.length > 5 || input.some(item => !Number.isInteger(item) || Math.abs(item)>99)) throw new Error('循环队列最多放 5 个 -99 至 99 的整数。')
  if (!['insert','remove'].includes(operation)) throw new Error('请选择入队或出队。')
  if (operation === 'insert' && (!Number.isInteger(value) || Math.abs(value!)>99)) throw new Error('入队值须为 -99 至 99 的整数。')
  if (operation === 'insert' && input.length === 5) throw new Error('队列已满，需先出队。')
  if (operation === 'remove' && !input.length) throw new Error('队列为空，无法出队。')
  if (!Number.isInteger(offset) || offset<0 || offset>5) throw new Error('初始 front 须为 0 至 5 的槽位下标。')
  const slots:(number|null)[]=Array(6).fill(null), values=[...input], frames:LinearExtraFrame[]=[], done:number[]=[]
  input.forEach((item,i)=>{slots[(offset+i)%6]=item})
  let front=offset,rear=(offset+input.length)%6,writes=0
  const emit=(tag:string,text:string,active:number[]=[],vars:LinearExtraFrame['vars']={})=>frames.push({tag,text,values:[...values],active:[...active],done:[...done],output:[...values],comparisons:0,writes,slots:[...slots],front,rear,vars:{front,rear,count:values.length,...vars}})
  emit('init','容量为 6，保留一个空槽区分队满与队空；rear 指向下一个空位。')
  if(operation==='insert') {
    emit('checkFull','检查 (rear + 1) % 6 是否等于 front。',[rear],{value:value!})
    slots[rear]=value!;values.push(value!);writes++
    emit('write',`在槽位 ${rear} 写入 ${value}。`,[rear],{value:value!})
    rear=(rear+1)%6;emit('advance',`rear 循环移动到 ${rear}。`,[rear])
  } else {
    emit('checkEmpty',`front = ${front}，rear = ${rear}，队列非空。`,[front])
    const removed=slots[front]!;slots[front]=null;values.shift();writes++
    emit('remove',`取出槽位 ${front} 的 ${removed}。`,[front],{removed})
    front=(front+1)%6;emit('advance',`front 循环移动到 ${front}。`,[front])
  }
  emit('done',`操作完成，队列当前为 ${values.join(' → ') || '空'}。`)
  return frames
}

export function bracketsTrace(text:string):LinearExtraFrame[] {
  if (!text || text.length>32 || /[^()\[\]{}]/.test(text)) throw new Error('请输入 1 至 32 个括号，仅支持 () [] {}。')
  const values=[...text], stackValues:string[]=[], stackPositions:number[]=[], done:number[]=[], frames:LinearExtraFrame[]=[]
  let comparisons=0,writes=0
  const emit=(tag:string,message:string,active:number[]=[],vars:LinearExtraFrame['vars']={})=>frames.push({tag,text:message,values:[...values],active:[...active],done:[...done],output:[...stackValues],comparisons,writes,stackValues:[...stackValues],vars:{position:active[0]??-1,...vars}})
  emit('init','从左到右扫描：左括号入栈，右括号必须与栈顶配对。')
  const opening:Record<string,string>={')':'(',']':'[','}':'{'}
  for(let i=0;i<values.length;i++) {
    const char=values[i];emit('scan',`读取下标 ${i} 的 ${char}。`,[i],{char})
    if('([{'.includes(char)) {stackValues.push(char);stackPositions.push(i);writes++;emit('push',`左括号 ${char} 入栈。`,[i],{top:char});continue}
    comparisons++
    const top=stackValues.at(-1)
    emit('compare',`需要 ${opening[char]}，当前栈顶为 ${top??'空'}。`,[i],{expected:opening[char],top:top??'空'})
    if(top!==opening[char]) {emit('fail',`下标 ${i} 的 ${char} 无法匹配，括号不合法。`,[i],{result:0});return frames}
    stackValues.pop();const matched=stackPositions.pop()!;writes++;done.push(matched,i)
    emit('pop',`${values[matched]} 与 ${char} 匹配，弹出栈顶。`,[matched,i])
  }
  emit('done',stackValues.length?'扫描结束但栈中仍有未闭合括号。':'所有括号均已配对。',[],{result:stackValues.length?0:1})
  return frames
}

const source:Record<LinearExtraId,Record<'C'|'C++'|'Python',string>>={
  circularQueue:{
    C:`init|/* capacity=6; one slot is reserved */
checkFull|if ((rear + 1) % 6 == front) return FULL;
write|queue[rear] = value;
advance|rear = (rear + 1) % 6;
checkEmpty|if (front == rear) return EMPTY;
remove|int removed = queue[front];
advance|front = (front + 1) % 6;
done|return OK;`,
    'C++':`init|// capacity=6; one slot is reserved
checkFull|if ((rear + 1) % 6 == front) throw overflow_error("full");
write|queue[rear] = value;
advance|rear = (rear + 1) % 6;
checkEmpty|if (front == rear) throw underflow_error("empty");
remove|int removed = queue[front];
advance|front = (front + 1) % 6;
done|return;`,
    Python:`init|# capacity=6; one slot is reserved
checkFull|if (rear + 1) % 6 == front: raise OverflowError("full")
write|queue[rear] = value
advance|rear = (rear + 1) % 6
checkEmpty|if front == rear: raise IndexError("empty")
remove|removed = queue[front]
advance|front = (front + 1) % 6
done|return queue`,
  },
  brackets:{
    C:`init|int match(const char *s) { char stack[32]; int top = 0;
scan|  for (int i = 0; s[i]; i++) {
push|    if (s[i]=='(' || s[i]=='[' || s[i]=='{') stack[top++] = s[i];
compare|    else if (top == 0 || !pair(stack[top-1], s[i]))
fail|      return 0;
pop|    else --top;
scan|  }
done|  return top == 0;
done|}`,
    'C++':`init|bool match(const string& s) { vector<char> stack;
scan|  for (char ch : s) {
push|    if (ch=='(' || ch=='[' || ch=='{') stack.push_back(ch);
compare|    else if (stack.empty() || !pair(stack.back(), ch))
fail|      return false;
pop|    else stack.pop_back();
scan|  }
done|  return stack.empty();
done|}`,
    Python:`init|def match(text):
init|    stack = []
scan|    for ch in text:
push|        if ch in '([{': stack.append(ch)
compare|        elif not stack or stack[-1] != {')':'(',']':'[','}':'{'}[ch]:
fail|            return False
pop|        else: stack.pop()
done|    return not stack`,
  },
}
export const linearExtraSnippet=Object.fromEntries(Object.entries(source).map(([id,languages])=>[id,Object.fromEntries(Object.entries(languages).map(([language,text])=>[language,text.split('\n').map(row=>{const bar=row.indexOf('|');return {tag:row.slice(0,bar),text:row.slice(bar+1)}})]))])) as Record<LinearExtraId,Record<'C'|'C++'|'Python',{tag:string;text:string}[]>>
