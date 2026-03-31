const INTEREST_LABELS: Record<string, string> = {
  productivity: '업무 생산성',
  writing: '글쓰기',
  study: '공부·학습',
  job_prep: '취업·이직',
  design: '디자인',
  video: '영상·콘텐츠',
  info: '정보 탐색',
  finance: '재테크',
  travel: '여행',
  health: '건강·운동',
  cooking: '요리',
  shopping: '쇼핑',
  entertainment: '게임·엔터',
}

export type PromptParams = {
  occupationOrHobby: string
  detail?: string
  interests?: string[]
  recommendedAI: string
  concern?: string
  mbti?: string
}

export type PromptInput = {
  recommendedAI: string
  occupation: string
  interests?: string
  concern?: string
  mbti?: string
}

export function buildPromptInput(params: PromptParams): PromptInput {
  const interestStr = params.interests
    ?.filter(i => i !== 'unknown')
    .map(i => INTEREST_LABELS[i] ?? i)
    .join('·') || undefined

  const occupation = [params.occupationOrHobby, params.detail]
    .filter(Boolean)
    .join(', ')

  const input: PromptInput = {
    recommendedAI: params.recommendedAI,
    occupation,
  }

  if (interestStr) input.interests = interestStr

  const concern = params.concern?.trim()
  if (concern) input.concern = concern

  if (params.mbti) input.mbti = params.mbti

  return input
}
