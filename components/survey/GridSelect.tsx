import type { QuestionOption } from '@/lib/types'

interface GridSelectProps {
  question: string
  description?: string
  options: QuestionOption[]
  onSelect: (value: string) => void
}

export default function GridSelect({ question, description, options, onSelect }: GridSelectProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">{question}</h2>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-150 gap-2"
          >
            {option.emoji && <span className="text-2xl">{option.emoji}</span>}
            <span className="text-sm font-medium text-gray-800 text-center">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
