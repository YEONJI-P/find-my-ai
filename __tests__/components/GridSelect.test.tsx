import { render, screen, fireEvent } from '@testing-library/react'
import GridSelect from '@/components/survey/GridSelect'

const options = [
  { value: 'student', label: '학생·수험생', emoji: '🎓' },
  { value: 'worker', label: '직장인', emoji: '🏢' },
  { value: 'it', label: 'IT·개발·데이터', emoji: '💻' },
]

describe('GridSelect', () => {
  it('모든 선택지를 그리드로 렌더링한다', () => {
    render(<GridSelect question="어떤 분이세요?" options={options} onSelect={jest.fn()} />)
    expect(screen.getByText('학생·수험생')).toBeInTheDocument()
    expect(screen.getByText('직장인')).toBeInTheDocument()
    expect(screen.getByText('IT·개발·데이터')).toBeInTheDocument()
  })

  it('선택지 클릭 시 onSelect가 value와 함께 호출된다', () => {
    const onSelect = jest.fn()
    render(<GridSelect question="어떤 분이세요?" options={options} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('직장인'))
    expect(onSelect).toHaveBeenCalledWith('worker')
  })
})
