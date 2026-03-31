import { NextRequest } from 'next/server'
import { generatePromptJSON } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  let occupationOrHobby: string, aiName: string
  let concern: string | undefined, mbti: string | undefined
  let detail: string | undefined, followUp: string | undefined

  try {
    ;({ occupationOrHobby, concern, mbti, aiName, detail, followUp } = await request.json())
  } catch {
    return new Response('요청 본문이 올바른 JSON이 아닙니다', { status: 400 })
  }

  if (!occupationOrHobby || !aiName) {
    return new Response('occupationOrHobby, aiName은 필수입니다', { status: 400 })
  }

  const result = await generatePromptJSON({ occupationOrHobby, concern, mbti, aiName, detail, followUp })

  return Response.json(result)
}
