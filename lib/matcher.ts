import aiToolsData from '@/data/ai-tools.json'
import matchingRulesData from '@/data/matching-rules.json'
import type { Answers, RankedAI } from '@/lib/types'

const aiTools = aiToolsData as typeof aiToolsData
const rules = matchingRulesData.rules
const weights = matchingRulesData.weights

function getOccupationDetailScore(occupationCategory: string, occupationDetail: string, aiId: string): number {
  const categoryRules = (rules.occupationDetail as Record<string, Record<string, Record<string, number>>>)[occupationCategory]
  if (!categoryRules) return 0
  const detailRules = categoryRules[occupationDetail]
  if (!detailRules) return 0
  return detailRules[aiId] ?? 0
}

function getFollowUpScore(followUp: string, aiId: string): number {
  const followUpRules = (rules.followUp as Record<string, Record<string, number>>)[followUp]
  if (!followUpRules) return 0
  return followUpRules[aiId] ?? 0
}

function getAgeBonus(age: string, aiId: string): number {
  const ageBonusRules = (rules.ageBonus as Record<string, Record<string, number>>)[age]
  if (!ageBonusRules) return 0
  return ageBonusRules[aiId] ?? 0
}

export function calculateTopAIs(answers: Answers): RankedAI[] {
  const scores = aiTools.map((tool) => {
    const id = tool.id
    let score = 0

    // occupation (30%)
    const occupationScore = (tool.matchingWeight.occupation as Record<string, number>)[answers.occupation_category ?? ''] ?? 0
    score += occupationScore * weights.occupation

    // occupationDetail (20%)
    if (answers.occupation_category && answers.occupation_detail) {
      score += getOccupationDetailScore(answers.occupation_category, answers.occupation_detail, id) * weights.occupationDetail
    }

    // followUp (20%)
    if (answers.follow_up) {
      score += getFollowUpScore(answers.follow_up, id) * weights.followUp
    }

    // device (15%)
    const deviceScore = (tool.matchingWeight.device as Record<string, number>)[answers.device ?? ''] ?? 0
    score += deviceScore * weights.device

    // digitalLiteracy (15%)
    const literacyScore = (tool.matchingWeight.digitalLiteracy as Record<string, number>)[answers.digital_literacy ?? ''] ?? 0
    score += literacyScore * weights.digitalLiteracy

    // ageBonus (보정)
    if (answers.age) {
      score += getAgeBonus(answers.age, id)
    }

    return { id, score, literacyScore }
  })

  const sorted = scores
    .sort((a, b) => b.score - a.score || b.literacyScore - a.literacyScore)
    .slice(0, 3)

  const templates = matchingRulesData.resultMessages.templates as Record<string, string>

  return sorted.map((s, index) => {
    const tool = aiTools.find(t => t.id === s.id)!
    const rank = (index + 1) as 1 | 2 | 3
    const msgTemplate = templates[s.id] ?? ''
    const resultMessage = msgTemplate
      .replace(/{occupation}/g, answers.occupation_category ?? '')
      .replace(/{concern}/g, answers.main_concern ?? '')

    return {
      rank,
      id: s.id,
      name: tool.name,
      badge: tool.badge,
      shortDescription: tool.shortDescription,
      strengths: tool.strengths,
      accessInfo: tool.accessInfo,
      resultMessage,
    }
  })
}
