export function detectConcernType(concern: string): 1 | 2 | 3 | 4 | 5 {
  const c = concern.trim()

  // Type 2: 번아웃·회피형 (유머보다 먼저 — "싫고 게임하고 싶음" = 2)
  const burnoutKeywords = ['싫', '귀찮', '하기 싫', '지겨', '하기싫']
  if (burnoutKeywords.some(k => c.includes(k))) return 2

  // Type 5: 엉뚱·유머형
  const funnyKeywords = ['로또', '복권', '잠이나', '게임']
  if (funnyKeywords.some(k => c.includes(k))) return 5

  // Type 4: 감성·고민형
  const emotionalKeywords = ['힘들', '지쳐', '걱정', '무서', '외롭', '슬프', '우울', '불안']
  if (emotionalKeywords.some(k => c.includes(k))) return 4

  // Type 3: 무관심·탐색형
  const vagueKeywords = ['모르겠', '없음', '별생각', '그냥', '뭐든', '아무거나']
  if (vagueKeywords.some(k => c.includes(k)) || c.length < 5) return 3

  return 1
}

export type PromptParams = {
  concernType: 1 | 2 | 3 | 4 | 5
  occupationOrHobby: string
  detail?: string
  followUp?: string
  recommendedAI: string
  concern: string
}

export function buildPromptText(params: PromptParams): string {
  const { concernType, occupationOrHobby, recommendedAI, concern, detail, followUp } = params
  const context = [occupationOrHobby, detail, followUp].filter(Boolean).join(', ')
  const tag = `[${recommendedAI}에 붙여넣기]`

  const instructions: Record<1 | 2 | 3 | 4 | 5, string> = {
    1: `당신은 ${recommendedAI} 전문가입니다.
${context} 사용자가 "${concern}" 문제를 해결하기 위해 ${recommendedAI}에서 바로 복사해 쓸 수 있는 한국어 프롬프트를 작성하세요.

조건:
- ${tag} 헤더를 첫 줄에 쓰세요
- 프롬프트는 바로 붙여넣을 수 있는 완성형이어야 합니다
- 자연스러운 한국어, 전문 용어 금지
- 3~5문장 이내
- 프롬프트 외 부가 설명은 쓰지 마세요`,

    2: `당신은 ${recommendedAI} 전문가입니다.
${context} 사용자가 "${concern}"이라고 했습니다. 하기 싫은 감정에 공감하는 짧은 멘트 1문장을 먼저 쓰고, 줄바꿈 후 ${tag} 헤더를 쓴 뒤, 저항감을 낮춘 가벼운 프롬프트를 작성하세요.

조건:
- 공감 멘트는 자연스럽고 짧게 (1문장)
- 프롬프트는 "딱 3줄만", "일단 이것만" 같은 가벼운 톤
- 전문 용어 금지, 150자 이내`,

    3: `당신은 ${recommendedAI} 전문가입니다.
${context} 사용자가 아직 AI로 뭘 할지 모르겠다고 합니다. "이거 한번 써봐요" 톤의 도입 멘트 1문장을 쓰고, 줄바꿈 후 ${tag} 헤더를 쓴 뒤, 오늘 당장 따라해볼 수 있는 초간단 일상 프롬프트를 작성하세요.

조건:
- 멘트는 부담 없고 친근하게
- 프롬프트는 일상적이고 구체적으로 (점심 추천, 날씨 등)
- 전문 용어 금지, 150자 이내`,

    4: `당신은 ${recommendedAI} 전문가입니다.
${context} 사용자가 "${concern}"이라는 고민을 털어놨습니다. 위로하는 짧은 공감 멘트 1문장을 먼저 쓰고, 줄바꿈 후 ${tag} 헤더를 쓴 뒤, 오늘 당장 쓸 수 있는 실용적인 프롬프트를 작성하세요.

조건:
- 공감 멘트는 따뜻하고 현실적으로
- 프롬프트는 고민과 직접 연결된 실용적 내용
- 전문 용어 금지, 150자 이내`,

    5: `당신은 ${recommendedAI} 전문가입니다.
사용자가 "${concern}"이라고 입력했습니다. AI도 못 도와주는 엉뚱한 요청임을 유머로 가볍게 받아치는 멘트 1문장을 쓰고, 줄바꿈 후 ${tag} 헤더를 쓴 뒤, ${context} 사용자에게 실제로 도움이 되는 프롬프트를 작성하세요.

조건:
- 유머 멘트는 짧고 친근하게 (이모지 1개 가능)
- 프롬프트는 실제 유용한 내용으로 착지
- 전문 용어 금지, 150자 이내`,
  }

  return instructions[concernType]
}
