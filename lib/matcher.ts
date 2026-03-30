import aiToolsData from '@/data/ai-tools.json'
import matchingRulesData from '@/data/matching-rules.json'
import type { Answers, RankedAI } from '@/lib/types'

const aiTools = aiToolsData as typeof aiToolsData
const rules = matchingRulesData.rules
const weights = matchingRulesData.weights
const lifeWeights = matchingRulesData.lifeWeights

function getOccupationDetailScore(occupationCategory: string, occupationDetail: string, aiId: string): number {
  const categoryRules = (rules.occupationDetail as unknown as Record<string, Record<string, Record<string, number>>>)[occupationCategory]
  if (!categoryRules) return 0
  const detailRules = categoryRules[occupationDetail]
  if (!detailRules) return 0
  return detailRules[aiId] ?? 0
}

function getFollowUpScore(followUp: string, aiId: string): number {
  const followUpRules = (rules.followUp as unknown as Record<string, Record<string, number>>)[followUp]
  if (!followUpRules) return 0
  return followUpRules[aiId] ?? 0
}

function getAgeBonus(age: string, aiId: string): number {
  const ageBonusRules = (rules.ageBonus as unknown as Record<string, Record<string, number>>)[age]
  if (!ageBonusRules) return 0
  return ageBonusRules[aiId] ?? 0
}

function getHobbyScore(hobbies: string[], aiId: string): number {
  const hobbyRules = (rules as unknown as Record<string, Record<string, Record<string, number>>>).hobby
  if (!hobbyRules) return 0
  const scores = hobbies.map(h => hobbyRules[h]?.[aiId] ?? 0)
  if (scores.length === 0) return 0
  return scores.reduce((a, b) => a + b, 0) / scores.length
}

export function calculateTopAIs(answers: Answers): RankedAI[] {
  const isLifeTrack = Array.isArray(answers.hobby) && answers.hobby.length > 0

  const scores = aiTools.map((tool) => {
    const id = tool.id
    let score = 0

    if (isLifeTrack) {
      score += getHobbyScore(answers.hobby!, id) * lifeWeights.hobby

      const deviceScore = (tool.matchingWeight.device as Record<string, number>)[answers.device ?? ''] ?? 0
      score += deviceScore * lifeWeights.device

      const literacyScore = (tool.matchingWeight.digitalLiteracy as Record<string, number>)[answers.digital_literacy ?? ''] ?? 0
      score += literacyScore * lifeWeights.digitalLiteracy
    } else {
      const occupationScore = (tool.matchingWeight.occupation as Record<string, number>)[answers.occupation_category ?? ''] ?? 0
      score += occupationScore * weights.occupation

      if (answers.occupation_category && answers.occupation_detail) {
        score += getOccupationDetailScore(answers.occupation_category, answers.occupation_detail, id) * weights.occupationDetail
      }

      if (answers.follow_up) {
        score += getFollowUpScore(answers.follow_up, id) * weights.followUp
      }

      const deviceScore = (tool.matchingWeight.device as Record<string, number>)[answers.device ?? ''] ?? 0
      score += deviceScore * weights.device

      const literacyScore = (tool.matchingWeight.digitalLiteracy as Record<string, number>)[answers.digital_literacy ?? ''] ?? 0
      score += literacyScore * weights.digitalLiteracy
    }

    if (answers.age) {
      score += getAgeBonus(answers.age, id)
    }

    const literacyScore = (tool.matchingWeight.digitalLiteracy as Record<string, number>)[answers.digital_literacy ?? ''] ?? 0
    return { id, score, literacyScore, tool }
  })

  const sorted = scores
    .sort((a, b) => b.score - a.score || b.literacyScore - a.literacyScore)
    .slice(0, 3)

  const templates = matchingRulesData.resultMessages.templates as Record<string, string>
  const occupationLabel = answers.hobby?.join('·') ?? answers.occupation_category ?? ''

  return sorted.map((s, index) => {
    const rank = (index + 1) as 1 | 2 | 3
    const msgTemplate = templates[s.id] ?? ''
    const resultMessage = msgTemplate
      .replace(/{occupation}/g, occupationLabel)
      .replace(/{concern}/g, answers.main_concern ?? '')

    return {
      rank,
      id: s.id,
      name: s.tool.name,
      badge: s.tool.badge,
      shortDescription: s.tool.shortDescription,
      strengths: s.tool.strengths,
      accessInfo: s.tool.accessInfo,
      resultMessage,
    }
  })
}
