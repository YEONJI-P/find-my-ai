export type Answers = {
  age?: string
  occupation_category?: string
  occupation_detail?: string
  interests?: string[]
  device?: string
  digital_literacy?: string
  mbti?: string
  main_concern?: string
}

export type RankedAI = {
  rank: 1 | 2 | 3
  id: string
  name: string
  badge: string
  shortDescription: string
  strengths: string[]
  accessInfo: {
    platform: string[]
    signupRequired: boolean
    freeAvailable: boolean
    url: string
  }
  resultMessage: string
  compatibilityPercent: number
  characterDescription: string
}

export type QuestionOption = {
  value: string
  label: string
  emoji?: string
  track?: string
}

export type Question = {
  id: string
  step: number | null
  type: 'single_select' | 'grid_select' | 'text_input' | 'multi_select' | 'easter_egg' | 'mbti_select'
  question?: string
  description?: string
  optional?: boolean
  max_select?: number
  options?: QuestionOption[]
  next?: string | Record<string, string> | null
  placeholder?: Record<string, string>
}
