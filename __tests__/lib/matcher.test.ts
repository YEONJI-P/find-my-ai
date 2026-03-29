import { calculateTopAIs } from '@/lib/matcher'
import type { Answers } from '@/lib/types'

describe('calculateTopAIs', () => {
  it('직장인+사무직+문서작성+PC+고급 → copilot이 1위', () => {
    const answers: Answers = {
      age: 'thirties',
      occupation_category: 'worker',
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

  it('시니어+은퇴여가+유튜브+모바일전용+초보 → lilys가 1위', () => {
    const answers: Answers = {
      age: 'fifties_plus',
      occupation_category: 'senior',
      occupation_detail: 'retired_leisure',
      follow_up: 'youtube',
      device: 'mobile_only',
      digital_literacy: 'beginner',
      main_concern: '유튜브 영상 요약해서 보고 싶어요',
    }
    const result = calculateTopAIs(answers)

    expect(result[0].id).toBe('lilys')
  })

  it('결과에 resultMessage가 main_concern으로 치환됨', () => {
    const answers: Answers = {
      occupation_category: 'worker',
      occupation_detail: 'office',
      follow_up: 'document',
      device: 'pc_main',
      digital_literacy: 'advanced',
      main_concern: '보고서 요약',
    }
    const result = calculateTopAIs(answers)

    // resultMessage에 플레이스홀더가 남아있지 않아야 함
    result.forEach(ai => {
      expect(ai.resultMessage).not.toContain('{occupation}')
      expect(ai.resultMessage).not.toContain('{concern}')
    })
  })

  it('정렬된 rank 순서 반환', () => {
    const answers: Answers = {
      occupation_category: 'freelancer',
      occupation_detail: 'writer',
      follow_up: 'writing',
      device: 'pc_main',
      digital_literacy: 'advanced',
    }
    const result = calculateTopAIs(answers)

    expect(result.map(r => r.rank)).toEqual([1, 2, 3])
  })
})
