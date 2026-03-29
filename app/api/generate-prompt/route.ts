import { NextRequest } from 'next/server'
import { generatePromptStream } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  const { occupation, concern, aiName, aiDescription } = await request.json()

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
