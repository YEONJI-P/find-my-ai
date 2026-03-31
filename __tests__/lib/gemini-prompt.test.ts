import { buildPromptInput } from '@/lib/gemini-prompt'

const baseParams = {
  occupationOrHobby: '직장인 (사무·전문직)',
  recommendedAI: 'ChatGPT',
}

describe('buildPromptInput', () => {
  it('필수 필드만 있을 때 recommendedAI, occupation 포함', () => {
    const result = buildPromptInput(baseParams)
    expect(result.recommendedAI).toBe('ChatGPT')
    expect(result.occupation).toBe('직장인 (사무·전문직)')
  })

  it('detail, interests가 occupation에 합쳐짐', () => {
    const result = buildPromptInput({ ...baseParams, detail: 'office', interests: ['productivity', 'writing'] })
    expect(result.occupation).toBe('직장인 (사무·전문직), office, 업무 생산성·글쓰기')
  })

  it('interests에 unknown 포함 시 unknown은 제외', () => {
    const result = buildPromptInput({ ...baseParams, interests: ['finance', 'unknown'] })
    expect(result.occupation).toBe('직장인 (사무·전문직), 재테크')
  })

  it('interests=[unknown]만 있으면 occupation에서 interests 생략', () => {
    const result = buildPromptInput({ ...baseParams, interests: ['unknown'] })
    expect(result.occupation).toBe('직장인 (사무·전문직)')
  })

  it('concern이 있으면 포함', () => {
    const result = buildPromptInput({ ...baseParams, concern: '보고서 요약을 빠르게 하고 싶어요' })
    expect(result.concern).toBe('보고서 요약을 빠르게 하고 싶어요')
  })

  it('concern이 빈 문자열이면 필드 생략', () => {
    const result = buildPromptInput({ ...baseParams, concern: '' })
    expect(result.concern).toBeUndefined()
  })

  it('concern이 공백만이면 필드 생략', () => {
    const result = buildPromptInput({ ...baseParams, concern: '   ' })
    expect(result.concern).toBeUndefined()
  })

  it('mbti가 있으면 포함', () => {
    const result = buildPromptInput({ ...baseParams, mbti: 'ISTJ' })
    expect(result.mbti).toBe('ISTJ')
  })

  it('mbti가 없으면 필드 생략', () => {
    const result = buildPromptInput(baseParams)
    expect(result.mbti).toBeUndefined()
  })

  it('concern 앞뒤 공백은 trim', () => {
    const result = buildPromptInput({ ...baseParams, concern: '  논문 자료 찾기  ' })
    expect(result.concern).toBe('논문 자료 찾기')
  })
})
