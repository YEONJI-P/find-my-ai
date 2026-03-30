# 설문 구조 및 매칭 로직 전면 개편 — 설계 문서

작성일: 2026-03-30

## 배경

MVP에서 발견된 세 가지 문제 해결:
1. 직군이 화이트칼라 중심으로 편향됨
2. 업무/일상 사용 목적 구분 없이 직업만 물어봄
3. 주관식 고민이 단순 프롬프트 생성에만 쓰이고 감성적 맥락을 무시함

---

## 1. 설문 흐름

```
age → purpose
         ├─ 업무(work) → occupation_category
         │                    ├─ field_worker → occupation_detail_field_worker → follow_up_field_worker → device
         │                    └─ 나머지 직군 → occupation_detail_[직군] → follow_up_[직군] → device
         ├─ 일상(life) → hobby (multi_select, max 2) → device
         └─ 모름(unknown) → interest_keywords (multi_select) → [자동분기]
                                  ├─ 업무 키워드 多 → occupation_category
                                  └─ 일상 키워드 多 / 동률 / just_curious → hobby

device → digital_literacy → mbti → main_concern → 결과
```

**총 steps**: 최대 9 (purpose 추가로 기존 8 → 9)

---

## 2. 질문 데이터 (`data/questions.json`)

### 신규 질문

**purpose** (Q2, single_select)
- 💼 업무에 활용하고 싶어요 → `work`
- 🌱 일상생활에서 써보고 싶어요 → `life`
- 🤔 잘 모르겠어요 → `unknown`

**occupation_category** — 업무 분기 (grid_select, 8개)

| value | label | emoji | track |
|-------|-------|-------|-------|
| student | 학생·수험생 | 🎓 | normal |
| jobseeker | 취준생·이직준비 | 💼 | normal |
| office_worker | 직장인 (사무·전문직) | 🏢 | normal |
| field_worker | 직장인 (현장·서비스직) | 🦺 | normal |
| self_employed_owner | 자영업·소상공인 | 🏪 | normal |
| freelancer | 프리랜서·크리에이터 | 🎨 | normal |
| homemaker | 주부·육아 | 🏠 | normal |
| it | IT·개발·데이터 | 💻 | easter_egg |

변경: `worker` → `office_worker`, `selfemployed` → `self_employed_owner`, `senior` 제거, `field_worker` 신규 추가

**occupation_detail_field_worker** (single_select)
- service: 서비스직 (매장 직원·바리스타·판매)
- field: 현장직 (건설·제조·물류·상하차)
- transport: 운수직 (배달·택배·운전)
- care: 돌봄·의료보조 (요양·간병·보육)

**follow_up_field_worker** (single_select)
- work_info: 근무 관련 정보 찾기 (노무·급여·권리)
- customer: 고객·민원 응대
- career: 이직·자격증 준비
- life: 생활비·지원금·혜택 탐색

**hobby** — 일상 분기 (multi_select, max 2)

| value | label | emoji |
|-------|-------|-------|
| media | 영상·미디어 | 📺 |
| study | 공부·자기계발 | 📚 |
| cooking | 요리·살림 | 🍳 |
| health | 건강·운동 | 💪 |
| travel | 여행·취미 | ✈️ |
| finance | 재테크·투자 | 💰 |
| parenting | 육아·가족 | 👨‍👩‍👧 |
| shopping | 쇼핑·트렌드 | 🛍️ |

꼬리질문 없음 (C안 채택). hobby 선택 후 바로 device로 이동.

**interest_keywords** — 잘 모르겠어요 분기 (multi_select)

업무 키워드: `work_fast`, `write_better`, `find_info`
일상 키워드: `video_summary`, `trip_plan`, `finance_study`, `recipe`, `just_curious`

자동분기 로직 (클라이언트):
- 업무 키워드 선택 수 > 일상 키워드 선택 수 → `occupation_category`로 이동
- 그 외 (일상 多, 동률, just_curious 포함) → `hobby`로 이동

### 유지되는 질문
occupation_detail_student, occupation_detail_jobseeker, occupation_detail_freelancer, occupation_detail_homemaker, follow_up_student, follow_up_jobseeker, follow_up_freelancer, follow_up_homemaker, device, digital_literacy, mbti, main_concern, easter_egg

### 제거되는 질문
occupation_detail_senior, follow_up_senior, occupation_detail_worker (→ office_worker로 대체), occupation_detail_selfemployed (→ self_employed_owner로 대체)

---

## 3. 매칭 규칙 (`data/matching-rules.json`)

### Life 트랙 scoring 전략

`answers.hobby`가 존재하면 life 트랙 적용:
- 취미 점수 = 선택된 hobby들의 AI 점수 평균
- 최종 점수 = hobby × 0.50 + device × 0.25 + digitalLiteracy × 0.25

### 신규 hobby 가중치

| 취미 | chatgpt | clova_x | wrtn | gemini | copilot | perplexity | claude | canva_ai | lilys |
|------|---------|---------|------|--------|---------|------------|--------|----------|-------|
| media | 2 | 2 | 1 | 3 | 1 | 2 | 1 | 1 | 5 |
| study | 3 | 1 | 2 | 2 | 2 | 3 | 3 | 1 | 2 |
| cooking | 2 | 3 | 2 | 2 | 1 | 2 | 1 | 2 | 2 |
| health | 3 | 2 | 1 | 2 | 1 | 3 | 2 | 1 | 3 |
| travel | 3 | 2 | 1 | 2 | 1 | 3 | 2 | 3 | 2 |
| finance | 2 | 2 | 1 | 2 | 1 | 5 | 2 | 1 | 3 |
| parenting | 2 | 3 | 2 | 2 | 1 | 3 | 2 | 1 | 3 |
| shopping | 2 | 3 | 2 | 2 | 1 | 3 | 1 | 2 | 2 |

### 신규 field_worker 가중치

occupationDetail:
```json
{ "chatgpt": 3, "clova_x": 3, "wrtn": 2, "gemini": 2, "copilot": 1, "perplexity": 4, "claude": 2, "canva_ai": 1, "lilys": 4 }
```

followUp 추가 가중치:
- work_info: perplexity+2, clova_x+2, lilys+1
- customer: chatgpt+2, clova_x+2, claude+1
- career: wrtn+2, chatgpt+2, perplexity+1
- life: perplexity+3, clova_x+2, lilys+1

### occupation_category 값 변경에 따른 기존 규칙 key 업데이트
- `worker` → `office_worker`
- `selfemployed` → `self_employed_owner`
- `senior` 제거

---

## 4. 타입 (`lib/types.ts`)

```typescript
export type Answers = {
  age?: string
  purpose?: 'work' | 'life' | 'unknown'
  occupation_category?: string
  occupation_detail?: string
  follow_up?: string
  hobby?: string[]            // 신규
  interest_keywords?: string[] // 신규
  device?: string
  digital_literacy?: string
  mbti?: string
  main_concern?: string
}

// Question.type에 'multi_select' 추가
type QuestionType = 'single_select' | 'grid_select' | 'text_input' | 'multi_select' | 'easter_egg'

// Question에 max_select 추가
export type Question = {
  ...
  max_select?: number // multi_select 전용
}
```

---

## 5. 프롬프트 생성 (`lib/gemini-prompt.ts`) — 신규

### 유형 감지

```
detectConcernType(concern: string): 1 | 2 | 3 | 4 | 5
```

| 유형 | 판단 기준 |
|------|---------|
| 1 구체적 니즈형 | 명확한 작업 목표, 위 패턴 없음 |
| 2 번아웃·회피형 | "싫어", "귀찮", "하기 싫" 등 |
| 3 무관심·탐색형 | "모르겠", "없음", "별생각", "그냥" 등 |
| 4 감성·고민형 | "힘들", "지쳐", "걱정", "무서" 등 |
| 5 엉뚱·유머형 | "로또", "게임", "치킨" 등 맥락 벗어난 입력 |

### 프롬프트 생성

```
buildSystemPrompt(params: {
  concernType: 1 | 2 | 3 | 4 | 5
  age: string
  purpose: string
  occupationOrHobby: string
  detail?: string
  followUp?: string
  recommendedAI: string
  concern: string
}): string
```

유형별 출력 형식:
- **1**: 공감 멘트 없이 바로 프롬프트
- **2**: 공감 1문장 + 저항감 낮춘 경량 프롬프트 ("딱 3줄만", "일단 이것만")
- **3**: "이거 한번 써봐요" 톤 + 초간단 일상 체험 프롬프트
- **4**: 공감 1문장 + 오늘 당장 쓸 수 있는 실용 프롬프트
- **5**: 유머로 받아치기 1문장 + 실제 도움되는 프롬프트

공통 출력 형식:
```
{공감 또는 도입 멘트 (1번 유형은 생략)}

[{추천_AI_이름}에 붙여넣기]
{프롬프트 본문}
```

프롬프트 작성 규칙: 한국어, 전문 용어 금지, 바로 복사 가능한 완성형, 150자 이내

### 기존 gemini.ts 연동

`generatePromptStream`에 `PromptContext` 매개변수 추가. `buildSystemPrompt`를 import하여 system prompt로 활용.

---

## 6. 컴포넌트 변경

### GridSelect.tsx
- `multiSelect?: boolean`, `maxSelect?: number` props 추가
- multi 모드: 선택 상태 내부에서 관리 → "다음" 버튼으로 확정
- single 모드: 기존 동작 유지 (클릭 즉시 onSelect)

### survey/page.tsx
- `multi_select` 타입 렌더링 추가
- interest_keywords 자동분기 로직 추가 (`handleMultiSelect`)
- `getAnswerKey` 업데이트 (새 question ID 대응)
- TOTAL_STEPS: 8 → 9

### result/page.tsx
- PromptBox에 공감 멘트와 프롬프트를 분리하여 표시
- 공감 멘트: 회색 이탤릭 텍스트로 상단 표시
- 프롬프트 본문: 기존 복사 박스

---

## 7. 추가 수정 필요

### `data/ai-tools.json`
AI 9종의 목록·설명은 유지하지만, 각 tool의 `matchingWeight.occupation` 내 key를 rename:
- `worker` → `office_worker`
- `selfemployed` → `self_employed_owner`
- `senior` 키 제거 (9개 tool 전체에 반복 적용)

field_worker 가중치 추가 (각 tool의 `matchingWeight.occupation`에 `field_worker` key 신규):
> 별도 지정 없으므로 `senior` 제거 후 해당 점수를 `field_worker`에 재할당하지 않고, matching-rules.json의 occupationDetail.field_worker 가중치로 커버함.
> 단, occupation 레벨 점수가 0이 되지 않도록 각 tool에 `field_worker: 2` (중립값) 추가.

---

## 8. 변경하지 않는 것
- 공통 질문 로직 (device, digital_literacy, MBTI)
- 이스터에그 페이지 (`app/easter-egg/page.tsx`)
- Vercel 배포 설정
- ProgressBar, QuestionCard 컴포넌트 (재활용)
- jest 테스트 설정 (테스트는 별도로 업데이트 필요)
