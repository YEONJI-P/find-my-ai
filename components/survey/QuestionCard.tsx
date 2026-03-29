import { Button } from '@/components/ui/button'
import type { QuestionOption } from '@/lib/types'

interface QuestionCardProps {
  question: string
  description?: string
  options: QuestionOption[]
  onSelect: (value: string) => void
}

export default function QuestionCard({ question, description, options, onSelect }: QuestionCardProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">{question}</h2>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <div className="space-y-3">
        {options.map((option) => (
          <Button
            key={option.value}
            variant="outline"
            className="w-full justify-start text-left h-auto py-3 px-4 text-base"
            onClick={() => onSelect(option.value)}
          >
            {option.emoji && <span className="mr-2">{option.emoji}</span>}
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
