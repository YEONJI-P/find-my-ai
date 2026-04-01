import { render, screen } from '@testing-library/react'
import AiCard from '@/components/result/AiCard'
import type { RankedAI } from '@/lib/types'

const mockAI: RankedAI = {
  rank: 1,
  id: 'claude',
  name: 'Claude',
  badge: '글쓰기',
  shortDescription: '글쓰기·분석에 강한 AI',
  strengths: ['긴 문서 요약', '코드 작성'],
  accessInfo: { platform: ['web'], signupRequired: true, freeAvailable: true, url: 'https://claude.ai' },
  resultMessage: '복잡한 내용도 차분하게 정리해 주는 AI예요.',
}

describe('AiCard', () => {
  it('isTop=true일 때 캐릭터 이미지 영역을 렌더링한다', () => {
    render(<AiCard ai={mockAI} isTop={true} />)
    const img = screen.queryByAltText('Claude 캐릭터')
    const placeholder = document.querySelector('[data-character-placeholder]')
    expect(img || placeholder).not.toBeNull()
  })

  it('isTop=false일 때 캐릭터 이미지 영역을 렌더링하지 않는다', () => {
    render(<AiCard ai={{ ...mockAI, rank: 2 }} isTop={false} />)
    expect(screen.queryByAltText('Claude 캐릭터')).toBeNull()
    expect(document.querySelector('[data-character-placeholder]')).toBeNull()
  })

  it('isTop=true일 때 data-share-card 속성이 있다', () => {
    render(<AiCard ai={mockAI} isTop={true} />)
    expect(document.querySelector('[data-share-card]')).not.toBeNull()
  })

  it('AI 이름이 표시된다', () => {
    render(<AiCard ai={mockAI} isTop={true} />)
    expect(screen.getByText('Claude')).toBeInTheDocument()
  })
})
