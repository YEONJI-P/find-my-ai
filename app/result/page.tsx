'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AiCard from '@/components/result/AiCard'
import PromptBox from '@/components/result/PromptBox'
import { Button } from '@/components/ui/button'
import type { RankedAI, Answers } from '@/lib/types'

type SurveyResults = {
  rankedAIs: RankedAI[]
  answers: Answers
}

export default function ResultPage() {
  const router = useRouter()
  const [results, setResults] = useState<SurveyResults | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('surveyResults')
    if (!raw) {
      router.replace('/survey')
      return
    }
    try {
      setResults(JSON.parse(raw))
    } catch {
      router.replace('/survey')
    }
  }, [router])

  if (!results) return null

  const { rankedAIs, answers } = results
  const topAI = rankedAIs[0]

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-md mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-2">
          <p className="text-sm text-blue-600 font-medium">분석 완료!</p>
          <h1 className="text-2xl font-bold text-gray-900">
            나에게 딱 맞는 AI는<br />
            <span className="text-blue-600">{topAI?.name}</span>이에요 🎉
          </h1>
        </div>

        {topAI && (
          <PromptBox topAI={topAI} answers={answers} />
        )}

        <div className="space-y-4">
          <h2 className="font-bold text-gray-700">추천 AI Top 3</h2>
          {rankedAIs.map((ai) => (
            <AiCard key={ai.id} ai={ai} isTop={ai.rank === 1} />
          ))}
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            sessionStorage.removeItem('surveyResults')
            router.push('/survey')
          }}
        >
          다시 테스트하기
        </Button>
      </div>
    </main>
  )
}
