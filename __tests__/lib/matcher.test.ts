import { calculateTopAIs } from '@/lib/matcher'
import type { Answers } from '@/lib/types'

describe('calculateTopAIs', () => {
  it('직장인(사무)+문서작성 interests+PC+고급 → copilot이 1위', () => {
    const answers: Answers = {
      age: 'thirties',
      occupation_category: 'office_worker',
      occupation_detail: 'office',
      interests: ['productivity', 'writing'],
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
      occupation_category: 'office_worker',
      occupation_detail: 'office',
      interests: ['productivity'],
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
      occupation_category: 'freelancer',
      occupation_detail: 'writer',
      interests: ['writing'],
      device: 'pc_main',
      digital_literacy: 'advanced',
    }
    const result = calculateTopAIs(answers)
    expect(result.map(r => r.rank)).toEqual([1, 2, 3])
  })

  it('field_worker+info interests → perplexity 상위권', () => {
    const answers: Answers = {
      occupation_category: 'field_worker',
      occupation_detail: 'service',
      interests: ['info'],
      device: 'mobile_only',
      digital_literacy: 'intermediate',
      main_concern: '노무 관련 정보를 찾고 싶어요',
    }
    const result = calculateTopAIs(answers)
    const perplexityRank = result.find(r => r.id === 'perplexity')?.rank
    expect(perplexityRank).toBeDefined()
    expect(perplexityRank).toBeLessThanOrEqual(2)
  })

  it('interests=[finance, info] → perplexity 상위권', () => {
    const answers: Answers = {
      occupation_category: 'student',
      occupation_detail: 'university',
      interests: ['finance', 'info'],
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

  it('interests=[video]+mobile+beginner → lilys 상위권', () => {
    const answers: Answers = {
      occupation_category: 'homemaker',
      occupation_detail: 'fulltime',
      interests: ['video'],
      device: 'mobile_only',
      digital_literacy: 'beginner',
    }
    const result = calculateTopAIs(answers)
    const lilysRank = result.find(r => r.id === 'lilys')?.rank
    expect(lilysRank).toBeDefined()
    expect(lilysRank).toBeLessThanOrEqual(2)
  })

  it('interests=[unknown]만 선택 시도 3개 결과 반환', () => {
    const answers: Answers = {
      occupation_category: 'student',
      occupation_detail: 'university',
      interests: ['unknown'],
      device: 'mobile_main',
      digital_literacy: 'intermediate',
    }
    const result = calculateTopAIs(answers)
    expect(result).toHaveLength(3)
    expect(result.map(r => r.rank)).toEqual([1, 2, 3])
  })

  it('interests 없어도 3개 결과 반환', () => {
    const answers: Answers = {
      occupation_category: 'student',
      occupation_detail: 'middle_high',
      device: 'mobile_main',
      digital_literacy: 'intermediate',
    }
    const result = calculateTopAIs(answers)
    expect(result).toHaveLength(3)
    expect(result.map(r => r.rank)).toEqual([1, 2, 3])
  })
})
