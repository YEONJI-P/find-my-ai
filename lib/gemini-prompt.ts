export type PromptParams = {
  occupationOrHobby: string
  detail?: string
  followUp?: string
  recommendedAI: string
  concern?: string
  mbti?: string
}

export type PromptInput = {
  recommendedAI: string
  occupation: string
  concern?: string
  mbti?: string
}

export function buildPromptInput(params: PromptParams): PromptInput {
  const occupation = [params.occupationOrHobby, params.detail, params.followUp]
    .filter(Boolean)
    .join(', ')

  const input: PromptInput = {
    recommendedAI: params.recommendedAI,
    occupation,
  }

  const concern = params.concern?.trim()
  if (concern) input.concern = concern

  if (params.mbti) input.mbti = params.mbti

  return input
}
