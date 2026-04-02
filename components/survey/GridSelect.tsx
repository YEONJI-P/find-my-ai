'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { QuestionOption } from '@/lib/types'

interface GridSelectProps {
  question: string
  description?: string
  options: QuestionOption[]
  onSelect: (value: string) => void
  multiSelect?: boolean
  maxSelect?: number
  onMultiConfirm?: (values: string[]) => void
}

export default function GridSelect({
  question,
  description,
  options,
  onSelect,
  multiSelect = false,
  maxSelect,
  onMultiConfirm,
}: GridSelectProps) {
  const [selected, setSelected] = useState<string[]>([])

  function toggleOption(value: string) {
    setSelected(prev => {
      if (prev.includes(value)) return prev.filter(v => v !== value)
      if (maxSelect && prev.length >= maxSelect) return prev
      return [...prev, value]
    })
  }

  if (!multiSelect) {
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
              type="button"
              onClick={() => onSelect(option.value)}
              className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-gray-200 bg-white [@media(hover:hover)]:hover:border-blue-400 [@media(hover:hover)]:hover:bg-blue-50/50 [@media(hover:hover)]:hover:shadow-sm active:scale-[0.98] active:border-blue-300 active:bg-blue-50 transition-[border-color,background-color,box-shadow,transform] duration-200 ease-out gap-2"
            >
              {option.emoji && <span className="text-2xl">{option.emoji}</span>}
              <span className="text-sm font-medium text-gray-800 text-center">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">{question}</h2>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = selected.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleOption(option.value)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-[border-color,background-color,box-shadow,transform] duration-200 ease-out gap-2 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white [@media(hover:hover)]:hover:border-blue-400 [@media(hover:hover)]:hover:bg-blue-50/50 [@media(hover:hover)]:hover:shadow-sm active:scale-[0.98] active:border-blue-300 active:bg-blue-50'
              }`}
            >
              {option.emoji && <span className="text-2xl">{option.emoji}</span>}
              <span className="text-sm font-medium text-gray-800 text-center">{option.label}</span>
            </button>
          )
        })}
      </div>
      <Button
        className="w-full h-12 text-base"
        disabled={selected.length === 0}
        onClick={() => onMultiConfirm?.(selected)}
      >
        선택 완료 ({selected.length}{maxSelect ? `/${maxSelect}` : ''})
      </Button>
    </div>
  )
}
