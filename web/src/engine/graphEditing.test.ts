import { describe, expect, it } from 'vitest'
import { editGraphEdge, editGraphVertex } from './graphEditing'

describe('图形快捷编辑', () => {
  it('按图方向更新或删除边，并保留其他边', () => {
    expect(editGraphEdge('0-1:2, 1-2:3', 1, 0, 5, false)).toBe('1-2:3, 1-0:5')
    expect(editGraphEdge('0-1, 1-0', 1, 0, null, true, true)).toBe('0-1')
    expect(() => editGraphEdge('', 0, 0, null, false)).toThrow()
    expect(() => editGraphEdge('', 0, 1, -1, false)).toThrow()
  })

  it('添加节点并在删除末节点时清理相关边', () => {
    expect(editGraphVertex('0, 2', '0-1:4', 3)).toEqual({ input: '0, 2, 1', edges: '0-1:4' })
    expect(editGraphVertex('0, 2, 1', '0-1:4, 1-2:5', 3, true)).toEqual({ input: '0, 2', edges: '0-1:4' })
    expect(() => editGraphVertex('0, 1, 2', '', 3)).toThrow('最多')
    expect(() => editGraphVertex('0, 1', '', 6, true, 2)).toThrow('至少保留 2 个')
  })
})
