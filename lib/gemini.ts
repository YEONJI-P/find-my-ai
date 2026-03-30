import { GoogleGenAI } from '@google/genai'
import { detectConcernType, buildSystemInstruction, type PromptParams } from '@/lib/gemini-prompt'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다')
}
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export type GeneratePromptParams = {
  occupationOrHobby: string
  detail?: string
  followUp?: string
  concern: string
  aiName: string
  aiDescription: string
}

export type GeneratePromptResult = {
  comment: string
  prompt: string
  answer: string
}

export async function generatePromptJSON(params: GeneratePromptParams): Promise<GeneratePromptResult> {
  const concernType = detectConcernType(params.concern)

  const promptParams: PromptParams = {
    concernType,
    occupationOrHobby: params.occupationOrHobby,
    detail: params.detail,
    followUp: params.followUp,
    recommendedAI: params.aiName,
    concern: params.concern,
  }

  const systemInstruction = buildSystemInstruction(promptParams)

  const response = await genAI.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: systemInstruction,
    config: {
      responseMimeType: 'application/json',
    },
  })

  const text = response.text ?? '{}'
  try {
    const parsed = JSON.parse(text) as GeneratePromptResult
    return {
      comment: parsed.comment ?? '',
      prompt: parsed.prompt ?? '',
      answer: parsed.answer ?? '',
    }
  } catch {
    return { comment: '', prompt: text, answer: '' }
  }
}
