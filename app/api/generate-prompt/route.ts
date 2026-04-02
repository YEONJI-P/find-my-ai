import { NextRequest } from 'next/server'
import { generatePromptJSON } from '@/lib/gemini'

const MAX_CONCERN_LENGTH = 200
const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|above|instructions)/gi,
  /system\s*:/gi,
  /```/g,
  /<\/?[a-z][a-z0-9]*\b[^>]*>/gi,
  /\[INST\]/gi,
  /\bprompt\s*injection\b/gi,
]

function sanitizeConcern(input: string | undefined): string | undefined {
  if (!input) return undefined
  let s = input.slice(0, MAX_CONCERN_LENGTH)
  for (const pattern of INJECTION_PATTERNS) {
    s = s.replace(pattern, '')
  }
  return s.trim() || undefined
}

export async function POST(request: NextRequest) {
  let occupationOrHobby: string, aiName: string
  let concern: string | undefined, mbti: string | undefined
  let detail: string | undefined, interests: string[] | undefined

  try {
    ;({ occupationOrHobby, concern, mbti, aiName, detail, interests } = await request.json())
  } catch {
    return new Response('요청 본문이 올바른 JSON이 아닙니다', { status: 400 })
  }

  if (!occupationOrHobby || !aiName) {
    return new Response('occupationOrHobby, aiName은 필수입니다', { status: 400 })
  }

  const sanitizedConcern = sanitizeConcern(concern)

  try {
    const result = await generatePromptJSON({ occupationOrHobby, concern: sanitizedConcern, mbti, aiName, detail, interests })
    return Response.json(result)
  } catch {
    return new Response('프롬프트 생성에 실패했습니다', { status: 500 })
  }
}
