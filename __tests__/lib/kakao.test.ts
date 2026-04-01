import { buildShareParams } from '@/lib/kakao'

const mockAI = {
  rank: 1 as const,
  id: 'claude',
  name: 'Claude',
  badge: '글쓰기',
  shortDescription: '글쓰기·분석에 강한 AI',
  strengths: [],
  accessInfo: { platform: [], signupRequired: false, freeAvailable: true, url: '' },
  resultMessage: '복잡한 내용도 차분하게 정리해주는 AI예요. 분석적인 사고가 필요한 작업에서 빛을 발해요.',
}

describe('buildShareParams', () => {
  it('title에 AI 이름을 포함한다', () => {
    const params = buildShareParams(mockAI)
    expect(params.content.title).toContain('Claude')
  })

  it('description은 resultMessage 앞 30자 + 말줄임이다', () => {
    const params = buildShareParams(mockAI)
    expect(params.content.description).toBe('"복잡한 내용도 차분하게 정리해주는 AI예요. 분석적인..."')
  })

  it('resultMessage가 30자 이하면 말줄임 없이 그대로다', () => {
    const short = { ...mockAI, resultMessage: '짧은 코멘트' }
    const params = buildShareParams(short)
    expect(params.content.description).toBe('"짧은 코멘트"')
  })

  it('buttonTitle은 나도 테스트하기다', () => {
    const params = buildShareParams(mockAI)
    expect(params.buttons[0].title).toBe('나도 테스트하기 →')
  })
})
