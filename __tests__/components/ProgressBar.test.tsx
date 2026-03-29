import { render, screen } from '@testing-library/react'
import ProgressBar from '@/components/survey/ProgressBar'

describe('ProgressBar', () => {
  it('현재 단계와 전체 단계를 표시한다', () => {
    render(<ProgressBar currentStep={3} totalSteps={8} />)
    expect(screen.getByText('3 / 8')).toBeInTheDocument()
  })

  it('진행률 aria-valuenow 속성이 올바르다', () => {
    render(<ProgressBar currentStep={4} totalSteps={8} />)
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '50')
  })
})
