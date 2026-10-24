import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trace, parseValues } from '../algorithms.mjs';
import { lessons, snippet } from '../lessons.mjs';
const last = (id, a, options) => trace(id,a,options).at(-1);
test('input validation accepts only bounded integer lists', () => {
  assert.deepEqual(parseValues('3， -2, 3 0'),[3,-2,3,0]);
  assert.deepEqual(parseValues(''),[]);
  for (const s of ['1,foo','1.2','1e2','100',Array(17).fill(1).join(',')]) assert.throws(()=>parseValues(s));
});
test('sorts preserve input and correctly order edge cases', () => {
  for (const id of ['bubble','quick']) for(const a of [[],[1],[3,2,1],[0,-4,3,3,-4],[1,2,3]]) {
    const before=[...a], steps=trace(id,a);
    assert.deepEqual(steps.at(-1).values,[...a].sort((a,b)=>a-b));
    assert.deepEqual(a,before);
    assert.deepEqual(steps[0].values,before);
  }
});
test('binary search finds index or returns -1 and rejects unsorted data',()=>{
  assert.equal(last('binary',[1,3,5],{target:3}).vars.result,1);
  assert.equal(last('binary',[1,3,5],{target:2}).vars.result,-1);
  assert.equal(last('binary',[],{target:2}).vars.result,-1);
  assert.throws(()=>trace('binary',[3,1],{target:1}));
});
test('linear and linked lists insert/delete at boundaries',()=>{
  for(const id of ['array','linked']) {
    assert.deepEqual(last(id,[1,2],{operation:'insert',position:2,value:9}).values,[1,2,9]);
    assert.deepEqual(last(id,[],{operation:'insert',position:0,value:9}).values,[9]);
    assert.deepEqual(last(id,[1,2],{operation:'remove',position:0}).values,[2]);
    assert.throws(()=>trace(id,[],{operation:'remove',position:0}));
    assert.throws(()=>trace(id,[1],{operation:'insert',position:3,value:9}));
  }
});
test('stack is LIFO and queue is FIFO, empty removal fails',()=>{
  assert.deepEqual(last('stack',[1,2,3],{operation:'remove'}).values,[1,2]);
  assert.deepEqual(last('queue',[1,2,3],{operation:'remove'}).values,[2,3]);
  for(const id of ['stack','queue']) {
    assert.deepEqual(last(id,[],{operation:'insert',value:7}).values,[7]);
    assert.throws(()=>trace(id,[],{operation:'remove'}));
  }
});
test('complete binary tree supports four traversal orders',()=>{
  for(const [order,expected] of [['pre',[1,2,4,5,3]],['in',[4,2,5,1,3]],['post',[4,5,2,3,1]],['level',[1,2,3,4,5]]])
    assert.deepEqual(last('tree',[1,2,3,4,5],{order}).output,expected);
  assert.deepEqual(last('tree',[],{order:'in'}).output,[]);
  assert.deepEqual(last('tree',[],{order:'level'}).output,[]);
});
test('every animation step has a corresponding line in all three languages',()=>{
  for(const [id,lesson] of Object.entries(lessons)) for(const operation of ['insert','remove']) for(const order of (id==='graph'?['bfs','dfs']:['pre','in','post','level'])) {
    const options={operation,order,position:2,value:7,target:42,start:0,edges:'0-1, 0-2',pattern:'BA'};
    const steps=trace(id,lesson.default,options);
    for(const lang of ['C','C++','Python']) {
      const tags=new Set(snippet(id,lang,options).map(row=>row.tag));
      for(const step of steps) assert.ok(tags.has(step.tag),`${id} ${lang} missing ${step.tag}`);
    }
  }
});
test('sorting properties hold for generated arrays and snapshots are independent',()=>{
  let seed=123456;
  for(let k=0;k<80;k++) {
    const a=Array.from({length:k%17},()=>{seed=(seed*1664525+1013904223)>>>0;return seed%21-10;});
    for(const id of ['bubble','quick']){
      const steps=trace(id,a),final=steps.at(-1);
      assert.deepEqual(final.values,[...a].sort((a,b)=>a-b));
      if(a.length){final.values[0]=999;assert.deepEqual(steps[0].values,a);}
    }
  }
});
test('capacity and invalid operation boundaries are rejected',()=>{
  for(const id of ['array','linked','stack','queue']) assert.throws(()=>trace(id,Array(16).fill(1),{operation:'insert',position:0,value:3}));
  assert.throws(()=>trace('tree',Array(16).fill(1)));
  assert.throws(()=>trace('stack',[1],{operation:'unknown'}));
  assert.throws(()=>trace('array',[1],{operation:'insert',position:0,value:NaN}));
  assert.throws(()=>trace('binary',[1],{target:NaN}));
});
test('graph BFS and DFS traverse edges in distinct orders and cover components',()=>{
  const edges='0-1, 0-2, 1-3, 2-4, 3-4';
  assert.deepEqual(last('graph',[0,1,2,3,4],{edges,order:'bfs',start:0}).output,[0,1,2,3,4]);
  assert.deepEqual(last('graph',[0,1,2,3,4],{edges,order:'dfs',start:0}).output,[0,1,3,4,2]);
  assert.deepEqual(last('graph',[0,1,2,3],{edges:'0-1, 2-3',order:'bfs',start:2}).output,[2,3,0,1]);
  for(const bad of ['0-9','0-0','0-x','0-1,0-1']) assert.throws(()=>trace('graph',[0,1],{edges:bad,order:'bfs',start:0}));
});
test('naive string matching finds the first occurrence and handles overlap and misses',()=>{
  assert.equal(last('string',[...'ABABAC'],{pattern:'ABAC'}).vars.result,2);
  assert.equal(last('string',[...'AAAAA'],{pattern:'AAA'}).vars.result,0);
  assert.equal(last('string',[...'ABAB'],{pattern:'AC'}).vars.result,-1);
  assert.equal(last('string',[],{pattern:'A'}).vars.result,-1);
  for(const pattern of ['', '中文', 'ABCDEFGHI']) assert.throws(()=>trace('string',[...'ABC'],{pattern}));
  assert.throws(()=>trace('string',[...'A B'],{pattern:'B'}));
});
