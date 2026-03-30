'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import type { RankedAI, Answers } from '@/lib/types'

interface PromptBoxProps {
  topAI: RankedAI
  answers: Answers
}

function splitPromptText(text: string, aiName: string): { intro: string; prompt: string } {
  const marker = `[${aiName}에 붙여넣기]`
  const idx = text.indexOf(marker)
  if (idx === -1) return { intro: '', prompt: text }
  return {
    intro: text.slice(0, idx).trim(),
    prompt: text.slice(idx).trim(),
  }
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
    homemaker: '주부·육아',
  }
  return occupationLabels[answers.occupation_category ?? ''] ?? answers.occupation_category ?? ''
}

export default function PromptBox({ topAI, answers }: PromptBoxProps) {
  const [fullText, setFullText] = useState('')
  const [isStreaming, setIsStreaming] = useState(true)
  const [isDone, setIsDone] = useState(false)
  const [copied, setCopied] = useState(false)

  const { intro, prompt } = splitPromptText(fullText, topAI.name)

  useEffect(() => {
    const hasConcern = !!answers.main_concern
    const hasContext = !!(answers.occupation_category || (answers.hobby && answers.hobby.length > 0))
    if (!hasConcern || !hasContext) return

    const controller = new AbortController()
    setIsStreaming(true)
    setFullText('')
    setIsDone(false)

    async function stream() {
      try {
        const response = await fetch('/api/generate-prompt', {
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

        if (!response.ok || !response.body) {
          setFullText('프롬프트 생성에 실패했습니다. 다시 시도해주세요.')
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let text = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (controller.signal.aborted) { reader.cancel(); break }
          text += decoder.decode(value, { stream: true })
          setFullText(text)
        }
        if (!controller.signal.aborted) setIsDone(true)
      } catch (e) {
        if (controller.signal.aborted) return
        setFullText('네트워크 오류가 발생했습니다.')
      } finally {
        if (!controller.signal.aborted) setIsStreaming(false)
      }
    }

    stream()
    return () => controller.abort()
  }, [topAI, answers])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard 권한 없음 — 무시
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">
          ✨ {topAI.name}에서 바로 쓸 수 있는 맞춤 프롬프트
        </h3>
        {isDone && prompt && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? '복사됨 ✓' : '복사하기'}
          </Button>
        )}
      </div>

      {intro && (
        <p className="text-sm text-gray-500 italic">{intro}</p>
      )}

      <div className="min-h-32 p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-800 whitespace-pre-wrap">
        {prompt || fullText}
        {isStreaming && <span className="inline-block w-1 h-4 bg-gray-500 animate-pulse ml-0.5" />}
        {!fullText && !isStreaming && (
          <span className="text-gray-400">프롬프트를 생성하는 중...</span>
        )}
      </div>
    </div>
  )
}
