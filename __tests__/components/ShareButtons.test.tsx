import { render, screen, fireEvent, act } from '@testing-library/react'
import ShareButtons from '@/components/result/ShareButtons'
import type { RankedAI } from '@/lib/types'

// html-to-image mock
jest.mock('html-to-image', () => ({
  toPng: jest.fn().mockResolvedValue('data:image/png;base64,abc'),
}))

// kakao mock
jest.mock('@/lib/kakao', () => ({
  shareToKakao: jest.fn(),
}))

const mockAI: RankedAI = {
  rank: 1,
  id: 'claude',
  name: 'Claude',
  badge: '글쓰기',
  shortDescription: '글쓰기·분석에 강한 AI',
  strengths: [],
  accessInfo: { platform: [], signupRequired: false, freeAvailable: true, url: '' },
  resultMessage: '좋은 AI예요.',
}

describe('ShareButtons', () => {
  it('카카오톡, 이미지 저장, 링크 복사 버튼을 렌더링한다', () => {
    render(<ShareButtons topAI={mockAI} />)
    expect(screen.getByText('카카오톡')).toBeInTheDocument()
    expect(screen.getByText('이미지 저장')).toBeInTheDocument()
    expect(screen.getByText('링크 복사')).toBeInTheDocument()
  })

  it('링크 복사 버튼 클릭 시 clipboard에 URL을 쓴다', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    })
    render(<ShareButtons topAI={mockAI} />)
    await act(async () => {
      fireEvent.click(screen.getByText('링크 복사').closest('button')!)
    })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.href)
  })

  it('링크 복사 후 버튼 라벨이 "확인 ✓"로 바뀐다', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    })
    render(<ShareButtons topAI={mockAI} />)
    await act(async () => {
      fireEvent.click(screen.getByText('링크 복사').closest('button')!)
    })
    expect(screen.getByText('확인 ✓')).toBeInTheDocument()
  })
})
