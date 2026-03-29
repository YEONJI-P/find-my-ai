import { render, screen, fireEvent } from '@testing-library/react'
import QuestionCard from '@/components/survey/QuestionCard'

const options = [
  { value: 'teen', label: '10대' },
  { value: 'twenties', label: '20대' },
  { value: 'thirties', label: '30대' },
]

describe('QuestionCard', () => {
  it('질문과 선택지를 렌더링한다', () => {
    render(
      <QuestionCard
        question="나이대를 알려주세요"
        options={options}
        onSelect={jest.fn()}
      />
    )
    expect(screen.getByText('나이대를 알려주세요')).toBeInTheDocument()
    expect(screen.getByText('10대')).toBeInTheDocument()
    expect(screen.getByText('20대')).toBeInTheDocument()
    expect(screen.getByText('30대')).toBeInTheDocument()
  })

  it('선택지 클릭 시 onSelect가 value와 함께 호출된다', () => {
    const onSelect = jest.fn()
    render(
      <QuestionCard
        question="나이대를 알려주세요"
        options={options}
        onSelect={onSelect}
      />
    )
    fireEvent.click(screen.getByText('20대'))
    expect(onSelect).toHaveBeenCalledWith('twenties')
  })

  it('description이 있으면 렌더링한다', () => {
    render(
      <QuestionCard
        question="질문"
        description="설명 텍스트"
        options={options}
        onSelect={jest.fn()}
      />
    )
    expect(screen.getByText('설명 텍스트')).toBeInTheDocument()
  })
})
