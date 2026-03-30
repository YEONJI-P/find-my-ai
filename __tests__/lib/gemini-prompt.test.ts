import { detectConcernType, buildSystemInstruction } from '@/lib/gemini-prompt'

describe('detectConcernType', () => {
  it('번아웃 키워드 → 2', () => {
    expect(detectConcernType('자소서 쓰기 싫고 게임하고 싶음')).toBe(2)
    expect(detectConcernType('귀찮아서 아무것도 하기 싫음')).toBe(2)
  })

  it('감성/고민 키워드 → 4', () => {
    expect(detectConcernType('손님이 없어서 너무 힘들어요')).toBe(4)
    expect(detectConcernType('요즘 너무 지쳐있어요')).toBe(4)
  })

  it('엉뚱/유머 키워드 → 5', () => {
    expect(detectConcernType('로또 당첨되고 싶음')).toBe(5)
    expect(detectConcernType('게임하고 싶음')).toBe(5)
  })

  it('무관심/탐색 키워드 → 3', () => {
    expect(detectConcernType('별생각없음')).toBe(3)
    expect(detectConcernType('그냥')).toBe(3)
    expect(detectConcernType('없음')).toBe(3)
    expect(detectConcernType('모르겠음')).toBe(3)
  })

  it('짧은 입력 → 3', () => {
    expect(detectConcernType('ㅇㅇ')).toBe(3)
  })

  it('구체적 목표 → 1', () => {
    expect(detectConcernType('보고서 요약을 빠르게 하고 싶어요')).toBe(1)
    expect(detectConcernType('영어 이메일 초안을 작성해야 해요')).toBe(1)
  })

  it('번아웃이 감성보다 우선', () => {
    expect(detectConcernType('힘들어서 하기 싫어')).toBe(2)
  })
})

describe('buildSystemInstruction', () => {
  const baseParams = {
    concernType: 1 as const,
    occupationOrHobby: '직장인 (사무·전문직)',
    recommendedAI: 'ChatGPT',
    concern: '보고서 요약을 빠르게 하고 싶어요',
  }

  it('출력에 추천 AI 이름이 포함됨', () => {
    const result = buildSystemInstruction(baseParams)
    expect(result).toContain('ChatGPT')
  })

  it('출력에 JSON 형식 안내가 포함됨', () => {
    const result = buildSystemInstruction(baseParams)
    expect(result).toContain('JSON')
  })

  it('출력에 추천 AI 이름이 포함됨 (Claude)', () => {
    const result = buildSystemInstruction({ ...baseParams, recommendedAI: 'Claude' })
    expect(result).toContain('Claude')
  })
})
