import { describe, expect, it } from 'vitest'
import { chapterGuides, knowledgeById, knowledgeForAlgorithm, knowledgePoints, layoutKnowledgeGraph, syllabusMapping, validateKnowledgeBase } from './knowledge'
import { chapters, lessonById, lessons } from './catalog'
import { syllabus2027 } from './syllabus2027'

describe('九章课程知识体系', () => {
  it('九章映射、先修关系、动画与自测引用有效', () => {
    expect(validateKnowledgeBase()).toEqual([])
    expect(chapterGuides.map(chapter => chapter.title)).toEqual(chapters)
    expect(new Set(knowledgePoints.map(point => point.id)).size).toBe(knowledgePoints.length)
    expect(knowledgePoints.every(point => point.relatedAlgorithms.every(id => lessonById.has(id)))).toBe(true)
    expect(syllabusMapping.verified).toBe(false)
  })

  it('九章均有定义、推演、自测并覆盖已有动画', () => {
    for (const chapterId of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      expect(chapterGuides[chapterId - 1].status).toBe('complete')
      const points = knowledgePoints.filter(item => item.chapterId === chapterId)
      expect(points.length).toBeGreaterThanOrEqual(2)
      expect(points.every(item => item.status === 'complete' && item.practice && item.definition && item.properties.length && item.diagram.length)).toBe(true)
      for (const lesson of lessons.filter(item => item.chapter === chapterId)) expect(knowledgePoints.some(item => item.relatedAlgorithms.includes(lesson.id)), lesson.id).toBe(true)
    }
  })

  it('知识依赖图和跨章节关联可到达正确知识点', () => {
    const linear = knowledgePoints.filter(item => item.chapterId === 2)
    const layout = layoutKnowledgeGraph(linear)
    expect(layout.nodes).toHaveLength(linear.length)
    expect(layout.edges).toContainEqual({ from: 'linear', to: 'linked' })
    expect(knowledgeById.get('linkedStack')?.prerequisites).toContain('linked')
    expect(knowledgeById.get('avl')?.prerequisites).toContain('bst')
    expect(knowledgeById.get('dijkstra')?.prerequisites).toContain('shortestPath')
    expect(layout.width).toBeGreaterThan(200)
  })

  it('算法页可反向找到完整知识点，考纲标签与教材章节分离', () => {
    expect(knowledgeForAlgorithm('quick').map(point => point.id)).toContain('quick')
    expect(knowledgeForAlgorithm('dijkstra').map(point => point.id)).toEqual(expect.arrayContaining(['shortestPath', 'dijkstra']))
    expect(knowledgeById.get('quick')?.chapterId).toBe(9)
    expect(knowledgeById.get('quick')?.examTags).toEqual(['408-排序'])
    expect(knowledgeById.get('dijkstra')?.examTags).toContain('408-贪心')
  })
  it('用户提供的 2027 考纲七个板块均可进入有效知识讲解', () => {
    expect(syllabus2027).toHaveLength(7)
    for (const section of syllabus2027) for (const [, id] of section.topics) expect(knowledgeById.get(id)?.status, id).toBe('complete')
  })
})
