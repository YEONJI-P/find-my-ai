import { GoogleGenAI } from '@google/genai'

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export async function generatePromptStream(params: {
  occupation: string
  concern: string
  aiName: string
  aiDescription: string
}): Promise<ReadableStream<Uint8Array>> {
  const prompt = `당신은 ${params.aiName} 전문가입니다.
${params.occupation} 직군 사용자가 "${params.concern}" 문제를 해결하기 위해
${params.aiName}에서 바로 복사해 쓸 수 있는 한국어 프롬프트를 작성해주세요.

조건:
- ${params.aiName}에 바로 붙여넣을 수 있는 완성된 프롬프트여야 합니다
- 자연스러운 한국어로 작성해주세요
- 사용자의 직업과 고민이 명확히 반영되어야 합니다
- 3~5문장 분량으로 작성해주세요
- 프롬프트 외 부가 설명은 쓰지 마세요`

  const result = await genAI.models.generateContentStream({
    model: 'gemini-2.0-flash',
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
