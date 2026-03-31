import { GoogleGenAI } from '@google/genai'
import { buildPromptInput, type PromptParams } from '@/lib/gemini-prompt'
import geminiContext from '@/data/gemini-context.json'

function cleanJSON(text: string): string {
  // 코드 펜스(```json ... ```) 제거
  let s = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  // 말미에 중괄호가 하나 더 붙은 경우 제거 (e.g. ...}} → ...})
  s = s.replace(/\}\s*\}(\s*)$/, '}$1')
  return s
}

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다')
}
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
const SYSTEM_INSTRUCTION = JSON.stringify(geminiContext.systemInstruction, null, 2)

export type GeneratePromptParams = {
  occupationOrHobby: string
  detail?: string
  interests?: string[]
  concern?: string
  mbti?: string
  aiName: string
}

export type GeneratePromptResult = {
  resultMessage: string
  comment: string
  prompt: string
  answer: string
}

export async function generatePromptJSON(params: GeneratePromptParams): Promise<GeneratePromptResult> {
  const promptParams: PromptParams = {
    occupationOrHobby: params.occupationOrHobby,
    detail: params.detail,
    interests: params.interests,
    recommendedAI: params.aiName,
    concern: params.concern,
    mbti: params.mbti,
  }

  const input = buildPromptInput(promptParams)

  const response = await genAI.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
    },
    contents: JSON.stringify(input),
  })

  const text = response.text ?? '{}'
  const cleaned = cleanJSON(text)
  const parsed = JSON.parse(cleaned) as GeneratePromptResult
  return {
    resultMessage: parsed.resultMessage ?? '',
    comment: parsed.comment ?? '',
    prompt: parsed.prompt ?? '',
    answer: parsed.answer ?? '',
  }
}
