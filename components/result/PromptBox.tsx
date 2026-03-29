'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import type { RankedAI } from '@/lib/types'
import type { Answers } from '@/lib/types'

interface PromptBoxProps {
  topAI: RankedAI
  answers: Answers
}

export default function PromptBox({ topAI, answers }: PromptBoxProps) {
  const [promptText, setPromptText] = useState('')
  const [isStreaming, setIsStreaming] = useState(true)
  const [isDone, setIsDone] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!answers.occupation_category || !answers.main_concern) return

    const controller = new AbortController()
    setIsStreaming(true)
    setPromptText('')
    setIsDone(false)

    async function stream() {
      try {
        const response = await fetch('/api/generate-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            occupation: answers.occupation_category,
            concern: answers.main_concern,
            aiName: topAI.name,
            aiDescription: topAI.shortDescription,
          }),
          signal: controller.signal,
        })

        if (!response.ok || !response.body) {
          setPromptText('프롬프트 생성에 실패했습니다. 다시 시도해주세요.')
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
          setPromptText(text)
        }
        if (!controller.signal.aborted) setIsDone(true)
      } catch (e) {
        if (controller.signal.aborted) return
        setPromptText('네트워크 오류가 발생했습니다.')
      } finally {
        if (!controller.signal.aborted) setIsStreaming(false)
      }
    }

    stream()
    return () => controller.abort()
  }, [topAI, answers])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText)
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
        {isDone && (
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

      <div className="min-h-32 p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-800 whitespace-pre-wrap">
        {promptText}
        {isStreaming && <span className="inline-block w-1 h-4 bg-gray-500 animate-pulse ml-0.5" />}
        {!promptText && !isStreaming && (
          <span className="text-gray-400">프롬프트를 생성하는 중...</span>
        )}
      </div>
    </div>
  )
}
