import { NextRequest } from 'next/server'
import { generatePromptStream } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  let occupation: string, concern: string, aiName: string, aiDescription: string
  try {
    ;({ occupation, concern, aiName, aiDescription } = await request.json())
  } catch {
    return new Response('요청 본문이 올바른 JSON이 아닙니다', { status: 400 })
  }

  if (!occupation || !concern || !aiName) {
    return new Response('occupation, concern, aiName은 필수입니다', { status: 400 })
  }

  const stream = await generatePromptStream({ occupation, concern, aiName, aiDescription })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}
