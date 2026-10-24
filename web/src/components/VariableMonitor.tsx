import { useState } from 'react'
import type { ExecutionStep } from '../engine/types'
import './VariableMonitor.css'

type VariableValue = string | number | boolean

function direction(current: VariableValue, previous: VariableValue | undefined) {
  if (previous === undefined) return '新增'
  if (Object.is(current, previous)) return '未变'
  if (typeof current === 'number' && typeof previous === 'number') return current > previous ? '↑ 增加' : '↓ 减少'
  return '已更新'
}

export function VariableMonitor({ step, previous }: { step: ExecutionStep<unknown>; previous?: ExecutionStep<unknown> }) {
  const [expanded, setExpanded] = useState(true)
  return <details className="variable-monitor" open={expanded} onToggle={event => setExpanded(event.currentTarget.open)}>
    <summary>变量监视器 <small>当前 / 上一步</small></summary>
    <div className="variable-monitor-list">{Object.entries(step.variables).length ? Object.entries(step.variables).map(([name, value]) => {
      const before = previous?.variables[name]
      const changed = !Object.is(value, before)
      return <div className={`variable-monitor-row ${changed ? 'changed' : ''}`} key={`${step.stepId}-${name}`}>
        <span className="variable-name">{name}<small>{typeof value}</small></span>
        <span className="variable-before">{before === undefined ? '—' : String(before)}</span>
        <strong>{String(value)}</strong>
        <span className="variable-direction">{direction(value, before)}</span>
        {changed && <span className="sr-only">本步骤修改</span>}
      </div>
    }) : <p>当前步骤没有记录变量。</p>}</div>
  </details>
}
