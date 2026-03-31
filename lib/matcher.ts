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

export function calculateTopAIs(answers: Answers): RankedAI[] {
  const scores = aiTools.map((tool) => {
    const id = tool.id
    let score = 0

    const occupationScore = (tool.matchingWeight.occupation as Record<string, number>)[answers.occupation_category ?? ''] ?? 0
    score += occupationScore * weights.occupation

    if (answers.occupation_category && answers.occupation_detail) {
      score += getOccupationDetailScore(answers.occupation_category, answers.occupation_detail, id) * weights.occupationDetail
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

    return { id, score, literacyScore, tool }
  })

  const sorted = scores
    .sort((a, b) => b.score - a.score || b.literacyScore - a.literacyScore)
    .slice(0, 3)

  return sorted.map((s, index) => {
    const rank = (index + 1) as 1 | 2 | 3
    return {
      rank,
      id: s.id,
      name: s.tool.name,
      badge: s.tool.badge,
      shortDescription: s.tool.shortDescription,
      strengths: s.tool.strengths,
      accessInfo: s.tool.accessInfo,
      resultMessage: '',
    }
  })
}
