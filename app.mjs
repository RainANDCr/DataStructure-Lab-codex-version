import {parseValues,trace} from './algorithms.mjs';
import {lessons,snippet} from './lessons.mjs';
const $=id=>document.getElementById(id);
let selected='bubble',language='C++',steps=[],index=0,timer=null,dirty=false,runOptions={};
const chapters=[['概论',[],'数据、逻辑结构与存储结构；抽象数据类型；算法与复杂度。'],['线性表',['array','linked']],['栈和队列',['stack','queue']],['串',['string']],['数组和广义表',[],'多维数组、特殊矩阵与稀疏矩阵的压缩存储、广义表。'],['树和二叉树',['tree']],['图',['graph']],['查找',['binary']],['排序',['bubble','quick']]];
function dialog(title,body){$('dialog-title').textContent=title;$('dialog-body').textContent=body;$('info-dialog').showModal();}
$('close-dialog').onclick=$('dialog-ok').onclick=()=>$('info-dialog').close();
$('info-dialog').addEventListener('click',e=>{if(e.target===$('info-dialog'))$('info-dialog').close();});
$('help').onclick=()=>dialog('把算法拆成看得懂的每一步','1. 从左侧选择主题，输入数据并点击「应用数据」。\n2. 用播放按钮观察过程，或用左右方向键逐步前进、后退。\n3. 切换 C、C++、Python，代码高亮始终对应当前步骤。\n4. 下方变量和文字会解释当前变化；拖动进度条可直接回看。\n\n快捷键：空格播放/暂停，← 上一步，→ 下一步，/ 查找算法。\n三种语言展示核心算法片段，不执行任意代码。树演示使用层序数组构建完全二叉树。');
function navigation(){
  const q=$('search').value.trim().toLowerCase();$('chapters').replaceChildren();let count=0;
  chapters.forEach(([name,ids,plan],i)=>{
    const matches=ids.filter(id=>(lessons[id].title+' '+lessons[id].english+' '+name).toLowerCase().includes(q));
    if(q&&!matches.length&&!name.includes(q))return;
    count++;
    const section=document.createElement('div');section.className='chapter';
    const heading=document.createElement('div');heading.className='chapter-heading';
    heading.innerHTML=`<span class="chapter-number">${String(i+1).padStart(2,'0')}</span><span>${name}</span>`;
    if(!ids.length){const b=document.createElement('button');b.className='planned';b.textContent='规划中';b.setAttribute('aria-label',`${name}：查看规划内容`);b.onclick=()=>dialog(name+' · 后续章节',plan+'\n\n此章节尚未制作交互演示。首版已开放左侧列出的八个主题。');heading.append(b);}
    section.append(heading);
    matches.forEach(id=>{const b=document.createElement('button');b.className='lesson-link'+(id===selected?' selected':'');b.textContent=lessons[id].title;b.setAttribute('aria-current',id===selected?'page':'false');b.onclick=()=>selectLesson(id);section.append(b);});
    $('chapters').append(section);
  });
  if(!count)$('chapters').textContent='没有匹配的算法，试试「排序」或「树」。';
}
function options(){return {operation:$('operation').value,position:$('position').value===''?NaN:Number($('position').value),value:$('value').value===''?NaN:Number($('value').value),target:$('target').value===''?NaN:Number($('target').value),order:selected==='graph'?$('graph-order').value:$('order').value,start:$('start').value===''?NaN:Number($('start').value),edges:$('edges').value,pattern:$('pattern').value};}
function showOptions(){
  const linear=['array','linked','stack','queue'].includes(selected),insert=$('operation').value==='insert';
  for(const [name,visible] of Object.entries({operation:linear,position:['array','linked'].includes(selected),value:linear&&insert,target:selected==='binary',order:selected==='tree','graph-order':selected==='graph',start:selected==='graph',edges:selected==='graph',pattern:selected==='string'})) { $(name+'-wrap').hidden=!visible;$(name).disabled=!visible; }
  $('operation').options[0].textContent=selected==='stack'?'入栈':selected==='queue'?'入队':'插入';
  $('operation').options[1].textContent=selected==='stack'?'出栈':selected==='queue'?'出队':'删除';
}
function pause(){clearTimeout(timer);timer=null;$('play').innerHTML='▶ <span>播放</span>';}
function generate(){
  pause();
  try{const opts=options(),data=selected==='string'?[...$('values').value]:parseValues($('values').value),next=trace(selected,data,opts);runOptions=opts;steps=next;index=0;dirty=false;$('error').textContent='';render();}
  catch(e){dirty=true;$('error').textContent=e.message;syncControls();}
}
function selectLesson(id){
  pause();selected=id;const l=lessons[id];
  $('title').innerHTML=l.title+`<span>${l.english}</span>`;
  $('chapter-label').textContent=l.chapter;$('breadcrumb').textContent=l.title;$('summary').textContent=l.summary;
  for(const field of ['principle','tip','time','space'])$(field).textContent=l[field];
  $('values').value=id==='string'?l.default.join(''):l.default.join(', ');$('operation').value='insert';$('position').value=2;$('edges').value=id==='graph'?'0-1, 0-2, 1-3, 1-4, 2-5':'';$('graph-order').value='bfs';$('start').value=0;$('pattern').value='ABAC';
  $('data-label').textContent=id==='string'?'主串':'输入数据';
  $('input-note').textContent=id==='tree'?'按层序输入，最多 15 个节点':id==='graph'?'不重复的节点值，最多 10 个':id==='string'?'英文字母或数字，最多 16 个字符':id==='binary'?'升序整数，最多 16 个':'逗号或空格分隔，最多 16 个整数';
  $('kind-badge').textContent={bars:'排序实验',cells:'数组视图',linked:'指针视图',stack:'后进先出',queue:'先进先出',tree:'递归实验',graph:'图遍历实验',string:'字符匹配实验'}[l.kind];
  showOptions();navigation();generate();
}
function color(s,i){return s.active.includes(i)?'#de9650':s.done.includes(i)?'#159889':'#aabed4';}
function visualize(s){
  const l=lessons[selected];let html='';
  if(!s.values.length)html=selected==='string'?'<div class="empty-state"><span>∅</span><p>主串为空</p><small>输入字符后，可以观察逐字符匹配。</small></div>':'<div class="empty-state"><span>∅</span><p>当前结构为空</p><small>可以插入元素，或查看空输入的执行结果。</small></div>';
  else if(l.kind==='graph'){
    const positions=s.values.map((_,i)=>{const angle=-Math.PI/2+i*2*Math.PI/s.values.length;return {x:340+220*Math.cos(angle),y:150+105*Math.sin(angle)};});
    html='<svg viewBox="0 0 680 300" role="img" aria-label="无向图">';
    for(const [a,b] of s.edges){const p=positions[a],q=positions[b],active=s.edge?.includes(a)&&s.edge?.includes(b);html+=`<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="${active?'#de9650':'#b9cad9'}" stroke-width="${active?4:2}"/>`;}
    s.values.forEach((v,i)=>{const p=positions[i];html+=`<circle cx="${p.x}" cy="${p.y}" r="23" fill="${color(s,i)}"/><text x="${p.x}" y="${p.y+5}" class="node-value">${v}</text><text x="${p.x}" y="${p.y+38}" class="svg-index">${i}</text>`;});html+='</svg>';
  }else if(l.kind==='bars'){
    const min=Math.min(0,...s.values),max=Math.max(1,...s.values),scale=190/(max-min),zero=235+min*scale,width=600/s.values.length;
    html=`<svg viewBox="0 0 680 300" role="img" aria-label="数组柱状图"><line x1="30" x2="650" y1="${zero}" y2="${zero}" stroke="#d5dfea"/>`;
    s.values.forEach((v,i)=>{const h=Math.max(3,Math.abs(v)*scale),x=40+i*width,y=v>=0?zero-h:zero;html+=`<g><rect x="${x+width*.14}" y="${y}" width="${width*.72}" height="${h}" rx="5" fill="${color(s,i)}"/><text x="${x+width/2}" y="${v>=0?y-10:y+h+17}" class="bar-value">${v}</text><text x="${x+width/2}" y="280" class="svg-index">${i}</text></g>`;});html+='</svg>';
  }else if(l.kind==='tree'){
    const position=i=>{const level=Math.floor(Math.log2(i+1)),rank=i-(2**level-1);return {x:680*(rank+.5)/2**level,y:35+level*70};};
    html='<svg viewBox="0 0 680 300" role="img" aria-label="完全二叉树">';
    s.values.forEach((_,i)=>{if(i){const a=position(Math.floor((i-1)/2)),b=position(i);html+=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#c1cedb" stroke-width="2"/>`;}});
    s.values.forEach((v,i)=>{const p=position(i);html+=`<circle cx="${p.x}" cy="${p.y}" r="21" fill="${color(s,i)}"/><text x="${p.x}" y="${p.y+5}" class="node-value">${v}</text>`;});html+='</svg>';
  }else{
    html=`<div class="nodes ${l.kind}">`;
    s.values.forEach((v,i)=>{const faded=s.range&&(i<s.range[0]||i>s.range[1]),aligned=l.kind==='string'&&Number.isInteger(s.vars.i)&&i>=s.vars.i&&i<s.vars.i+runOptions.pattern.length;html+=`<div class="node-group${faded?' excluded':''}"><span class="node-pointer">${l.kind==='stack'&&i===s.values.length-1?'top ↓':l.kind==='queue'&&i===0?'front ↓':l.kind==='queue'&&i===s.values.length-1?'rear − 1 ↓':s.active.includes(i)?'当前 ↓':''}</span><div class="node" style="--node-color:${color(s,i)}">${v}${l.kind==='linked'?'<span class="next-field">•</span>':''}</div><span class="node-index">${i}</span>${aligned?`<span class="pattern-char">${runOptions.pattern[i-s.vars.i]}</span>`:''}${l.kind==='linked'?'<span class="link-arrow">→</span>':''}</div>`;});
    if(l.kind==='linked')html+='<span class="null-node">NULL</span>';html+='</div>';
  }
  $('canvas').innerHTML=html;
  $('output').textContent=['tree','graph'].includes(selected)?'访问结果：'+(s.output.join(' → ')||'等待访问节点'):selected==='string'?`模式串：${runOptions.pattern}`:'';
  $('canvas-label').textContent=selected==='tree'?'按层序建树 · 下标从 0 开始':selected==='graph'?'无向图 · 邻居按下标升序':l.kind==='stack'?'栈底在下，栈顶在上':'下标从 0 开始';
  $('metrics').textContent=['bubble','quick','binary','string'].includes(selected)?`比较 ${s.comparisons} 次${['binary','string'].includes(selected)?'':` / 写入 ${s.writes} 次`}`:selected==='graph'?`${s.values.length} 个节点 / ${s.edges.length} 条边`:`${s.values.length} 个${selected==='tree'||selected==='linked'?'节点':'元素'}`;
}
function renderCode(s){
  const code=snippet(selected,language,runOptions);$('code').replaceChildren();
  code.forEach((line,i)=>{const row=document.createElement('div');row.className='code-line'+(line.tag===s.tag?' highlighted':'');const n=document.createElement('span');n.className='line-number';n.textContent=String(i+1).padStart(2,'0');const text=document.createElement('code');text.textContent=line.text;row.append(n,text);$('code').append(row);});
  const active=$('code').querySelector('.highlighted');
  if(active && (active.offsetTop<$('code').scrollTop || active.offsetTop+active.offsetHeight>$('code').scrollTop+$('code').clientHeight)) $('code').scrollTop=Math.max(0,active.offsetTop-60);
  $('filename').textContent=selected+({C:'.c','C++':'.cpp',Python:'.py'}[language]);
  document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.lang===language)));
}
function syncControls(){
  $('prev').disabled=dirty||index<=0;$('next').disabled=dirty||index>=steps.length-1;$('reset').disabled=dirty||index===0;
  $('play').disabled=dirty||steps.length<2;$('timeline').disabled=dirty;
}
function render(){
  const s=steps[index];visualize(s);renderCode(s);
  $('timeline').max=Math.max(0,steps.length-1);$('timeline').value=index;$('timeline').style.setProperty('--progress',`${index/Math.max(1,steps.length-1)*100}%`);
  $('step-count').textContent=`${index} / ${steps.length-1} 步`;$('step-title').textContent=index===0?'准备开始':index===steps.length-1?'演示完成':`第 ${index} 步`;
  $('explanation').textContent=s.text;$('variables').replaceChildren();
  Object.entries(s.vars).forEach(([key,value])=>{const group=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key;dd.textContent=value;group.append(dt,dd);$('variables').append(group);});syncControls();
}
function move(delta){if(dirty)return;pause();index=Math.max(0,Math.min(steps.length-1,index+delta));render();}
function play(){
  if(dirty)return;if(timer){pause();return;}if(index===steps.length-1)index=0;
  $('play').innerHTML='Ⅱ <span>暂停</span>';render();
  function tick(){if(index<steps.length-1){index++;render();}if(index===steps.length-1)pause();else timer=setTimeout(tick,Number($('speed').value));}
  timer=setTimeout(tick,Number($('speed').value));
}
$('data-form').onsubmit=e=>{e.preventDefault();generate();};
$('data-form').addEventListener('input',()=>{pause();dirty=true;showOptions();$('error').textContent='参数已更改，点击「应用数据」生成新的步骤。';syncControls();});
$('random').onclick=()=>{if(selected==='string'){$('values').value=['ABABAC','BANANA','AABAAA','ABCABC'][Math.floor(Math.random()*4)];$('pattern').value=$('values').value.slice(2,5);}else{let a=Array.from({length:selected==='tree'?7:selected==='graph'?6:8},()=>Math.floor(Math.random()*90)+1);if(selected==='binary')a.sort((a,b)=>a-b);if(selected==='graph'){const used=new Set();while(used.size<6)used.add(Math.floor(Math.random()*90)+1);a=[...used];}$('values').value=a.join(', ');}generate();};
$('search').oninput=navigation;$('play').onclick=play;$('prev').onclick=()=>move(-1);$('next').onclick=()=>move(1);$('reset').onclick=()=>move(-index);
$('timeline').oninput=()=>{pause();index=Number($('timeline').value);render();};
document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{language=b.dataset.lang;renderCode(steps[index]);});
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText(snippet(selected,language,runOptions).map(x=>x.text).join('\n'));$('copy').textContent='已复制';setTimeout(()=>$('copy').textContent='复制代码',1500);}catch{dialog('复制代码','浏览器暂不允许访问剪贴板。可以直接选中代码区域的文本并复制。');}};
document.addEventListener('keydown',e=>{if($('info-dialog').open||['INPUT','SELECT','TEXTAREA','BUTTON'].includes(document.activeElement.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;if(e.key==='/'){e.preventDefault();$('search').focus();}if(e.key===' '){e.preventDefault();play();}if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}if(e.key==='ArrowRight'){e.preventDefault();move(1);}});
selectLesson(selected);
