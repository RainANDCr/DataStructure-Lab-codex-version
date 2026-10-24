import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './ui/button'
import { complexityCounts, growth } from '../engine/complexity'
import { StudyNotes } from './StudyNotes'
import './ComplexityLab.css'

export function ComplexityLab() {
  const [n, setN] = useState(16)
  const counts = complexityCounts(n)
  const x = (value: number) => 42 + (value - 1) / 127 * 606
  const y = (value: number) => 244 - Math.log10(value + 1) / Math.log10(128 * 128 + 1) * 210
  return <div className="complexity-lab">
    <section className="lab-card complexity-chart-card">
      <div className="lab-card-head"><div><h2>增长曲线</h2><p>拖动输入规模，观察五类操作次数如何拉开差距</p></div><span className="lab-badge">n = {n}</span></div>
      <div className="complexity-control"><label htmlFor="complexity-size">输入规模 n</label><Button variant="outline" aria-label="规模减一" disabled={n === 1} onClick={() => setN(n - 1)}><ChevronLeft size={16}/></Button><input id="complexity-size" type="range" min="1" max="128" value={n} onChange={event => setN(Number(event.target.value))}/><Button variant="outline" aria-label="规模加一" disabled={n === 128} onClick={() => setN(n + 1)}><ChevronRight size={16}/></Button><strong>{n}</strong></div>
      <div className="complexity-plot"><svg viewBox="0 0 680 275" role="img" aria-label={`输入规模 ${n} 时的时间复杂度增长曲线`}>
        {[1,16,32,64,96,128].map(value => <g key={value}><line x1={x(value)} y1="34" x2={x(value)} y2="244" stroke="currentColor" opacity=".1"/><text x={x(value)} y="263" textAnchor="middle" className="axis-label">{value}</text></g>)}
        {[1,10,100,1000,10000].map(value => <g key={value}><line x1="42" y1={y(value)} x2="648" y2={y(value)} stroke="currentColor" opacity=".1"/><text x="36" y={y(value) + 4} textAnchor="end" className="axis-label">{value}</text></g>)}
        {growth.map(item => <g key={item.name}><polyline points={Array.from({length:128},(_,i) => `${x(i + 1)},${y(item.count(i + 1))}`).join(' ')} fill="none" stroke={item.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx={x(n)} cy={y(item.count(n))} r="5" fill={item.color} stroke="white" strokeWidth="2"/></g>)}
        <line x1={x(n)} y1="34" x2={x(n)} y2="244" stroke="#657b8d" strokeDasharray="4 4"/>
      </svg></div>
      <p className="complexity-note">纵轴使用对数刻度，让不同量级能同时显示。次数是简化模型，用于比较增长趋势，不代表某个程序的实测值。</p>
    </section>
    <section className="lab-card complexity-table-card"><div className="lab-card-head"><div><h2>当前规模：{n} 个元素</h2><p>对应的示意操作次数</p></div></div><div className="complexity-rows">{growth.map((item,i) => <div key={item.name}><span className="complexity-swatch" style={{background:item.color}}/><div><strong>{item.name}</strong><small>{item.note}</small></div><b>{counts[i].toLocaleString()}</b></div>)}</div></section>
    <section className="knowledge-card complexity-knowledge"><div><h2>怎样看时间复杂度</h2><p>比较输入规模 n 变大时，操作次数增长的速度。常数和低阶项通常不改变大 O 分类。</p></div><div><h2>读图提示</h2><p>试着把 n 从 16 调到 128：O(n²) 增长最快；O(log n) 增长很慢。同一规模下的绝对值只用于教学比较。</p></div></section><StudyNotes id="complexity"/>
  </div>
}
