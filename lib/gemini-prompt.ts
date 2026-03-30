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

export function buildSystemInstruction(params: PromptParams): string {
  const { concernType, occupationOrHobby, recommendedAI, concern, detail, followUp } = params
  const context = [occupationOrHobby, detail, followUp].filter(Boolean).join(', ')

  const systemBase = `당신은 ${recommendedAI} 전문가입니다.
반드시 JSON 형식으로만 응답하세요: {"comment":"도입멘트","prompt":"프롬프트","answer":"예시답변"}
- comment: 도입 멘트 (없으면 빈 문자열 "")
- prompt: ${recommendedAI}에 바로 붙여넣을 수 있는 완성형 한국어 프롬프트 (150자 이내)
- answer: 위 프롬프트에 대해 ${recommendedAI}가 작성할 만한 예시 답변 (3~5문장)`

  const typeInstructions: Record<1 | 2 | 3 | 4 | 5, string> = {
    1: `${context} 사용자가 "${concern}"라는 문제를 해결하려 합니다.
comment는 빈 문자열로 설정하고, prompt는 바로 복사해 쓸 수 있는 구체적인 프롬프트를 작성하세요.
전문 용어 금지, 자연스러운 한국어로 작성하세요.`,

    2: `${context} 사용자가 "${concern}"이라고 했습니다.
comment는 하기 싫은 감정에 공감하는 1문장으로 작성하고,
prompt는 "딱 3줄만", "일단 이것만" 같은 가벼운 톤으로 저항감을 낮춰 작성하세요.`,

    3: `${context} 사용자가 아직 AI로 뭘 할지 모르겠다고 합니다.
comment는 "이거 한번 써봐요" 톤의 친근한 1문장으로 작성하고,
prompt는 오늘 당장 따라해볼 수 있는 초간단 일상 프롬프트를 작성하세요.`,

    4: `${context} 사용자가 "${concern}"이라는 고민을 털어놨습니다.
comment는 따뜻하게 위로하는 1문장으로 작성하고,
prompt는 고민과 직접 연결된 실용적인 프롬프트를 작성하세요.`,

    5: `사용자가 "${concern}"이라고 입력했습니다.
comment는 AI도 못 도와주는 엉뚱한 요청임을 유머로 가볍게 받아치는 1문장으로 작성하고 (이모지 1개 가능),
prompt는 ${context} 사용자에게 실제로 도움이 되는 프롬프트로 착지시키세요.`,
  }

  return `${systemBase}\n\n${typeInstructions[concernType]}`
}
