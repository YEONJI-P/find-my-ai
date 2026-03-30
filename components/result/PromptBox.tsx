'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import type { RankedAI, Answers } from '@/lib/types'

interface PromptBoxProps {
  topAI: RankedAI
  answers: Answers
}

type PromptResult = {
  comment: string
  prompt: string
  answer: string
}

function buildOccupationOrHobby(answers: Answers): string {
  if (answers.hobby && answers.hobby.length > 0) {
    const hobbyLabels: Record<string, string> = {
      media: '영상·미디어', study: '공부·자기계발', cooking: '요리·살림',
      health: '건강·운동', travel: '여행·취미', finance: '재테크·투자',
      parenting: '육아·가족', shopping: '쇼핑·트렌드',
    }
    return answers.hobby.map(h => hobbyLabels[h] ?? h).join(', ')
  }
  const occupationLabels: Record<string, string> = {
    student: '학생·수험생', jobseeker: '취준생·이직준비',
    office_worker: '직장인 (사무·전문직)', field_worker: '직장인 (현장·서비스직)',
    self_employed_owner: '자영업·소상공인', freelancer: '프리랜서·크리에이터',
    homemaker: '주부·육아', it: 'IT·개발·데이터',
  }
  return occupationLabels[answers.occupation_category ?? ''] ?? answers.occupation_category ?? ''
}

export default function PromptBox({ topAI, answers }: PromptBoxProps) {
  const [result, setResult] = useState<PromptResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const hasConcern = !!answers.main_concern
    const hasContext = !!(answers.occupation_category || (answers.hobby && answers.hobby.length > 0))
    if (!hasConcern || !hasContext) {
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setResult(null)
    setError(false)

    fetch('/api/generate-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        occupationOrHobby: buildOccupationOrHobby(answers),
        detail: answers.occupation_detail,
        followUp: answers.follow_up,
        concern: answers.main_concern,
        aiName: topAI.name,
        aiDescription: topAI.shortDescription,
      }),
      signal: controller.signal,
    })
      .then(res => {
        if (!res.ok) throw new Error('API error')
        return res.json() as Promise<PromptResult>
      })
      .then(data => {
        if (!controller.signal.aborted) setResult(data)
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [topAI, answers])

  const handleCopy = async () => {
    if (!result?.prompt) return
    try {
      await navigator.clipboard.writeText(result.prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard 권한 없음 — 무시
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-3">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500">맞춤 프롬프트 생성 중...</p>
      </div>
    )
  }

  if (error || !result) {
    return (
      <p className="text-sm text-red-500 text-center py-4">
        프롬프트 생성에 실패했습니다. 다시 시도해주세요.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">✨ 바로 쓸 수 있는 맞춤 프롬프트</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="shrink-0"
        >
          {copied ? '복사됨 ✓' : '복사하기'}
        </Button>
      </div>

      {result.comment && (
        <p className="text-sm text-gray-500 italic">{result.comment}</p>
      )}

      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-800 whitespace-pre-wrap">
        {result.prompt}
      </div>

      {result.answer && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">AI 예시 답변</p>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-gray-700 whitespace-pre-wrap">
            {result.answer}
          </div>
        </div>
      )}
    </div>
  )
}
