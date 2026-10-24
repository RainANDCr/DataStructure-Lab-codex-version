import { describe, expect, it } from 'vitest'
import { questions, validateQuestionBank, deriveSimulationAnswer, gradeAnswer, drawQuestions, type Attempt } from './questionBank'

describe('阶段七原创题库', () => {
  it('题目、映射和推演标准答案通过校验', () => {
    expect(questions.length).toBeGreaterThanOrEqual(20)
    expect(questions.filter(item => item.type === 'simulation').length).toBeGreaterThanOrEqual(5)
    expect(new Set(questions.map(item => item.id)).size).toBe(questions.length)
    expect(validateQuestionBank()).toEqual([])
    for (const item of questions.filter(item => item.type === 'simulation')) expect(deriveSimulationAnswer(item)).toEqual(item.answer)
  })

  it('单选、多选、判断、填空、复杂度和推演分别判分', () => {
    const byType = (type: string) => questions.find(item => item.type === type)!
    for (const type of ['single', 'multiple', 'boolean', 'numeric', 'complexity', 'simulation']) {
      const question = byType(type)
      expect(gradeAnswer(question, question.answer).correct).toBe(true)
      expect(gradeAnswer(question, ['明显错误']).correct).toBe(false)
    }
    const multiple = byType('multiple')
    expect(gradeAnswer(multiple, [...multiple.answer].reverse()).correct).toBe(true)
    const swap = questions.find(item => item.simulation?.kind === 'swap')!
    expect(gradeAnswer(swap, [...swap.answer].reverse()).correct).toBe(true)
    const traversal = questions.find(item => item.simulation?.kind === 'tree-order')!
    expect(gradeAnswer(traversal, [...traversal.answer].reverse()).correct).toBe(false)
    expect(gradeAnswer(byType('numeric'), ['3.0']).correct).toBe(true)
  })

  it('抽题不重复且保持原题库，记录可按版本和字段校验', () => {
    const original = questions.map(item => item.id)
    const drawn = drawQuestions(questions, 6, () => 0.2)
    expect(drawn).toHaveLength(6)
    expect(new Set(drawn.map(item => item.id)).size).toBe(6)
    expect(questions.map(item => item.id)).toEqual(original)
    const attempt: Attempt = { questionId: questions[0].id, answer: [...questions[0].answer], correct: true, mode: 'learn', timestamp: '2026-10-24T00:00:00.000Z', version: 1 }
    expect(attempt.version).toBe(1)
  })

  it('拒绝重复 ID、无效选项与被改坏的推演状态', () => {
    expect(validateQuestionBank([questions[0], questions[0]])).toContain(`${questions[0].id}: ID 重复`)
    expect(validateQuestionBank([{ ...questions[0], answer: ['不存在的选项'] }]).some(error => error.includes('选项无效'))).toBe(true)
    const simulated = questions.find(item => item.simulation?.kind === 'swap')!
    expect(validateQuestionBank([{ ...simulated, simulation: { ...simulated.simulation!, standardState: ['错误'] } }]).some(error => error.includes('推演状态'))).toBe(true)
  })
})
