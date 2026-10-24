export type ExpressionFrame={tag:string;text:string;values:string[];active:number[];done:number[];output:number[];comparisons:number;writes:number;operators:string[];operands:number[];vars:Record<string,number|string>}

export function expressionTrace(raw:string):ExpressionFrame[]{
  if(!raw.trim()||raw.length>48||/[^\d\s()+*/-]/.test(raw))throw new Error('请输入最多 48 个字符的整数四则表达式，支持括号。')
  const tokens=raw.match(/\d+|[()+*/-]/g)??[], values=[...raw], frames:ExpressionFrame[]=[], operators:string[]=[], operands:number[]=[], done:number[]=[]
  let comparisons=0,writes=0,position=0,expectNumber=true
  const emit=(tag:string,text:string,active:number[]=[],vars:ExpressionFrame['vars']={})=>frames.push({tag,text,values:[...values],active:[...active],done:[...done],output:[...operands],comparisons,writes,operators:[...operators],operands:[...operands],vars})
  const rank=(op:string)=>op==='+'||op==='-'?1:op==='*'||op==='/'?2:0
  const reduce=()=>{
    const op=operators.pop()!,right=operands.pop()!,left=operands.pop()!
    if(right===undefined||left===undefined)throw new Error('表达式缺少操作数。')
    if(op==='/'&&right===0)throw new Error('除数不能为 0。')
    const result=op==='+'?left+right:op==='-'?left-right:op==='*'?left*right:left/right
    if(!Number.isFinite(result)||Math.abs(result)>1e9)throw new Error('计算结果超出演示范围。')
    operands.push(result);writes++
    emit('reduce',`计算 ${left} ${op} ${right} = ${result}，结果入数值栈。`,[],{left,right,op,result})
  }
  emit('init','使用两个栈：运算符栈管理优先级，数值栈保存操作数。')
  for(const token of tokens){
    const at=raw.indexOf(token,position);position=at+token.length
    emit('scan',`读取 ${token}。`,[at],{token})
    if(/^\d+$/.test(token)){
      if(!expectNumber)throw new Error('相邻数字之间缺少运算符。')
      const value=Number(token);if(!Number.isSafeInteger(value)||value>1e6)throw new Error('单个整数不能超过 1000000。')
      operands.push(value);writes++;expectNumber=false;done.push(...Array.from({length:token.length},(_,i)=>at+i));emit('number',`${value} 入数值栈。`,[at],{value});continue
    }
    if(token==='('){if(!expectNumber)throw new Error('左括号前缺少运算符。');operators.push(token);writes++;emit('push',`左括号入运算符栈。`,[at]);continue}
    if(token===')'){
      if(expectNumber)throw new Error('右括号前缺少操作数。')
      while(operators.length&&operators.at(-1)!=='(')reduce()
      if(operators.pop()!=='(')throw new Error('括号不匹配。')
      emit('close','弹出左括号，括号内计算完成。',[at]);expectNumber=false;continue
    }
    if(expectNumber)throw new Error('运算符前缺少操作数；本例暂不支持一元负号。')
    comparisons++
    emit('compare',`比较 ${token} 与栈顶运算符的优先级。`,[at],{operator:token})
    while(operators.length&&operators.at(-1)!=='('&&rank(operators.at(-1)!)>=rank(token))reduce()
    operators.push(token);writes++;expectNumber=true;emit('push',`${token} 入运算符栈。`,[at],{operator:token})
  }
  if(expectNumber)throw new Error('表达式不能以运算符结束。')
  while(operators.length){if(operators.at(-1)==='(')throw new Error('括号不匹配。');reduce()}
  if(operands.length!==1)throw new Error('表达式格式无效。')
  emit('done',`表达式结果为 ${operands[0]}。`,[],{result:operands[0]})
  return frames
}

const source={
  C:`init|/* two stacks: values[] and ops[] */
scan|for each token in expression:
number|  if number: push(values, token);
push|  else if '(': push(ops, '(');
compare|  else while precedence(top(ops)) >= precedence(token):
reduce|    b=pop(values); a=pop(values); push(values, apply(pop(ops),a,b));
push|  push(ops, token);
close|  if ')': reduce until '(' then pop(ops);
done|reduce remaining ops; return pop(values);`,
  'C++':`init|stack<double> values; stack<char> ops;
scan|for (Token token : tokenize(expression)) {
number|  if (token.isNumber()) values.push(token.number());
push|  else if (token.isLeftParen()) ops.push('(');
compare|  else while (!ops.empty() && precedence(ops.top()) >= precedence(token))
reduce|    reduceTop(values, ops);
push|  ops.push(token.op());
close|  if (token.isRightParen()) reduceUntilLeftParen(values, ops);
scan|}
done|while (!ops.empty()) reduceTop(values, ops); return values.top();`,
  Python:`init|values, ops = [], []
scan|for token in tokenize(expression):
number|    if token.isdigit(): values.append(int(token))
push|    elif token == '(': ops.append(token)
compare|    elif token in '+-*/' and precedence(ops[-1]) >= precedence(token):
reduce|        b, a = values.pop(), values.pop(); values.append(apply(ops.pop(), a, b))
push|    else: ops.append(token)
close|    if token == ')': reduce_until_left_paren(values, ops)
done|while ops: reduce_top(values, ops)
done|return values[-1]`,
}
export const expressionSnippet=Object.fromEntries(Object.entries(source).map(([language,text])=>[language,text.split('\n').map(row=>{const bar=row.indexOf('|');return {tag:row.slice(0,bar),text:row.slice(bar+1)}})])) as Record<'C'|'C++'|'Python',{tag:string;text:string}[]>
