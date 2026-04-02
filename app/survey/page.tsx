'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ProgressBar from '@/components/survey/ProgressBar'
import QuestionCard from '@/components/survey/QuestionCard'
import GridSelect from '@/components/survey/GridSelect'
import { Button } from '@/components/ui/button'
import { calculateTopAIs } from '@/lib/matcher'
import questionsData from '@/data/questions.json'
import type { Answers, Question } from '@/lib/types'

const TOTAL_STEPS = 8

function getAnswerKey(questionId: string): keyof Answers {
  if (questionId.startsWith('occupation_detail_')) return 'occupation_detail'
  return questionId as keyof Answers
}

function getNextQuestionId(question: Question, selectedValue: string): string | null {
  if (!question.next) return null
  if (typeof question.next === 'string') return question.next
  return (question.next as Record<string, string>)[selectedValue] ?? null
}

export default function SurveyPage() {
  const router = useRouter()
  const [currentQuestionId, setCurrentQuestionId] = useState<string>('age')
  const [history, setHistory] = useState<string[]>([])
  const [answers, setAnswers] = useState<Answers>({})
  const [mainConcernText, setMainConcernText] = useState('')

  const questions = questionsData.questions as Record<string, Question>
  const currentQuestion = questions[currentQuestionId]

  const handleSelect = useCallback((value: string) => {
    const answerKey = getAnswerKey(currentQuestionId)
    const newAnswers = { ...answers, [answerKey]: value }
    setAnswers(newAnswers)

    if (currentQuestionId === 'occupation_category' && value === 'it') {
      setHistory(prev => [...prev, currentQuestionId])
      router.push('/easter-egg')
      return
    }

    const nextId = getNextQuestionId(currentQuestion, value)
    if (nextId === null) return

    setHistory(prev => [...prev, currentQuestionId])
    setCurrentQuestionId(nextId)
  }, [currentQuestionId, answers, currentQuestion, router])

  const handleMultiConfirm = useCallback((values: string[]) => {
    const answerKey = getAnswerKey(currentQuestionId)
    const newAnswers = { ...answers, [answerKey]: values }
    setAnswers(newAnswers)

    const nextId = (currentQuestion.next as string) ?? 'device'
    setHistory(prev => [...prev, currentQuestionId])
    setCurrentQuestionId(nextId)
  }, [currentQuestionId, answers, currentQuestion])

  const handleBack = useCallback(() => {
    if (history.length === 0) {
      router.push('/')
      return
    }
    const prevId = history[history.length - 1]
    const answerKey = getAnswerKey(currentQuestionId)
    const newAnswers = { ...answers }
    delete newAnswers[answerKey]
    setAnswers(newAnswers)
    setHistory(prev => prev.slice(0, -1))
    setCurrentQuestionId(prevId)
  }, [history, currentQuestionId, answers, router])

  const handleSubmitConcern = useCallback(() => {
    if (!mainConcernText.trim()) return
    const finalAnswers = { ...answers, main_concern: mainConcernText.trim() }
    const topAIs = calculateTopAIs(finalAnswers)
    sessionStorage.setItem('surveyResults', JSON.stringify({ rankedAIs: topAIs, answers: finalAnswers }))
    router.push('/result')
  }, [answers, mainConcernText, router])

  const handleSkipConcern = useCallback(() => {
    const topAIs = calculateTopAIs(answers)
    sessionStorage.setItem('surveyResults', JSON.stringify({ rankedAIs: topAIs, answers }))
    router.push('/result')
  }, [answers, router])

  if (!currentQuestion) return null

  const currentStep = Math.min(history.length + 1, TOTAL_STEPS)

  const placeholderKey = answers.occupation_category ?? 'default'

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <div className="max-w-md mx-auto w-full flex flex-col flex-1 px-4 py-6 gap-6">
        <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        <div className="flex-1">
          {currentQuestion.type === 'grid_select' && (
            <GridSelect
              key={currentQuestionId}
              question={currentQuestion.question ?? ''}
              description={currentQuestion.description}
              options={currentQuestion.options ?? []}
              onSelect={handleSelect}
            />
          )}

          {currentQuestion.type === 'multi_select' && (
            <GridSelect
              key={currentQuestionId}
              question={currentQuestion.question ?? ''}
              description={currentQuestion.description}
              options={currentQuestion.options ?? []}
              onSelect={() => {}}
              multiSelect={true}
              maxSelect={currentQuestion.max_select}
              onMultiConfirm={handleMultiConfirm}
            />
          )}

          {currentQuestion.type === 'single_select' && (
            <QuestionCard
              question={currentQuestion.question ?? ''}
              description={currentQuestion.description}
              options={currentQuestion.options ?? []}
              onSelect={handleSelect}
            />
          )}

          {currentQuestion.type === 'text_input' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-gray-900">{currentQuestion.question}</h2>
                {currentQuestion.description && (
                  <p className="text-sm text-gray-500">{currentQuestion.description}</p>
                )}
              </div>
              <textarea
                value={mainConcernText}
                onChange={e => setMainConcernText(e.target.value.slice(0, 100))}
                placeholder={
                  (currentQuestion.placeholder as Record<string, string>)?.[placeholderKey] ??
                  (currentQuestion.placeholder as Record<string, string>)?.['default'] ??
                  '고민을 입력해주세요'
                }
                maxLength={100}
                className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl resize-none text-base focus:outline-none focus:border-blue-400"
              />
              <p className="text-xs text-right text-gray-400">{mainConcernText.length} / 100</p>
              <Button
                className="w-full h-12 text-base"
                onClick={handleSubmitConcern}
                disabled={!mainConcernText.trim()}
              >
                내 AI 찾기 ✨
              </Button>
              {currentQuestion.optional && (
                <button
                  type="button"
                  onClick={handleSkipConcern}
                  className="w-full text-sm text-gray-400 [@media(hover:hover)]:hover:text-gray-600 active:text-gray-600 transition-colors py-2"
                >
                  건너뛰기 →
                </button>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleBack}
          className="text-sm text-gray-400 [@media(hover:hover)]:hover:text-gray-600 active:text-gray-600 transition-colors self-start"
        >
          ← 이전으로
        </button>
      </div>
    </main>
  )
}
