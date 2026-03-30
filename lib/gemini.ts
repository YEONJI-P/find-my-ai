import { GoogleGenAI } from '@google/genai'
import { detectConcernType, buildPromptText, type PromptParams } from '@/lib/gemini-prompt'

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

export async function generatePromptStream(params: GeneratePromptParams): Promise<ReadableStream<Uint8Array>> {
  const concernType = detectConcernType(params.concern)

  const promptParams: PromptParams = {
    concernType,
    occupationOrHobby: params.occupationOrHobby,
    detail: params.detail,
    followUp: params.followUp,
    recommendedAI: params.aiName,
    concern: params.concern,
  }

  const prompt = buildPromptText(promptParams)

  const result = await genAI.models.generateContentStream({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
  })

  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of result) {
          const text = chunk.text
          if (text) {
            controller.enqueue(encoder.encode(text))
          }
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })
}
