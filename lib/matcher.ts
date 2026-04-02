import aiToolsData from '@/data/ai-tools.json'
import matchingRulesData from '@/data/matching-rules.json'
import type { Answers, RankedAI } from '@/lib/types'

const aiTools = aiToolsData as typeof aiToolsData
const rules = matchingRulesData.rules
const weights = matchingRulesData.weights

function getOccupationDetailScore(occupationCategory: string, occupationDetail: string, aiId: string): number {
  const categoryRules = (rules.occupationDetail as unknown as Record<string, Record<string, Record<string, number>>>)[occupationCategory]
  if (!categoryRules) return 0
  const detailRules = categoryRules[occupationDetail]
  if (!detailRules) return 0
  return detailRules[aiId] ?? 0
}

function getInterestsScore(interests: string[], aiId: string): number {
  const interestRules = (rules as unknown as Record<string, Record<string, Record<string, number>>>).interests
  if (!interestRules) return 0
  const validInterests = interests.filter(i => i !== 'unknown')
  if (validInterests.length === 0) return 0
  const scores = validInterests.map(i => interestRules[i]?.[aiId] ?? 0)
  return scores.reduce((a, b) => a + b, 0) / scores.length
}

function getAgeBonus(age: string, aiId: string): number {
  const ageBonusRules = (rules.ageBonus as unknown as Record<string, Record<string, number>>)[age]
  if (!ageBonusRules) return 0
  return ageBonusRules[aiId] ?? 0
}

function getAccessibilityBonus(tool: typeof aiTools[number]): number {
  const a = (tool as unknown as { accessibilityScore?: { signupEase: number; koreanUI: number; mobileUX: number } }).accessibilityScore
  if (!a) return 0
  return (a.signupEase + a.koreanUI + a.mobileUX) / 3
}

export function calculateTopAIs(answers: Answers): RankedAI[] {
  const EXCLUDED_IDS = ['lilys', 'clova_x']

  const scores = aiTools.filter(tool => !EXCLUDED_IDS.includes(tool.id)).map((tool) => {
    const id = tool.id
    let score = 0

    const occupationScore = (tool.matchingWeight.occupation as Record<string, number>)[answers.occupation_category ?? ''] ?? 0
    score += occupationScore * weights.occupation

    let occupationDetailScore = 0
    if (answers.occupation_category && answers.occupation_detail) {
      occupationDetailScore = getOccupationDetailScore(answers.occupation_category, answers.occupation_detail, id)
      score += occupationDetailScore * weights.occupationDetail
    }

    if (answers.interests && answers.interests.length > 0) {
      score += getInterestsScore(answers.interests, id) * weights.interests
    }

    const deviceScore = (tool.matchingWeight.device as Record<string, number>)[answers.device ?? ''] ?? 0
    score += deviceScore * weights.device

    const literacyScore = (tool.matchingWeight.digitalLiteracy as Record<string, number>)[answers.digital_literacy ?? ''] ?? 0
    score += literacyScore * weights.digitalLiteracy

    if (answers.age) {
      score += getAgeBonus(answers.age, id)
    }

    if (answers.digital_literacy === 'beginner') {
      score += getAccessibilityBonus(tool) * 0.05
    }

    return { id, score, literacyScore, occupationDetailScore, tool }
  })

  const sorted = scores
    .sort((a, b) => b.score - a.score || b.literacyScore - a.literacyScore || b.occupationDetailScore - a.occupationDetailScore)
    .slice(0, 3)

  const topScore = sorted[0]?.score ?? 1

  return sorted.map((s, index) => {
    const rank = (index + 1) as 1 | 2 | 3
    // 1위 기준 상대적 스케일링: 60~97% 범위
    const compatibilityPercent = Math.round(60 + (s.score / topScore) * 37)
    return {
      rank,
      id: s.id,
      name: s.tool.name,
      badge: s.tool.badge,
      shortDescription: s.tool.shortDescription,
      strengths: s.tool.strengths,
      accessInfo: s.tool.accessInfo,
      resultMessage: '',
      compatibilityPercent,
      characterDescription: s.tool.characterDescription ?? '',
    }
  })
}
