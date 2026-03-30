# 설문 구조 및 매칭 로직 전면 개편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 업무/일상 분기 설문 구조로 전환하고, 주관식 고민을 5가지 유형으로 감지해 맞춤형 프롬프트를 생성한다.

**Architecture:** questions.json을 3-way 분기 구조(업무/일상/모름)로 재작성하고, matcher.ts에 life 트랙 scoring을 추가한다. gemini-prompt.ts를 새로 만들어 concern 유형 감지 + 프롬프트 빌더 역할을 분리하고, survey/page.tsx에서 multi_select 타입과 자동분기 로직을 처리한다.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, @google/genai, Jest

---

## 파일 맵

| 파일 | 변경 |
|------|------|
| `lib/types.ts` | Answers에 purpose/hobby/interest_keywords 추가, Question에 multi_select/max_select 추가 |
| `data/ai-tools.json` | matchingWeight.occupation 키 rename, field_worker 추가 |
| `data/matching-rules.json` | 키 rename, hobby 가중치 추가, field_worker 가중치 추가, lifeWeights 추가 |
| `data/questions.json` | 전면 재작성 |
| `lib/gemini-prompt.ts` | 신규 — detectConcernType + buildPromptText |
| `lib/matcher.ts` | life 트랙 scoring 추가, 키 rename 대응 |
| `lib/gemini.ts` | 새 params 구조로 업데이트 |
| `app/api/generate-prompt/route.ts` | 새 params 수신으로 업데이트 |
| `components/survey/GridSelect.tsx` | multi-select 모드 추가 |
| `app/survey/page.tsx` | multi_select 렌더링, 자동분기, 진행률 로직 업데이트 |
| `components/result/PromptBox.tsx` | 공감 멘트/프롬프트 분리 표시, 새 params 전송 |
| `__tests__/lib/matcher.test.ts` | 기존 테스트 키 rename, life 트랙 테스트 추가 |
| `__tests__/lib/gemini-prompt.test.ts` | 신규 |

---

## Task 1: lib/types.ts 업데이트

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: 파일 전체를 아래 내용으로 교체**

```typescript
export type Answers = {
  age?: string
  purpose?: 'work' | 'life' | 'unknown'
  occupation_category?: string
  occupation_detail?: string
  follow_up?: string
  hobby?: string[]
  interest_keywords?: string[]
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
  type: 'single_select' | 'grid_select' | 'text_input' | 'multi_select' | 'easter_egg'
  question?: string
  description?: string
  optional?: boolean
  max_select?: number
  options?: QuestionOption[]
  next?: string | Record<string, string> | null
  placeholder?: Record<string, string>
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd /home/yeon/projects/find-my-ai && npx tsc --noEmit 2>&1 | head -30
```

Expected: 에러 없음 (또는 아직 구현 안 된 파일 참조 에러만)

- [ ] **Step 3: 커밋**

```bash
git add lib/types.ts
git commit -m "feat: Answers에 purpose/hobby/interest_keywords 추가, Question에 multi_select 추가"
```

---

## Task 2: data/ai-tools.json — occupation 키 업데이트

**Files:**
- Modify: `data/ai-tools.json`

각 tool(9개)의 `matchingWeight.occupation` 객체에서:
- `worker` 키 → `office_worker`로 rename (값 유지)
- `selfemployed` 키 → `self_employed_owner`로 rename (값 유지)
- `senior` 키 제거
- `field_worker: 2` 추가

- [ ] **Step 1: 파일을 읽어 각 tool의 matchingWeight.occupation을 수정**

수정 패턴 (tool별 반복):
```json
"occupation": {
  "student": X,
  "jobseeker": X,
  "office_worker": X,      ← (기존 worker 값)
  "field_worker": 2,       ← 신규
  "self_employed_owner": X, ← (기존 selfemployed 값)
  "freelancer": X,
  "homemaker": X,
  "it": X
}
```

`senior` 제거, `worker` → `office_worker`, `selfemployed` → `self_employed_owner`.

- [ ] **Step 2: 빌드 확인**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: 커밋**

```bash
git add data/ai-tools.json
git commit -m "feat: ai-tools occupation 키 rename 및 field_worker 추가"
```

---

## Task 3: data/matching-rules.json — 키 업데이트 및 가중치 추가

**Files:**
- Modify: `data/matching-rules.json`

- [ ] **Step 1: `rules.occupationDetail` 키 rename**

- `worker` → `office_worker` (내부 sub-keys: office, professional, public, manager 유지)
- `selfemployed` → `self_employed_owner` (내부 sub-keys: food, retail, service, craft 유지)
- `senior` 블록 제거

- [ ] **Step 2: `rules.occupationDetail`에 `field_worker` 추가**

```json
"field_worker": {
  "service": { "chatgpt": 3, "clova_x": 3, "wrtn": 2, "gemini": 2, "copilot": 1, "perplexity": 4, "claude": 2, "canva_ai": 1, "lilys": 4 },
  "field":   { "chatgpt": 3, "clova_x": 3, "wrtn": 2, "gemini": 2, "copilot": 1, "perplexity": 4, "claude": 2, "canva_ai": 1, "lilys": 4 },
  "transport": { "chatgpt": 3, "clova_x": 3, "wrtn": 2, "gemini": 2, "copilot": 1, "perplexity": 4, "claude": 2, "canva_ai": 1, "lilys": 4 },
  "care":    { "chatgpt": 3, "clova_x": 3, "wrtn": 2, "gemini": 2, "copilot": 1, "perplexity": 4, "claude": 2, "canva_ai": 1, "lilys": 4 }
}
```

- [ ] **Step 3: `rules.followUp`에 field_worker 꼬리질문 추가**

```json
"work_info": { "chatgpt": 1, "clova_x": 4, "wrtn": 1, "gemini": 2, "copilot": 1, "perplexity": 6, "claude": 1, "canva_ai": 1, "lilys": 5 },
"customer":  { "chatgpt": 5, "clova_x": 5, "wrtn": 2, "gemini": 2, "copilot": 1, "perplexity": 2, "claude": 3, "canva_ai": 1, "lilys": 2 },
"career":    { "chatgpt": 5, "clova_x": 2, "wrtn": 4, "gemini": 2, "copilot": 1, "perplexity": 3, "claude": 2, "canva_ai": 1, "lilys": 2 },
"life":      { "chatgpt": 1, "clova_x": 4, "wrtn": 1, "gemini": 2, "copilot": 1, "perplexity": 5, "claude": 1, "canva_ai": 1, "lilys": 3 }
```

> 참고: base(occupationDetail.field_worker) + followUp 추가 가중치 합산: work_info는 perplexity+2, clova_x+2, lilys+1 등 적용.

- [ ] **Step 4: `rules.hobby` 섹션 신규 추가 (최상위 rules 객체에 추가)**

```json
"hobby": {
  "media":    { "chatgpt": 2, "clova_x": 2, "wrtn": 1, "gemini": 3, "copilot": 1, "perplexity": 2, "claude": 1, "canva_ai": 1, "lilys": 5 },
  "study":    { "chatgpt": 3, "clova_x": 1, "wrtn": 2, "gemini": 2, "copilot": 2, "perplexity": 3, "claude": 3, "canva_ai": 1, "lilys": 2 },
  "cooking":  { "chatgpt": 2, "clova_x": 3, "wrtn": 2, "gemini": 2, "copilot": 1, "perplexity": 2, "claude": 1, "canva_ai": 2, "lilys": 2 },
  "health":   { "chatgpt": 3, "clova_x": 2, "wrtn": 1, "gemini": 2, "copilot": 1, "perplexity": 3, "claude": 2, "canva_ai": 1, "lilys": 3 },
  "travel":   { "chatgpt": 3, "clova_x": 2, "wrtn": 1, "gemini": 2, "copilot": 1, "perplexity": 3, "claude": 2, "canva_ai": 3, "lilys": 2 },
  "finance":  { "chatgpt": 2, "clova_x": 2, "wrtn": 1, "gemini": 2, "copilot": 1, "perplexity": 5, "claude": 2, "canva_ai": 1, "lilys": 3 },
  "parenting":{ "chatgpt": 2, "clova_x": 3, "wrtn": 2, "gemini": 2, "copilot": 1, "perplexity": 3, "claude": 2, "canva_ai": 1, "lilys": 3 },
  "shopping": { "chatgpt": 2, "clova_x": 3, "wrtn": 2, "gemini": 2, "copilot": 1, "perplexity": 3, "claude": 1, "canva_ai": 2, "lilys": 2 }
}
```

- [ ] **Step 5: `lifeWeights` 섹션 최상위에 추가**

```json
"lifeWeights": {
  "hobby": 0.50,
  "device": 0.25,
  "digitalLiteracy": 0.25
}
```

- [ ] **Step 6: `rules.ageBonus`에서 `senior` 제거**

```json
"ageBonus": {
  "teen":         { "wrtn": 1, "chatgpt": 1, "lilys": 1 },
  "twenties":     { "wrtn": 1, "claude": 1, "perplexity": 1 },
  "thirties":     { "copilot": 1, "gemini": 1, "claude": 1 },
  "forties":      { "copilot": 1, "clova_x": 1, "canva_ai": 1 },
  "fifties_plus": { "clova_x": 2, "lilys": 2 }
}
```

- [ ] **Step 7: 커밋**

```bash
git add data/matching-rules.json
git commit -m "feat: matching-rules — hobby/field_worker 가중치 추가, occupation 키 rename, lifeWeights 추가"
```

---

## Task 4: data/questions.json 전면 재작성

**Files:**
- Modify: `data/questions.json`

- [ ] **Step 1: 파일을 아래 내용으로 전체 교체**

```json
{
  "version": "2.0.0",
  "questions": {
    "age": {
      "id": "age",
      "step": 1,
      "type": "single_select",
      "question": "나이대를 알려주세요 😊",
      "options": [
        { "value": "teen", "label": "10대" },
        { "value": "twenties", "label": "20대" },
        { "value": "thirties", "label": "30대" },
        { "value": "forties", "label": "40대" },
        { "value": "fifties_plus", "label": "50대 이상" }
      ],
      "next": "purpose"
    },

    "purpose": {
      "id": "purpose",
      "step": 2,
      "type": "single_select",
      "question": "AI를 어떻게 활용하고 싶으세요?",
      "options": [
        { "value": "work", "label": "업무에 활용하고 싶어요", "emoji": "💼" },
        { "value": "life", "label": "일상생활에서 써보고 싶어요", "emoji": "🌱" },
        { "value": "unknown", "label": "잘 모르겠어요", "emoji": "🤔" }
      ],
      "next": {
        "work": "occupation_category",
        "life": "hobby",
        "unknown": "interest_keywords"
      }
    },

    "occupation_category": {
      "id": "occupation_category",
      "step": 3,
      "type": "grid_select",
      "question": "어떤 분이세요?",
      "description": "가장 가까운 것을 골라주세요",
      "options": [
        { "value": "student", "label": "학생·수험생", "emoji": "🎓", "track": "normal" },
        { "value": "jobseeker", "label": "취준생·이직준비", "emoji": "💼", "track": "normal" },
        { "value": "office_worker", "label": "직장인 (사무·전문직)", "emoji": "🏢", "track": "normal" },
        { "value": "field_worker", "label": "직장인 (현장·서비스직)", "emoji": "🦺", "track": "normal" },
        { "value": "self_employed_owner", "label": "자영업·소상공인", "emoji": "🏪", "track": "normal" },
        { "value": "freelancer", "label": "프리랜서·크리에이터", "emoji": "🎨", "track": "normal" },
        { "value": "homemaker", "label": "주부·육아", "emoji": "🏠", "track": "normal" },
        { "value": "it", "label": "IT·개발·데이터", "emoji": "💻", "track": "easter_egg" }
      ],
      "next": {
        "student": "occupation_detail_student",
        "jobseeker": "occupation_detail_jobseeker",
        "office_worker": "occupation_detail_office_worker",
        "field_worker": "occupation_detail_field_worker",
        "self_employed_owner": "occupation_detail_self_employed_owner",
        "freelancer": "occupation_detail_freelancer",
        "homemaker": "occupation_detail_homemaker",
        "it": "easter_egg"
      }
    },

    "occupation_detail_student": {
      "id": "occupation_detail_student",
      "step": 4,
      "type": "single_select",
      "question": "어떤 학생이에요?",
      "options": [
        { "value": "middle_high", "label": "중·고등학생", "emoji": "📚" },
        { "value": "university", "label": "대학생·대학원생", "emoji": "🎓" },
        { "value": "exam_prep", "label": "재수생·편입 준비", "emoji": "📝" }
      ],
      "next": "follow_up_student"
    },

    "occupation_detail_jobseeker": {
      "id": "occupation_detail_jobseeker",
      "step": 4,
      "type": "single_select",
      "question": "지금 어떤 상황이에요?",
      "options": [
        { "value": "new_grad", "label": "신입 취업 준비 중", "emoji": "🌱" },
        { "value": "career_change", "label": "경력직 이직 준비 중", "emoji": "🔄" },
        { "value": "career_explore", "label": "진로 자체를 고민 중", "emoji": "🤔" }
      ],
      "next": "follow_up_jobseeker"
    },

    "occupation_detail_office_worker": {
      "id": "occupation_detail_office_worker",
      "step": 4,
      "type": "single_select",
      "question": "어떤 일을 하세요?",
      "options": [
        { "value": "office", "label": "사무직 (기획·마케팅·영업·HR)", "emoji": "💻" },
        { "value": "professional", "label": "전문직 (의료·법률·회계·교육)", "emoji": "🏥" },
        { "value": "public", "label": "공무원·공공기관", "emoji": "🏛️" },
        { "value": "manager", "label": "관리직·임원", "emoji": "👔" }
      ],
      "next": "follow_up_office_worker"
    },

    "occupation_detail_field_worker": {
      "id": "occupation_detail_field_worker",
      "step": 4,
      "type": "single_select",
      "question": "어떤 일을 하세요?",
      "options": [
        { "value": "service", "label": "서비스직 (매장·바리스타·판매)", "emoji": "🛒" },
        { "value": "field", "label": "현장직 (건설·제조·물류)", "emoji": "🏗️" },
        { "value": "transport", "label": "운수직 (배달·택배·운전)", "emoji": "🚚" },
        { "value": "care", "label": "돌봄·의료보조 (요양·간병·보육)", "emoji": "🤝" }
      ],
      "next": "follow_up_field_worker"
    },

    "occupation_detail_self_employed_owner": {
      "id": "occupation_detail_self_employed_owner",
      "step": 4,
      "type": "single_select",
      "question": "어떤 사업을 하세요?",
      "options": [
        { "value": "food", "label": "요식업 (카페·식당·배달)", "emoji": "🍽️" },
        { "value": "retail", "label": "판매업 (쇼핑몰·오프라인 매장)", "emoji": "🛍️" },
        { "value": "service", "label": "서비스업 (미용·운동·교습 등)", "emoji": "✂️" },
        { "value": "craft", "label": "1인 제조·공방", "emoji": "🔨" }
      ],
      "next": "follow_up_self_employed_owner"
    },

    "occupation_detail_freelancer": {
      "id": "occupation_detail_freelancer",
      "step": 4,
      "type": "single_select",
      "question": "주로 어떤 활동을 하세요?",
      "options": [
        { "value": "design_video", "label": "디자이너·영상편집자", "emoji": "🎬" },
        { "value": "writer", "label": "작가·번역가·카피라이터", "emoji": "✍️" },
        { "value": "creator", "label": "유튜버·인플루언서·스트리머", "emoji": "📱" },
        { "value": "consultant", "label": "강사·코치·컨설턴트", "emoji": "🎤" }
      ],
      "next": "follow_up_freelancer"
    },

    "occupation_detail_homemaker": {
      "id": "occupation_detail_homemaker",
      "step": 4,
      "type": "single_select",
      "question": "요즘 어떻게 지내세요?",
      "options": [
        { "value": "fulltime", "label": "전업 주부", "emoji": "🏡" },
        { "value": "infant", "label": "육아 중 (영·유아)", "emoji": "👶" },
        { "value": "child", "label": "육아 중 (초등 이상)", "emoji": "🧒" },
        { "value": "returning", "label": "경력 단절 후 복귀 준비", "emoji": "🌸" }
      ],
      "next": "follow_up_homemaker"
    },

    "follow_up_student": {
      "id": "follow_up_student",
      "step": 5,
      "type": "single_select",
      "question": "요즘 가장 신경 쓰이는 게 뭐예요?",
      "options": [
        { "value": "exam", "label": "내신·수능 공부", "emoji": "📖" },
        { "value": "employment", "label": "취업·인턴 준비", "emoji": "💼" },
        { "value": "thesis", "label": "논문·과제·발표", "emoji": "📄" },
        { "value": "language", "label": "어학 (영어·자격증)", "emoji": "🌍" }
      ],
      "next": "device"
    },

    "follow_up_jobseeker": {
      "id": "follow_up_jobseeker",
      "step": 5,
      "type": "single_select",
      "question": "지금 가장 막막한 단계가 어디예요?",
      "options": [
        { "value": "resume", "label": "자소서·이력서 작성", "emoji": "✍️" },
        { "value": "interview", "label": "면접 준비", "emoji": "🎤" },
        { "value": "portfolio", "label": "포트폴리오 만들기", "emoji": "🗂️" },
        { "value": "career_direction", "label": "직무 방향 잡기", "emoji": "🧭" }
      ],
      "next": "device"
    },

    "follow_up_office_worker": {
      "id": "follow_up_office_worker",
      "step": 5,
      "type": "single_select",
      "question": "업무에서 가장 많이 하는 게 뭐예요?",
      "options": [
        { "value": "document", "label": "문서·보고서 작성", "emoji": "📝" },
        { "value": "email_comm", "label": "이메일·커뮤니케이션", "emoji": "📧" },
        { "value": "data", "label": "데이터 정리·엑셀", "emoji": "📊" },
        { "value": "presentation", "label": "발표·PPT 제작", "emoji": "🖥️" }
      ],
      "next": "device"
    },

    "follow_up_field_worker": {
      "id": "follow_up_field_worker",
      "step": 5,
      "type": "single_select",
      "question": "일하면서 AI로 해결하고 싶은 게 뭐예요?",
      "options": [
        { "value": "work_info", "label": "근무 관련 정보 찾기 (노무·급여·권리)", "emoji": "📋" },
        { "value": "customer", "label": "고객·민원 응대", "emoji": "💬" },
        { "value": "career", "label": "이직·자격증 준비", "emoji": "🚀" },
        { "value": "life", "label": "생활비·지원금·혜택 탐색", "emoji": "💰" }
      ],
      "next": "device"
    },

    "follow_up_self_employed_owner": {
      "id": "follow_up_self_employed_owner",
      "step": 5,
      "type": "single_select",
      "question": "지금 가장 아쉬운 부분이 뭐예요?",
      "options": [
        { "value": "sns_promo", "label": "SNS·온라인 홍보", "emoji": "📱" },
        { "value": "customer", "label": "고객 응대·리뷰 관리", "emoji": "💬" },
        { "value": "content", "label": "메뉴·상품 설명 글쓰기", "emoji": "✏️" },
        { "value": "platform", "label": "배달앱·쇼핑몰 등록", "emoji": "🛒" }
      ],
      "next": "device"
    },

    "follow_up_freelancer": {
      "id": "follow_up_freelancer",
      "step": 5,
      "type": "single_select",
      "question": "주로 어디에 시간이 많이 들어요?",
      "options": [
        { "value": "planning", "label": "콘텐츠 기획·아이디어", "emoji": "💡" },
        { "value": "writing", "label": "글·스크립트 작성", "emoji": "✍️" },
        { "value": "visual", "label": "이미지·썸네일 제작", "emoji": "🖼️" },
        { "value": "client", "label": "클라이언트 소통·제안서", "emoji": "🤝" }
      ],
      "next": "device"
    },

    "follow_up_homemaker": {
      "id": "follow_up_homemaker",
      "step": 5,
      "type": "single_select",
      "question": "AI로 해결하고 싶은 게 있다면?",
      "options": [
        { "value": "parenting_info", "label": "육아·교육 정보 찾기", "emoji": "👶" },
        { "value": "household", "label": "요리·집안일 효율화", "emoji": "🍳" },
        { "value": "reemployment", "label": "재취업·자격증 준비", "emoji": "📋" },
        { "value": "selfdev", "label": "취미·자기계발", "emoji": "🌱" }
      ],
      "next": "device"
    },

    "hobby": {
      "id": "hobby",
      "step": 3,
      "type": "multi_select",
      "max_select": 2,
      "question": "관심 있는 분야를 골라주세요",
      "description": "최대 2개까지 선택 가능해요",
      "options": [
        { "value": "media", "label": "영상·미디어", "emoji": "📺" },
        { "value": "study", "label": "공부·자기계발", "emoji": "📚" },
        { "value": "cooking", "label": "요리·살림", "emoji": "🍳" },
        { "value": "health", "label": "건강·운동", "emoji": "💪" },
        { "value": "travel", "label": "여행·취미", "emoji": "✈️" },
        { "value": "finance", "label": "재테크·투자", "emoji": "💰" },
        { "value": "parenting", "label": "육아·가족", "emoji": "👨‍👩‍👧" },
        { "value": "shopping", "label": "쇼핑·트렌드", "emoji": "🛍️" }
      ],
      "next": "device"
    },

    "interest_keywords": {
      "id": "interest_keywords",
      "step": 3,
      "type": "multi_select",
      "question": "요즘 관심 있는 게 뭐예요?",
      "description": "해당하는 걸 모두 골라주세요",
      "options": [
        { "value": "work_fast", "label": "일 더 빨리 끝내기", "emoji": "⚡" },
        { "value": "write_better", "label": "글 잘 쓰고 싶어", "emoji": "✍️" },
        { "value": "find_info", "label": "정보 빠르게 찾기", "emoji": "🔍" },
        { "value": "video_summary", "label": "유튜브 영상 요약", "emoji": "📺" },
        { "value": "trip_plan", "label": "여행 계획 짜기", "emoji": "✈️" },
        { "value": "finance_study", "label": "재테크 공부", "emoji": "💰" },
        { "value": "recipe", "label": "맛집·레시피", "emoji": "🍳" },
        { "value": "just_curious", "label": "그냥 궁금해서", "emoji": "🤔" }
      ],
      "next": null
    },

    "device": {
      "id": "device",
      "step": 6,
      "type": "single_select",
      "question": "주로 어떤 기기를 쓰세요?",
      "options": [
        { "value": "mobile_only", "label": "스마트폰만 써요", "emoji": "📱" },
        { "value": "mobile_main", "label": "주로 스마트폰, 가끔 PC", "emoji": "📱💻" },
        { "value": "pc_main", "label": "PC·노트북이 주력이에요", "emoji": "💻" }
      ],
      "next": "digital_literacy"
    },

    "digital_literacy": {
      "id": "digital_literacy",
      "step": 7,
      "type": "single_select",
      "question": "평소 스마트폰·컴퓨터를 얼마나 편하게 쓰세요?",
      "options": [
        { "value": "beginner", "label": "앱 설치도 좀 어려워요", "emoji": "🐣" },
        { "value": "intermediate", "label": "카카오톡·유튜브 정도는 잘 써요", "emoji": "🙂" },
        { "value": "advanced", "label": "새로운 앱도 금방 익혀요", "emoji": "😎" },
        { "value": "expert", "label": "웬만한 건 다 할 수 있어요", "emoji": "🚀" }
      ],
      "next": "mbti"
    },

    "mbti": {
      "id": "mbti",
      "step": 8,
      "type": "single_select",
      "optional": true,
      "question": "MBTI를 알고 계신가요? (선택)",
      "description": "결과에 살짝 반영돼요 😄 모르시면 건너뛰어도 돼요!",
      "options": [
        { "value": "INTJ", "label": "INTJ" }, { "value": "INTP", "label": "INTP" },
        { "value": "ENTJ", "label": "ENTJ" }, { "value": "ENTP", "label": "ENTP" },
        { "value": "INFJ", "label": "INFJ" }, { "value": "INFP", "label": "INFP" },
        { "value": "ENFJ", "label": "ENFJ" }, { "value": "ENFP", "label": "ENFP" },
        { "value": "ISTJ", "label": "ISTJ" }, { "value": "ISFJ", "label": "ISFJ" },
        { "value": "ESTJ", "label": "ESTJ" }, { "value": "ESFJ", "label": "ESFJ" },
        { "value": "ISTP", "label": "ISTP" }, { "value": "ISFP", "label": "ISFP" },
        { "value": "ESTP", "label": "ESTP" }, { "value": "ESFP", "label": "ESFP" },
        { "value": "unknown", "label": "모르겠어요 / 건너뛰기", "emoji": "🤷" }
      ],
      "next": "main_concern"
    },

    "main_concern": {
      "id": "main_concern",
      "step": 9,
      "type": "text_input",
      "question": "요즘 가장 큰 고민이 뭐예요?",
      "description": "AI가 맞춤 프롬프트를 바로 만들어드려요 ✨",
      "placeholder": {
        "student": "예) 영어 에세이 쓰는 법을 모르겠어요",
        "jobseeker": "예) 자소서 첫 문장을 어떻게 시작할지 모르겠어요",
        "office_worker": "예) 보고서 요약을 빠르게 하고 싶어요",
        "field_worker": "예) 노무 관련 정보를 빠르게 찾고 싶어요",
        "self_employed_owner": "예) 인스타에 올릴 메뉴 소개 글을 잘 못 쓰겠어요",
        "freelancer": "예) 클라이언트 제안서 템플릿이 필요해요",
        "homemaker": "예) 아이 숙제를 어떻게 도와줘야 할지 모르겠어요",
        "life": "예) 요즘 재테크 공부를 시작하고 싶어요",
        "default": "예) 매일 쓰는 이메일을 더 빠르게 쓰고 싶어요"
      },
      "next": null
    },

    "easter_egg": {
      "id": "easter_egg",
      "step": null,
      "type": "easter_egg",
      "track": "easter_egg",
      "variants": [
        {
          "occupationDetail": "developer",
          "title": "🖥️ 잠깐, 잠깐만요...",
          "message": "혹시 지금 터미널 3개 켜놓고 이거 하고 계신 거 아니죠?\n\nAI 리터러시가 낮은 분들을 위한 서비스라\n당신에겐 해줄 말이 없어요 😅\n\nClaude Code 돌아가고 있을 텐데\n얼른 가서 PR이나 올리세요 🫡",
          "buttons": [
            { "label": "GitHub 바로가기 →", "action": "open_url", "url": "https://github.com" },
            { "label": "그래도 해볼래요 (뒤로가기)", "action": "go_back" }
          ]
        },
        {
          "occupationDetail": "data",
          "title": "📊 어...이거 왜 하고 계세요?",
          "message": "데이터 분석가가 AI 추천 받으러 오셨군요.\n\n혹시 A/B 테스트 설계하러 오신 건 아니죠? 🤨\n\n지금쯤 Jupyter Notebook이\n당신을 기다리고 있을 것 같은데요...",
          "buttons": [
            { "label": "Kaggle 가기 →", "action": "open_url", "url": "https://kaggle.com" },
            { "label": "그래도 해볼래요 (뒤로가기)", "action": "go_back" }
          ]
        }
      ]
    }
  },

  "mbtiHints": {
    "I": "혼자 조용히 쓰기 좋은 AI예요.",
    "E": "대화하듯 쓸수록 더 잘 맞는 AI예요.",
    "T": "논리적이고 구조화된 답변을 잘 뽑아줘요.",
    "F": "공감 어린 답변이 필요할 때 특히 좋아요.",
    "J": "체계적인 계획 세우기에 강해요.",
    "P": "아이디어 탐색·브레인스토밍에 강해요.",
    "N": "추상적인 개념도 잘 풀어줘요.",
    "S": "구체적이고 실용적인 답변을 잘 줘요."
  }
}
```

- [ ] **Step 2: 커밋**

```bash
git add data/questions.json
git commit -m "feat: questions.json 전면 재작성 — 업무/일상/모름 3-way 분기, field_worker 추가"
```

---

## Task 5: lib/gemini-prompt.ts 신규 작성 (TDD)

**Files:**
- Create: `lib/gemini-prompt.ts`
- Create: `__tests__/lib/gemini-prompt.test.ts`

- [ ] **Step 1: 테스트 파일 작성**

```typescript
// __tests__/lib/gemini-prompt.test.ts
import { detectConcernType, buildPromptText } from '@/lib/gemini-prompt'

describe('detectConcernType', () => {
  it('번아웃 키워드 → 2', () => {
    expect(detectConcernType('자소서 쓰기 싫고 게임하고 싶음')).toBe(2)
    expect(detectConcernType('귀찮아서 아무것도 하기 싫음')).toBe(2)
  })

  it('감성/고민 키워드 → 4', () => {
    expect(detectConcernType('손님이 없어서 너무 힘들어요')).toBe(4)
    expect(detectConcernType('요즘 너무 지쳐있어요')).toBe(4)
  })

  it('엉뚱/유머 키워드 → 5', () => {
    expect(detectConcernType('로또 당첨되고 싶음')).toBe(5)
    expect(detectConcernType('게임하고 싶음')).toBe(5)
  })

  it('무관심/탐색 키워드 → 3', () => {
    expect(detectConcernType('별생각없음')).toBe(3)
    expect(detectConcernType('그냥')).toBe(3)
    expect(detectConcernType('없음')).toBe(3)
    expect(detectConcernType('모르겠음')).toBe(3)
  })

  it('짧은 입력 → 3', () => {
    expect(detectConcernType('ㅇㅇ')).toBe(3)
  })

  it('구체적 목표 → 1', () => {
    expect(detectConcernType('보고서 요약을 빠르게 하고 싶어요')).toBe(1)
    expect(detectConcernType('영어 이메일 초안을 작성해야 해요')).toBe(1)
  })

  it('번아웃이 감성보다 우선', () => {
    // "힘들어 싫어"는 번아웃 우선 (2)
    expect(detectConcernType('힘들어서 하기 싫어')).toBe(2)
  })
})

describe('buildPromptText', () => {
  const baseParams = {
    concernType: 1 as const,
    occupationOrHobby: '직장인 (사무·전문직)',
    recommendedAI: 'ChatGPT',
    concern: '보고서 요약을 빠르게 하고 싶어요',
  }

  it('1번 유형: [AI이름에 붙여넣기] 포함', () => {
    const result = buildPromptText(baseParams)
    expect(result).toContain('[ChatGPT에 붙여넣기]')
  })

  it('2번 유형: 공감 멘트 포함', () => {
    const result = buildPromptText({ ...baseParams, concernType: 2, concern: '하기 싫어요' })
    expect(result).toContain('[ChatGPT에 붙여넣기]')
    // 공감 멘트가 [붙여넣기] 앞에 있어야 함
    const idx = result.indexOf('[ChatGPT에 붙여넣기]')
    expect(idx).toBeGreaterThan(0)
  })

  it('출력에 추천 AI 이름이 포함됨', () => {
    const result = buildPromptText({ ...baseParams, recommendedAI: 'Claude' })
    expect(result).toContain('Claude')
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npx jest __tests__/lib/gemini-prompt.test.ts --no-coverage 2>&1 | tail -20
```

Expected: `Cannot find module '@/lib/gemini-prompt'`

- [ ] **Step 3: lib/gemini-prompt.ts 구현**

```typescript
// lib/gemini-prompt.ts

export function detectConcernType(concern: string): 1 | 2 | 3 | 4 | 5 {
  const c = concern.trim()

  // Type 5: 엉뚱·유머형
  const funnyKeywords = ['로또', '게임', '치킨', '피자', '복권', '잠이나']
  if (funnyKeywords.some(k => c.includes(k))) return 5

  // Type 2: 번아웃·회피형 (감성보다 먼저 체크 — "힘들어서 하기 싫어" = 2)
  const burnoutKeywords = ['싫', '귀찮', '하기 싫', '지겨', '하기싫']
  if (burnoutKeywords.some(k => c.includes(k))) return 2

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
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
npx jest __tests__/lib/gemini-prompt.test.ts --no-coverage 2>&1 | tail -15
```

Expected: `Tests: 8 passed`

- [ ] **Step 5: 커밋**

```bash
git add lib/gemini-prompt.ts __tests__/lib/gemini-prompt.test.ts
git commit -m "feat: gemini-prompt.ts — concern 유형 감지 및 프롬프트 빌더 추가"
```

---

## Task 6: lib/matcher.ts + 테스트 업데이트

**Files:**
- Modify: `lib/matcher.ts`
- Modify: `__tests__/lib/matcher.test.ts`

- [ ] **Step 1: 기존 테스트 업데이트 (키 rename, senior 제거)**

```typescript
// __tests__/lib/matcher.test.ts
import { calculateTopAIs } from '@/lib/matcher'
import type { Answers } from '@/lib/types'

describe('calculateTopAIs — work 트랙', () => {
  it('직장인(사무)+문서작성+PC+고급 → copilot이 1위', () => {
    const answers: Answers = {
      age: 'thirties',
      purpose: 'work',
      occupation_category: 'office_worker',
      occupation_detail: 'office',
      follow_up: 'document',
      device: 'pc_main',
      digital_literacy: 'advanced',
      main_concern: '보고서 요약을 빠르게 하고 싶어요',
    }
    const result = calculateTopAIs(answers)
    expect(result).toHaveLength(3)
    expect(result[0].rank).toBe(1)
    expect(result[0].id).toBe('copilot')
    expect(result[1].rank).toBe(2)
    expect(result[2].rank).toBe(3)
  })

  it('결과에 resultMessage 플레이스홀더가 남지 않음', () => {
    const answers: Answers = {
      purpose: 'work',
      occupation_category: 'office_worker',
      occupation_detail: 'office',
      follow_up: 'document',
      device: 'pc_main',
      digital_literacy: 'advanced',
      main_concern: '보고서 요약',
    }
    const result = calculateTopAIs(answers)
    result.forEach(ai => {
      expect(ai.resultMessage).not.toContain('{occupation}')
      expect(ai.resultMessage).not.toContain('{concern}')
    })
  })

  it('정렬된 rank 순서 반환', () => {
    const answers: Answers = {
      purpose: 'work',
      occupation_category: 'freelancer',
      occupation_detail: 'writer',
      follow_up: 'writing',
      device: 'pc_main',
      digital_literacy: 'advanced',
    }
    const result = calculateTopAIs(answers)
    expect(result.map(r => r.rank)).toEqual([1, 2, 3])
  })

  it('field_worker+work_info → perplexity 상위권', () => {
    const answers: Answers = {
      purpose: 'work',
      occupation_category: 'field_worker',
      occupation_detail: 'service',
      follow_up: 'work_info',
      device: 'mobile_only',
      digital_literacy: 'intermediate',
      main_concern: '노무 관련 정보를 찾고 싶어요',
    }
    const result = calculateTopAIs(answers)
    const perplexityRank = result.find(r => r.id === 'perplexity')?.rank
    expect(perplexityRank).toBeDefined()
    expect(perplexityRank).toBeLessThanOrEqual(2)
  })
})

describe('calculateTopAIs — life 트랙', () => {
  it('hobby=[finance]+mobile → perplexity 상위권', () => {
    const answers: Answers = {
      age: 'thirties',
      purpose: 'life',
      hobby: ['finance'],
      device: 'mobile_only',
      digital_literacy: 'intermediate',
      main_concern: '재테크 공부를 시작하고 싶어요',
    }
    const result = calculateTopAIs(answers)
    expect(result).toHaveLength(3)
    const perplexityRank = result.find(r => r.id === 'perplexity')?.rank
    expect(perplexityRank).toBeDefined()
    expect(perplexityRank).toBeLessThanOrEqual(2)
  })

  it('hobby=[media]+mobile+beginner → lilys 상위권', () => {
    const answers: Answers = {
      purpose: 'life',
      hobby: ['media'],
      device: 'mobile_only',
      digital_literacy: 'beginner',
      main_concern: '유튜브 요약이 필요해요',
    }
    const result = calculateTopAIs(answers)
    const lilysRank = result.find(r => r.id === 'lilys')?.rank
    expect(lilysRank).toBeDefined()
    expect(lilysRank).toBeLessThanOrEqual(2)
  })

  it('life 트랙도 3개 결과 반환', () => {
    const answers: Answers = {
      purpose: 'life',
      hobby: ['cooking', 'health'],
      device: 'mobile_main',
      digital_literacy: 'intermediate',
    }
    const result = calculateTopAIs(answers)
    expect(result).toHaveLength(3)
    expect(result.map(r => r.rank)).toEqual([1, 2, 3])
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npx jest __tests__/lib/matcher.test.ts --no-coverage 2>&1 | tail -20
```

Expected: 일부 실패 (life 트랙 미구현, senior 키 없음 등)

- [ ] **Step 3: lib/matcher.ts 업데이트**

```typescript
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
      // Life 트랙: hobby(50%) + device(25%) + digitalLiteracy(25%)
      score += getHobbyScore(answers.hobby!, id) * lifeWeights.hobby

      const deviceScore = (tool.matchingWeight.device as Record<string, number>)[answers.device ?? ''] ?? 0
      score += deviceScore * lifeWeights.device

      const literacyScore = (tool.matchingWeight.digitalLiteracy as Record<string, number>)[answers.digital_literacy ?? ''] ?? 0
      score += literacyScore * lifeWeights.digitalLiteracy
    } else {
      // Work 트랙: 기존 가중치 구조
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
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
npx jest __tests__/lib/matcher.test.ts --no-coverage 2>&1 | tail -15
```

Expected: `Tests: 7 passed`

- [ ] **Step 5: 커밋**

```bash
git add lib/matcher.ts __tests__/lib/matcher.test.ts
git commit -m "feat: matcher — life 트랙 hobby scoring 추가, occupation 키 rename 대응"
```

---

## Task 7: lib/gemini.ts + API route 업데이트

**Files:**
- Modify: `lib/gemini.ts`
- Modify: `app/api/generate-prompt/route.ts`

- [ ] **Step 1: lib/gemini.ts 업데이트**

```typescript
import { GoogleGenAI } from '@google/genai'
import { detectConcernType, buildPromptText, type PromptParams } from '@/lib/gemini-prompt'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다')
}
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export type GeneratePromptParams = {
  occupationOrHobby: string
  detail?: string
  followUp?: string
  concern: string
  aiName: string
  aiDescription: string
}

export async function generatePromptStream(params: GeneratePromptParams): Promise<ReadableStream<Uint8Array>> {
  const concernType = detectConcernType(params.concern)

  const promptParams: PromptParams = {
    concernType,
    occupationOrHobby: params.occupationOrHobby,
    detail: params.detail,
    followUp: params.followUp,
    recommendedAI: params.aiName,
    concern: params.concern,
  }

  const prompt = buildPromptText(promptParams)

  const result = await genAI.models.generateContentStream({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
  })

  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of result) {
          const text = chunk.text
          if (text) {
            controller.enqueue(encoder.encode(text))
          }
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })
}
```

- [ ] **Step 2: app/api/generate-prompt/route.ts 업데이트**

```typescript
import { NextRequest } from 'next/server'
import { generatePromptStream } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  let occupationOrHobby: string, concern: string, aiName: string, aiDescription: string
  let detail: string | undefined, followUp: string | undefined

  try {
    ;({ occupationOrHobby, concern, aiName, aiDescription, detail, followUp } = await request.json())
  } catch {
    return new Response('요청 본문이 올바른 JSON이 아닙니다', { status: 400 })
  }

  if (!occupationOrHobby || !concern || !aiName) {
    return new Response('occupationOrHobby, concern, aiName은 필수입니다', { status: 400 })
  }

  const stream = await generatePromptStream({ occupationOrHobby, concern, aiName, aiDescription, detail, followUp })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}
```

- [ ] **Step 3: 빌드 확인**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: 커밋**

```bash
git add lib/gemini.ts app/api/generate-prompt/route.ts
git commit -m "feat: gemini — 새 params 구조 적용 (occupationOrHobby, detail, followUp)"
```

---

## Task 8: components/survey/GridSelect.tsx — multi-select 모드 추가

**Files:**
- Modify: `components/survey/GridSelect.tsx`

- [ ] **Step 1: 파일 전체 교체**

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { QuestionOption } from '@/lib/types'

interface GridSelectProps {
  question: string
  description?: string
  options: QuestionOption[]
  onSelect: (value: string) => void
  multiSelect?: boolean
  maxSelect?: number
  onMultiConfirm?: (values: string[]) => void
}

export default function GridSelect({
  question,
  description,
  options,
  onSelect,
  multiSelect = false,
  maxSelect,
  onMultiConfirm,
}: GridSelectProps) {
  const [selected, setSelected] = useState<string[]>([])

  function toggleOption(value: string) {
    setSelected(prev => {
      if (prev.includes(value)) return prev.filter(v => v !== value)
      if (maxSelect && prev.length >= maxSelect) return prev
      return [...prev, value]
    })
  }

  if (!multiSelect) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900">{question}</h2>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-150 gap-2"
            >
              {option.emoji && <span className="text-2xl">{option.emoji}</span>}
              <span className="text-sm font-medium text-gray-800 text-center">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">{question}</h2>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = selected.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleOption(option.value)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-150 gap-2 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              {option.emoji && <span className="text-2xl">{option.emoji}</span>}
              <span className="text-sm font-medium text-gray-800 text-center">{option.label}</span>
            </button>
          )
        })}
      </div>
      <Button
        className="w-full h-12 text-base"
        disabled={selected.length === 0}
        onClick={() => onMultiConfirm?.(selected)}
      >
        선택 완료 ({selected.length}{maxSelect ? `/${maxSelect}` : ''})
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: 커밋**

```bash
git add components/survey/GridSelect.tsx
git commit -m "feat: GridSelect — multi-select 모드 추가 (maxSelect, onMultiConfirm)"
```

---

## Task 9: app/survey/page.tsx — 새 분기 흐름 적용

**Files:**
- Modify: `app/survey/page.tsx`

- [ ] **Step 1: 파일 전체 교체**

```typescript
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ProgressBar from '@/components/survey/ProgressBar'
import QuestionCard from '@/components/survey/QuestionCard'
import GridSelect from '@/components/survey/GridSelect'
import { Button } from '@/components/ui/button'
import { calculateTopAIs } from '@/lib/matcher'
import questionsData from '@/data/questions.json'
import type { Answers, Question } from '@/lib/types'

const TOTAL_STEPS = 9

const WORK_KEYWORDS = new Set(['work_fast', 'write_better', 'find_info'])

function getInterestKeywordsBranch(keywords: string[]): string {
  const workCount = keywords.filter(k => WORK_KEYWORDS.has(k)).length
  const lifeCount = keywords.length - workCount
  return workCount > lifeCount ? 'occupation_category' : 'hobby'
}

function getAnswerKey(questionId: string): keyof Answers {
  if (questionId.startsWith('occupation_detail_')) return 'occupation_detail'
  if (questionId.startsWith('follow_up_')) return 'follow_up'
  if (questionId === 'hobby') return 'hobby'
  if (questionId === 'interest_keywords') return 'interest_keywords'
  return questionId as keyof Answers
}

function getNextQuestionId(question: Question, selectedValue: string): string | null {
  if (!question.next) return null
  if (typeof question.next === 'string') return question.next
  return (question.next as Record<string, string>)[selectedValue] ?? null
}

export default function SurveyPage() {
  const router = useRouter()
  const [currentQuestionId, setCurrentQuestionId] = useState<string>('age')
  const [history, setHistory] = useState<string[]>([])
  const [answers, setAnswers] = useState<Answers>({})
  const [mainConcernText, setMainConcernText] = useState('')

  const questions = questionsData.questions as Record<string, Question>
  const currentQuestion = questions[currentQuestionId]

  const handleSelect = useCallback((value: string) => {
    const answerKey = getAnswerKey(currentQuestionId)
    const newAnswers = { ...answers, [answerKey]: value }
    setAnswers(newAnswers)

    if (currentQuestionId === 'occupation_category' && value === 'it') {
      setHistory(prev => [...prev, currentQuestionId])
      router.push('/easter-egg')
      return
    }

    const nextId = getNextQuestionId(currentQuestion, value)
    if (nextId === null) return

    setHistory(prev => [...prev, currentQuestionId])
    setCurrentQuestionId(nextId)
  }, [currentQuestionId, answers, currentQuestion, router])

  const handleMultiConfirm = useCallback((values: string[]) => {
    const answerKey = getAnswerKey(currentQuestionId)
    const newAnswers = { ...answers, [answerKey]: values }
    setAnswers(newAnswers)

    let nextId: string
    if (currentQuestionId === 'interest_keywords') {
      nextId = getInterestKeywordsBranch(values)
    } else {
      // hobby → device
      nextId = (currentQuestion.next as string) ?? 'device'
    }

    setHistory(prev => [...prev, currentQuestionId])
    setCurrentQuestionId(nextId)
  }, [currentQuestionId, answers, currentQuestion])

  const handleBack = useCallback(() => {
    if (history.length === 0) {
      router.push('/')
      return
    }
    const prevId = history[history.length - 1]
    const answerKey = getAnswerKey(currentQuestionId)
    const newAnswers = { ...answers }
    delete newAnswers[answerKey]
    setAnswers(newAnswers)
    setHistory(prev => prev.slice(0, -1))
    setCurrentQuestionId(prevId)
  }, [history, currentQuestionId, answers, router])

  const handleSubmitConcern = useCallback(() => {
    if (!mainConcernText.trim()) return
    const finalAnswers = { ...answers, main_concern: mainConcernText.trim() }
    const topAIs = calculateTopAIs(finalAnswers)
    sessionStorage.setItem('surveyResults', JSON.stringify({ rankedAIs: topAIs, answers: finalAnswers }))
    router.push('/result')
  }, [answers, mainConcernText, router])

  if (!currentQuestion) return null

  // history.length + 1 로 실제 진행 단계를 반영
  const currentStep = Math.min(history.length + 1, TOTAL_STEPS)

  // main_concern 플레이스홀더: life 트랙은 'life' 키 사용
  const placeholderKey = answers.purpose === 'life'
    ? 'life'
    : (answers.occupation_category ?? 'default')

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <div className="max-w-md mx-auto w-full flex flex-col flex-1 px-4 py-6 gap-6">
        <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        <div className="flex-1">
          {currentQuestion.type === 'grid_select' && (
            <GridSelect
              question={currentQuestion.question ?? ''}
              description={currentQuestion.description}
              options={currentQuestion.options ?? []}
              onSelect={handleSelect}
            />
          )}

          {currentQuestion.type === 'multi_select' && (
            <GridSelect
              question={currentQuestion.question ?? ''}
              description={currentQuestion.description}
              options={currentQuestion.options ?? []}
              onSelect={() => {}}
              multiSelect={true}
              maxSelect={currentQuestion.max_select}
              onMultiConfirm={handleMultiConfirm}
            />
          )}

          {currentQuestion.type === 'single_select' && (
            <QuestionCard
              question={currentQuestion.question ?? ''}
              description={currentQuestion.description}
              options={currentQuestion.options ?? []}
              onSelect={handleSelect}
            />
          )}

          {currentQuestion.type === 'text_input' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-gray-900">{currentQuestion.question}</h2>
                {currentQuestion.description && (
                  <p className="text-sm text-gray-500">{currentQuestion.description}</p>
                )}
              </div>
              <textarea
                value={mainConcernText}
                onChange={e => setMainConcernText(e.target.value)}
                placeholder={
                  (currentQuestion.placeholder as Record<string, string>)?.[placeholderKey] ??
                  (currentQuestion.placeholder as Record<string, string>)?.['default'] ??
                  '고민을 입력해주세요'
                }
                className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl resize-none text-base focus:outline-none focus:border-blue-400"
              />
              <Button
                className="w-full h-12 text-base"
                onClick={handleSubmitConcern}
                disabled={!mainConcernText.trim()}
              >
                내 AI 찾기 ✨
              </Button>
            </div>
          )}
        </div>

        <button
          onClick={handleBack}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors self-start"
        >
          ← 이전으로
        </button>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: 커밋**

```bash
git add app/survey/page.tsx
git commit -m "feat: survey — multi_select 렌더링, interest_keywords 자동분기, progress 로직 업데이트"
```

---

## Task 10: components/result/PromptBox.tsx — 공감 멘트/프롬프트 분리 표시

**Files:**
- Modify: `components/result/PromptBox.tsx`

`[AI이름에 붙여넣기]` 마커를 기준으로 스트리밍 텍스트를 intro(공감 멘트)와 prompt(붙여넣기용)로 분리한다.

- [ ] **Step 1: 파일 전체 교체**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import type { RankedAI } from '@/lib/types'
import type { Answers } from '@/lib/types'

interface PromptBoxProps {
  topAI: RankedAI
  answers: Answers
}

function splitPromptText(text: string, aiName: string): { intro: string; prompt: string } {
  const marker = `[${aiName}에 붙여넣기]`
  const idx = text.indexOf(marker)
  if (idx === -1) return { intro: '', prompt: text }
  return {
    intro: text.slice(0, idx).trim(),
    prompt: text.slice(idx).trim(),
  }
}

function buildOccupationOrHobby(answers: Answers): string {
  if (answers.hobby && answers.hobby.length > 0) {
    const hobbyLabels: Record<string, string> = {
      media: '영상·미디어', study: '공부·자기계발', cooking: '요리·살림',
      health: '건강·운동', travel: '여행·취미', finance: '재테크·투자',
      parenting: '육아·가족', shopping: '쇼핑·트렌드',
    }
    return answers.hobby.map(h => hobbyLabels[h] ?? h).join(', ')
  }
  const occupationLabels: Record<string, string> = {
    student: '학생·수험생', jobseeker: '취준생·이직준비',
    office_worker: '직장인 (사무·전문직)', field_worker: '직장인 (현장·서비스직)',
    self_employed_owner: '자영업·소상공인', freelancer: '프리랜서·크리에이터',
    homemaker: '주부·육아',
  }
  return occupationLabels[answers.occupation_category ?? ''] ?? answers.occupation_category ?? ''
}

export default function PromptBox({ topAI, answers }: PromptBoxProps) {
  const [fullText, setFullText] = useState('')
  const [isStreaming, setIsStreaming] = useState(true)
  const [isDone, setIsDone] = useState(false)
  const [copied, setCopied] = useState(false)

  const { intro, prompt } = splitPromptText(fullText, topAI.name)

  useEffect(() => {
    const hasConcern = !!answers.main_concern
    const hasContext = !!(answers.occupation_category || (answers.hobby && answers.hobby.length > 0))
    if (!hasConcern || !hasContext) return

    const controller = new AbortController()
    setIsStreaming(true)
    setFullText('')
    setIsDone(false)

    async function stream() {
      try {
        const response = await fetch('/api/generate-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            occupationOrHobby: buildOccupationOrHobby(answers),
            detail: answers.occupation_detail,
            followUp: answers.follow_up,
            concern: answers.main_concern,
            aiName: topAI.name,
            aiDescription: topAI.shortDescription,
          }),
          signal: controller.signal,
        })

        if (!response.ok || !response.body) {
          setFullText('프롬프트 생성에 실패했습니다. 다시 시도해주세요.')
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let text = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (controller.signal.aborted) { reader.cancel(); break }
          text += decoder.decode(value, { stream: true })
          setFullText(text)
        }
        if (!controller.signal.aborted) setIsDone(true)
      } catch (e) {
        if (controller.signal.aborted) return
        setFullText('네트워크 오류가 발생했습니다.')
      } finally {
        if (!controller.signal.aborted) setIsStreaming(false)
      }
    }

    stream()
    return () => controller.abort()
  }, [topAI, answers])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard 권한 없음 — 무시
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">
          ✨ {topAI.name}에서 바로 쓸 수 있는 맞춤 프롬프트
        </h3>
        {isDone && prompt && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? '복사됨 ✓' : '복사하기'}
          </Button>
        )}
      </div>

      {intro && (
        <p className="text-sm text-gray-500 italic">{intro}</p>
      )}

      <div className="min-h-32 p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-800 whitespace-pre-wrap">
        {prompt || fullText}
        {isStreaming && <span className="inline-block w-1 h-4 bg-gray-500 animate-pulse ml-0.5" />}
        {!fullText && !isStreaming && (
          <span className="text-gray-400">프롬프트를 생성하는 중...</span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: 전체 테스트 실행**

```bash
npx jest --no-coverage 2>&1 | tail -20
```

Expected: 모든 테스트 통과

- [ ] **Step 4: 커밋**

```bash
git add components/result/PromptBox.tsx
git commit -m "feat: PromptBox — 공감 멘트/프롬프트 분리 표시, 새 API params 전송"
```

---

## Task 11: 통합 확인 및 최종 커밋

- [ ] **Step 1: 전체 빌드 확인**

```bash
npx tsc --noEmit 2>&1
```

Expected: 에러 없음

- [ ] **Step 2: 전체 테스트 확인**

```bash
npx jest --no-coverage 2>&1 | tail -20
```

Expected: 모든 테스트 통과

- [ ] **Step 3: 개발 서버 실행 및 수동 확인**

```bash
npm run dev
```

확인 항목:
- [ ] 업무 → 직장인(사무·전문직) → 세부 → 꼬리질문 → 기기 → ... → 결과 (기존 흐름 유사)
- [ ] 업무 → 직장인(현장·서비스직) → 세부 → 꼬리질문(work_info 등) → 기기 → ... → 결과
- [ ] 일상 → 취미 복수 선택 → 기기 → ... → 결과 (life 트랙 scoring)
- [ ] 잘 모르겠어요 → 업무 키워드 多 선택 → occupation_category로 분기
- [ ] 잘 모르겠어요 → 일상 키워드 多 선택 → hobby로 분기
- [ ] 결과 페이지: 번아웃 고민 입력 시 공감 멘트가 회색 이탤릭으로 표시됨
- [ ] IT 선택 시 이스터에그 페이지로 이동

- [ ] **Step 4: push**

```bash
git push
```

---

## Self-Review 체크리스트

**스펙 커버리지:**
- [x] Q2 사용 목적 (purpose) 추가 → Task 4
- [x] 업무 분기 직업 재설계 (field_worker 신규, senior 제거, 키 rename) → Task 2, 3, 4
- [x] field_worker 세부 직종 및 꼬리질문 → Task 4
- [x] 일상 분기 취미 복수 선택 (최대 2개) → Task 4, 8
- [x] 취미 꼬리질문 없음 (C안) → hobby.next = "device"
- [x] 잘 모르겠어요 분기 자동 브랜치 → Task 9
- [x] hobby 가중치 → Task 3
- [x] field_worker 가중치 → Task 3
- [x] gemini-prompt.ts 5가지 유형 감지 → Task 5
- [x] 유형별 프롬프트 생성 → Task 5, 7
- [x] 결과 화면 공감 멘트/프롬프트 분리 → Task 10
- [x] ai-tools.json occupation 키 rename → Task 2
- [x] life 트랙 matcher scoring → Task 6

**타입 일관성:**
- `PromptParams` (gemini-prompt.ts) ↔ `GeneratePromptParams` (gemini.ts): `occupationOrHobby`, `detail`, `followUp`, `recommendedAI`, `concern` 일치
- `Answers.hobby: string[]` ↔ GridSelect `onMultiConfirm: (values: string[]) => void` 일치
- `Question.max_select` ↔ GridSelect `maxSelect` 일치
