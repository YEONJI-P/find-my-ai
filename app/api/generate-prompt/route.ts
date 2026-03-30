import { NextRequest } from 'next/server'
import { generatePromptJSON } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  let occupationOrHobby: string, concern: string, aiName: string, aiDescription: string
  let detail: string | undefined, followUp: string | undefined

  try {
    ;({ occupationOrHobby, concern, aiName, aiDescription, detail, followUp } = await request.json())
  } catch {
    return new Response('요청 본문이 올바른 JSON이 아닙니다', { status: 400 })
  }

  if (!occupationOrHobby || !concern || !aiName) {
    return new Response('occupationOrHobby, concern, aiName은 필수입니다', { status: 400 })
  }

  const result = await generatePromptJSON({ occupationOrHobby, concern, aiName, aiDescription, detail, followUp })

  return Response.json(result)
}
