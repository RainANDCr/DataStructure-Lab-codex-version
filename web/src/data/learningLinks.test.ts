import { describe, expect, it } from 'vitest'
import { withLearningContext } from './learningLinks'

describe('跨页学习上下文', () => {
  it('keeps point and mode in animation, knowledge and practice links', () => {
    expect(withLearningContext('/lab/bubble', 'bubble', '408')).toBe('/lab/bubble?point=bubble&mode=408')
    expect(withLearningContext('/lab/practice', 'bubble', 'course')).toBe('/lab/practice?point=bubble&mode=course')
  })
  it('does not append an empty query to old URLs', () => {
    expect(withLearningContext('/lab/bubble')).toBe('/lab/bubble')
  })
})
