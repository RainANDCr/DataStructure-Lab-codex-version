export type StringOperation='length'|'concat'|'substring'|'insert'|'remove'|'compare'
export type StringFrame={tag:string;text:string;values:string[];active:number[];done:number[];output:string[];comparisons:number;writes:number;vars:Record<string,number|string>}

export function stringOpsTrace(raw:string,operation:StringOperation,other:string,position?:number,count?:number):StringFrame[]{
  if(!/^[A-Za-z0-9]{0,16}$/.test(raw))throw new Error('主串最多 16 个英文字母或数字。')
  if(!(['length','concat','substring','insert','remove','compare'] as string[]).includes(operation))throw new Error('请选择有效的串操作。')
  if(['concat','insert','compare'].includes(operation)&&(!/^[A-Za-z0-9]{1,16}$/.test(other)))throw new Error('第二个串需为 1 至 16 个英文字母或数字。')
  if(['insert','substring','remove'].includes(operation)&&(!Number.isInteger(position)||position!<0||position!>raw.length-(operation==='insert'?0:1)))throw new Error('起始位置超出主串下标范围。')
  if(['substring','remove'].includes(operation)&&(!Number.isInteger(count)||count!<1||position!+count!>raw.length))throw new Error('长度须为正整数，且不能越过主串末尾。')
  if(['concat','insert'].includes(operation)&&raw.length+other.length>24)throw new Error('结果最多 24 个字符。')
  const values=[...raw],output:string[]=[],done:number[]=[],frames:StringFrame[]=[]
  let comparisons=0,writes=0
  const emit=(tag:string,text:string,active:number[]=[],vars:StringFrame['vars']={})=>frames.push({tag,text,values:[...values],active:[...active],done:[...done],output:[...output],comparisons,writes,vars})
  emit('init',`准备执行${{length:'求长度',concat:'连接',substring:'截取',insert:'插入',remove:'删除',compare:'比较'}[operation]}。`,[],{n:values.length})
  if(operation==='length') values.forEach((char,i)=>{done.push(i);emit('count',`读过下标 ${i} 的 ${char}，当前长度 ${i+1}。`,[i],{length:i+1})})
  else if(operation==='concat') for(const char of other){values.push(char);writes++;done.push(values.length-1);emit('append',`把 ${char} 追加到末尾。`,[values.length-1],{length:values.length})}
  else if(operation==='substring') for(let i=position!;i<position!+count!;i++){output.push(values[i]);done.push(i);emit('copy',`复制主串[${i}] = ${values[i]} 到结果串。`,[i],{i})}
  else if(operation==='insert'){
    for(let i=0;i<other.length;i++){values.splice(position!+i,0,other[i]);writes++;emit('insert',`在下标 ${position!+i} 插入 ${other[i]}。`,[position!+i],{i:position!+i})}
  }else if(operation==='remove')for(let i=0;i<count!;i++){const removed=values.splice(position!,1)[0];writes++;emit('remove',`删除下标 ${position} 的 ${removed}，后续字符左移。`,[position!],{position:position!,removed})}
  else if(operation==='compare'){
    const limit=Math.max(values.length,other.length);let result=0
    for(let i=0;i<limit;i++){
      const a=values[i],b=other[i];comparisons++
      emit('compare',`比较下标 ${i}：${a??'结束'} 与 ${b??'结束'}。`,i<values.length?[i]:[],{i,left:a??'结束',right:b??'结束'})
      if(a===b)continue
      result=a===undefined?-1:b===undefined?1:a<b?-1:1;break
    }
    emit('done',result===0?'两个串相等。':result<0?'主串按字典序较小。':'主串按字典序较大。',[],{result});return frames
  }
  emit('done',operation==='substring'?`截取结果：${output.join('')}。`:operation==='length'?`串长为 ${values.length}。`:`操作结果：${values.join('')}。`,[],{result:operation==='length'?values.length:operation==='substring'?output.join(''):values.join('')})
  return frames
}

const source:Record<StringOperation,Record<'C'|'C++'|'Python',string>>={
  length:{C:`init|int length(const char *s) { int n=0;
count|  while (s[n]) ++n;
done|  return n;
done|}`, 'C++':`init|size_t length(const string& s) { size_t n=0;
count|  for (char ch : s) ++n;
done|  return n;
done|}`,Python:`init|def length(s):
count|    n = 0
count|    for ch in s: n += 1
done|    return n`},
  concat:{C:`init|/* destination has enough room */
append|while (*other) destination[n++] = *other++;
done|destination[n] = '\0';`, 'C++':`init|string result = first;
append|for (char ch : other) result.push_back(ch);
done|return result;`,Python:`init|result = list(first)
append|for ch in other: result.append(ch)
done|return ''.join(result)`},
  substring:{C:`init|int out=0;
copy|for (int i=0;i<count;i++) result[out++] = source[position+i];
done|result[out]='\0';`, 'C++':`init|string result;
copy|for (int i=0;i<count;i++) result.push_back(source[position+i]);
done|return result;`,Python:`init|result = []
copy|for i in range(position, position+count): result.append(source[i])
done|return ''.join(result)`},
  insert:{C:`init|/* shift suffix, then write inserted characters */
insert|for (int i=0;i<m;i++) insert_at(source, position+i, other[i]);
done|return source;`, 'C++':`init|string result = source;
insert|for (int i=0;i<other.size();i++) result.insert(position+i,1,other[i]);
done|return result;`,Python:`init|result = list(source)
insert|for i, ch in enumerate(other): result.insert(position+i,ch)
done|return ''.join(result)`},
  remove:{C:`init|/* remove count characters from position */
remove|for (int i=position; source[i+count-1]; i++) source[i]=source[i+count];
done|return source;`, 'C++':`init|string result = source;
remove|result.erase(position,count);
done|return result;`,Python:`init|result = list(source)
remove|for _ in range(count): result.pop(position)
done|return ''.join(result)`},
  compare:{C:`init|int compare(const char *a,const char *b) {
compare|  for (int i=0;a[i]||b[i];i++) if (a[i]!=b[i]) return a[i]<b[i]?-1:1;
done|  return 0;
done|}`, 'C++':`init|int compare(const string& a,const string& b) {
compare|  for (size_t i=0;i<max(a.size(),b.size());i++) {
compare|    if (i==a.size()) return -1;
compare|    if (i==b.size()) return 1;
compare|    if (a[i]!=b[i]) return a[i]<b[i]?-1:1;
compare|  }
done|  return 0;
done|}`,Python:`init|def compare(a,b):
compare|    for x,y in zip(a,b):
compare|        if x != y: return -1 if x < y else 1
done|    return (len(a)>len(b))-(len(a)<len(b))`},
}
export const stringOpsSnippet=Object.fromEntries(Object.entries(source).map(([op,languages])=>[op,Object.fromEntries(Object.entries(languages).map(([language,text])=>[language,text.split('\n').map(row=>{const bar=row.indexOf('|');return {tag:row.slice(0,bar),text:row.slice(bar+1)}})]))])) as Record<StringOperation,Record<'C'|'C++'|'Python',{tag:string;text:string}[]>>
