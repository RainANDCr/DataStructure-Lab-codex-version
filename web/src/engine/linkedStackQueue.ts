import { linkedTrace, type LinkedFrame, type LinkedOperation } from './linkedVariants'

export type LinkedLinearId='linkedStack'|'linkedQueue'

export function linkedLinearTrace(id:LinkedLinearId,input:number[],operation:LinkedOperation,value?:number):LinkedFrame[]{
  if(!['insert','remove'].includes(operation))throw new Error('请选择入栈、出栈或入队、出队。')
  const position=operation==='insert'&&id==='linkedQueue'?input.length:0
  const frames=linkedTrace('linked',input,{operation,position,value})
  return frames.map(frame=>({...frame,vars:{...frame.vars,...(id==='linkedStack'?{top:frame.head??'空'}:{front:frame.head??'空',rear:frame.listNodes.at(-1)?.id??'空'})}}))
}

const source:Record<LinkedLinearId,Record<'C'|'C++'|'Python',string>>={
  linkedStack:{
    C:`init|/* top points to the first node */
allocate|Node *fresh = malloc(sizeof(Node)); fresh->value = value;
setNext|fresh->next = top;
head|top = fresh;
commit|/* push complete */
select|Node *victim = top;
free|top = top->next; free(victim);
done|return top;`,
    'C++':`init|// top points to the first node
allocate|Node* fresh = new Node{value};
setNext|fresh->next = top;
head|top = fresh;
commit|// push complete
select|Node* victim = top;
free|top = top->next; delete victim;
done|return top;`,
    Python:`init|# top points to the first node
allocate|fresh = Node(value)
setNext|fresh.next = top
head|top = fresh
commit|# push complete
select|victim = top
free|top = top.next; del victim
done|return top`,
  },
  linkedQueue:{
    C:`init|/* front and rear point to first and last nodes */
seek|while (rear && rear->next) rear = rear->next;
allocate|Node *fresh = malloc(sizeof(Node)); fresh->value = value;
setNext|fresh->next = NULL;
relinkNext|if (rear) rear->next = fresh;
head|if (!front) front = fresh;
commit|rear = fresh;
select|Node *victim = front;
free|front = front->next; if (!front) rear = NULL; free(victim);
done|return front;`,
    'C++':`init|// front and rear point to first and last nodes
seek|while (rear && rear->next) rear = rear->next;
allocate|Node* fresh = new Node{value};
setNext|fresh->next = nullptr;
relinkNext|if (rear) rear->next = fresh;
head|if (!front) front = fresh;
commit|rear = fresh;
select|Node* victim = front;
free|front = front->next; if (!front) rear = nullptr; delete victim;
done|return front;`,
    Python:`init|# front and rear point to first and last nodes
seek|while rear and rear.next: rear = rear.next
allocate|fresh = Node(value)
setNext|fresh.next = None
relinkNext|if rear: rear.next = fresh
head|if front is None: front = fresh
commit|rear = fresh
select|victim = front
free|front = front.next; rear = rear if front else None
done|return front`,
  },
}
export const linkedLinearSnippet=Object.fromEntries(Object.entries(source).map(([id,languages])=>[id,Object.fromEntries(Object.entries(languages).map(([language,text])=>[language,text.split('\n').map(row=>{const bar=row.indexOf('|');return {tag:row.slice(0,bar),text:row.slice(bar+1)}})]))])) as Record<LinkedLinearId,Record<'C'|'C++'|'Python',{tag:string;text:string}[]>>
