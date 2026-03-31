import aiToolsData from '@/data/ai-tools.json'
import matchingRulesData from '@/data/matching-rules.json'
import type { Answers, RankedAI } from '@/lib/types'

const aiTools = aiToolsData as typeof aiToolsData
const rules = matchingRulesData.rules
const weights = matchingRulesData.weights
const lifeWeights = matchingRulesData.lifeWeights

const HOBBY_LABELS: Record<string, string> = {
  media: '영상·미디어',
  study: '공부·자기계발',
  cooking: '요리·살림',
  health: '건강·운동',
  travel: '여행·취미',
  finance: '재테크·투자',
  parenting: '육아·가족',
  shopping: '쇼핑·트렌드',
}

const OCCUPATION_LABELS: Record<string, string> = {
  student: '학생·수험생',
  jobseeker: '취준생·이직준비',
  office_worker: '직장인 (사무·전문직)',
  field_worker: '직장인 (현장·서비스직)',
  self_employed_owner: '자영업·소상공인',
  freelancer: '프리랜서·크리에이터',
  homemaker: '주부·육아',
  it: 'IT·개발·데이터',
}

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
