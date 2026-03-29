export type Answers = {
  age?: string
  occupation_category?: string
  occupation_detail?: string
  follow_up?: string
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
  type: 'single_select' | 'grid_select' | 'text_input' | 'easter_egg'
  question?: string
  description?: string
  optional?: boolean
  options?: QuestionOption[]
  next?: string | Record<string, string> | null
  placeholder?: Record<string, string>
}
