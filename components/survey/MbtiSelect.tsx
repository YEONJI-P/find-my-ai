'use client'

interface MbtiSelectProps {
  question: string
  description?: string
  onSelect: (value: string) => void
}

const GROUPS = [
  {
    key: 'NT',
    label: '분석가',
    types: ['INTJ', 'INTP', 'ENTJ', 'ENTP'],
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    labelColor: 'text-purple-600',
    btnBase: 'border-purple-200 bg-white hover:bg-purple-50 active:bg-purple-100 active:border-purple-400',
  },
  {
    key: 'NF',
    label: '외교관',
    types: ['INFJ', 'INFP', 'ENFJ', 'ENFP'],
    bg: 'bg-green-50',
    border: 'border-green-200',
    labelColor: 'text-green-600',
    btnBase: 'border-green-200 bg-white hover:bg-green-50 active:bg-green-100 active:border-green-400',
  },
  {
    key: 'SJ',
    label: '관리자',
    types: ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'],
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    labelColor: 'text-blue-600',
    btnBase: 'border-blue-200 bg-white hover:bg-blue-50 active:bg-blue-100 active:border-blue-400',
  },
  {
    key: 'SP',
    label: '탐험가',
    types: ['ISTP', 'ISFP', 'ESTP', 'ESFP'],
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    labelColor: 'text-amber-600',
    btnBase: 'border-amber-200 bg-white hover:bg-amber-50 active:bg-amber-100 active:border-amber-400',
  },
]

export default function MbtiSelect({ question, description, onSelect }: MbtiSelectProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">{question}</h2>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>

      <button
        type="button"
        onClick={() => onSelect('unknown')}
        className="w-full py-3 px-4 text-base text-left border-2 border-gray-200 rounded-xl bg-white [@media(hover:hover)]:hover:border-gray-400 [@media(hover:hover)]:hover:bg-gray-50 active:bg-gray-50 active:border-gray-400 active:scale-[0.98] transition-[border-color,background-color,transform] duration-200 ease-out"
      >
        🤷 모르겠어요 / 건너뛰기
      </button>

      <div className="space-y-3">
        {GROUPS.map((group) => (
          <div key={group.key} className={`rounded-xl border ${group.border} ${group.bg} p-3 space-y-2`}>
            <p className={`text-xs font-semibold ${group.labelColor}`}>
              {group.key} · {group.label}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {group.types.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onSelect(type)}
                  className={`py-2.5 text-sm font-medium border-2 rounded-lg ${group.btnBase} [@media(hover:hover)]:${group.btnBase} active:scale-[0.96] transition-[border-color,background-color,transform] duration-150 ease-out`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
