import { GoogleGenAI } from '@google/genai'
import { buildPromptInput, type PromptParams } from '@/lib/gemini-prompt'
import geminiContext from '@/data/gemini-context.json'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다')
}
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
const SYSTEM_INSTRUCTION = JSON.stringify(geminiContext.systemInstruction)

export type GeneratePromptParams = {
  occupationOrHobby: string
  detail?: string
  followUp?: string
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
    followUp: params.followUp,
    recommendedAI: params.aiName,
    concern: params.concern,
    mbti: params.mbti,
  }

  const input = buildPromptInput(promptParams)

  const response = await genAI.models.generateContent({
    model: 'gemini-2.0-flash-lite',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
    },
    contents: JSON.stringify(input),
  })

  const text = response.text ?? '{}'
  try {
    const parsed = JSON.parse(text) as GeneratePromptResult
    return {
      resultMessage: parsed.resultMessage ?? '',
      comment: parsed.comment ?? '',
      prompt: parsed.prompt ?? '',
      answer: parsed.answer ?? '',
    }
  } catch {
    return { resultMessage: '', comment: '', prompt: text, answer: '' }
  }
}
