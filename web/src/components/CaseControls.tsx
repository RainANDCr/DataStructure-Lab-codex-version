import { useState } from 'react'
import { parseLabCase, readLabCases, saveLabCase, type LabCase } from '../engine/labCases'
import { Button } from './ui/button'
import './AdvancedViz.css'

export function CaseControls({ current, onLoad }: { current: LabCase; onLoad: (item: LabCase) => void }) {
  const [items, setItems] = useState(() => readLabCases().filter(item => item.algorithmId === current.algorithmId))
  const [selected, setSelected] = useState(0)
  const [message, setMessage] = useState('')
  const save = () => { try { saveLabCase(current); setItems(readLabCases().filter(item => item.algorithmId === current.algorithmId)); setSelected(0); setMessage('案例已保存到本机。') } catch (cause) { setMessage(cause instanceof Error ? cause.message : '保存失败。') } }
  const download = () => {
    try {
      const item = parseLabCase(JSON.stringify(current))
      const url = URL.createObjectURL(new Blob([JSON.stringify(item, null, 2)], { type: 'application/json' }))
      const link = document.createElement('a'); link.href = url; link.download = `datastruct-${item.algorithmId}.json`; link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setMessage('案例文件已导出。')
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : '导出失败。') }
  }
  const importFile = async (file?: File) => {
    if (!file) return
    try { if (file.size > 10000) throw new Error('案例文件不能超过 10 KB。'); const item = parseLabCase(await file.text()); if (item.algorithmId !== current.algorithmId) throw new Error(`请打开 ${item.algorithmId} 实验台后再导入。`); saveLabCase(item); setItems(readLabCases().filter(entry => entry.algorithmId === current.algorithmId)); setSelected(0); onLoad(item); setMessage('案例已导入并加载。') }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : '导入失败。') }
  }
  return <div className="case-controls"><strong>我的案例</strong><Button variant="outline" onClick={save}>保存当前数据</Button><Button variant="outline" onClick={download}>导出 JSON</Button><label className="case-import">导入 JSON<input type="file" accept=".json,application/json" aria-label="导入案例 JSON" onChange={event => { void importFile(event.target.files?.[0]); event.target.value = '' }}/></label>{items.length > 0 && <><select aria-label="已保存案例" value={selected} onChange={event => setSelected(Number(event.target.value))}>{items.map((item, index) => <option key={index} value={index}>{item.algorithmId} · {item.input.slice(0, 24)}</option>)}</select><Button variant="outline" onClick={() => { try { onLoad(items[selected]); setMessage('已载入案例。') } catch (cause) { setMessage(cause instanceof Error ? cause.message : '载入失败。') } }}>载入</Button></>}{message && <span role="status">{message}</span>}</div>
}
