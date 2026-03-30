import { calculateTopAIs } from '@/lib/matcher'
import type { Answers } from '@/lib/types'

describe('calculateTopAIs — work 트랙', () => {
  it('직장인(사무)+문서작성+PC+고급 → copilot이 1위', () => {
    const answers: Answers = {
      age: 'thirties',
      purpose: 'work',
      occupation_category: 'office_worker',
      occupation_detail: 'office',
      follow_up: 'document',
      device: 'pc_main',
      digital_literacy: 'advanced',
      main_concern: '보고서 요약을 빠르게 하고 싶어요',
    }
    const result = calculateTopAIs(answers)
    expect(result).toHaveLength(3)
    expect(result[0].rank).toBe(1)
    expect(result[0].id).toBe('copilot')
    expect(result[1].rank).toBe(2)
    expect(result[2].rank).toBe(3)
  })

  it('결과에 resultMessage 플레이스홀더가 남지 않음', () => {
    const answers: Answers = {
      purpose: 'work',
      occupation_category: 'office_worker',
      occupation_detail: 'office',
      follow_up: 'document',
      device: 'pc_main',
      digital_literacy: 'advanced',
      main_concern: '보고서 요약',
    }
    const result = calculateTopAIs(answers)
    result.forEach(ai => {
      expect(ai.resultMessage).not.toContain('{occupation}')
      expect(ai.resultMessage).not.toContain('{concern}')
    })
  })

  it('정렬된 rank 순서 반환', () => {
    const answers: Answers = {
      purpose: 'work',
      occupation_category: 'freelancer',
      occupation_detail: 'writer',
      follow_up: 'writing',
      device: 'pc_main',
      digital_literacy: 'advanced',
    }
    const result = calculateTopAIs(answers)
    expect(result.map(r => r.rank)).toEqual([1, 2, 3])
  })

  it('field_worker+work_info → perplexity 상위권', () => {
    const answers: Answers = {
      purpose: 'work',
      occupation_category: 'field_worker',
      occupation_detail: 'service',
      follow_up: 'work_info',
      device: 'mobile_only',
      digital_literacy: 'intermediate',
      main_concern: '노무 관련 정보를 찾고 싶어요',
    }
    const result = calculateTopAIs(answers)
    const perplexityRank = result.find(r => r.id === 'perplexity')?.rank
    expect(perplexityRank).toBeDefined()
    expect(perplexityRank).toBeLessThanOrEqual(2)
  })
})

describe('calculateTopAIs — life 트랙', () => {
  it('hobby=[finance]+mobile → perplexity 상위권', () => {
    const answers: Answers = {
      age: 'thirties',
      purpose: 'life',
      hobby: ['finance'],
      device: 'mobile_only',
      digital_literacy: 'intermediate',
      main_concern: '재테크 공부를 시작하고 싶어요',
    }
    const result = calculateTopAIs(answers)
    expect(result).toHaveLength(3)
    const perplexityRank = result.find(r => r.id === 'perplexity')?.rank
    expect(perplexityRank).toBeDefined()
    expect(perplexityRank).toBeLessThanOrEqual(2)
  })

  it('hobby=[media]+mobile+beginner → lilys 상위권', () => {
    const answers: Answers = {
      purpose: 'life',
      hobby: ['media'],
      device: 'mobile_only',
      digital_literacy: 'beginner',
      main_concern: '유튜브 요약이 필요해요',
    }
    const result = calculateTopAIs(answers)
    const lilysRank = result.find(r => r.id === 'lilys')?.rank
    expect(lilysRank).toBeDefined()
    expect(lilysRank).toBeLessThanOrEqual(2)
  })

  it('life 트랙도 3개 결과 반환', () => {
    const answers: Answers = {
      purpose: 'life',
      hobby: ['cooking', 'health'],
      device: 'mobile_main',
      digital_literacy: 'intermediate',
    }
    const result = calculateTopAIs(answers)
    expect(result).toHaveLength(3)
    expect(result.map(r => r.rank)).toEqual([1, 2, 3])
  })
})
