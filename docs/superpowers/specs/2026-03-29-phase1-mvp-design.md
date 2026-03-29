# Find My AI — Phase 1 MVP 설계 문서

**작성일:** 2026-03-29
**범위:** Phase 1 MVP (랜딩 → 설문 → 결과 + Gemini API 연동)

---

## 1. 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS + shadcn/ui |
| AI API | Google Gemini API (Streaming) — `@google/generative-ai` |
| 배포 | Vercel |

---

## 2. 프로젝트 구조

```
find-my-ai/
├── app/
│   ├── page.tsx                       # 랜딩 페이지 (CTA → /survey)
│   ├── survey/page.tsx                # 설문 SPA (8문항 전체)
│   ├── result/page.tsx                # 결과 페이지 (Top 3 + 프롬프트)
│   ├── easter-egg/page.tsx            # IT 직군 이스터에그
│   └── api/
│       └── generate-prompt/route.ts  # Gemini Streaming API 엔드포인트
├── components/
│   ├── survey/
│   │   ├── QuestionCard.tsx           # 단일선택 질문 래퍼
│   │   ├── GridSelect.tsx             # 직업 대분류 2×4 그리드
│   │   └── ProgressBar.tsx            # 진행률 표시 (1~8단계)
│   └── result/
│       ├── AiCard.tsx                 # AI 추천 카드 (1~3위)
│       └── PromptBox.tsx              # 스트리밍 프롬프트 출력 + 복사 버튼
├── lib/
│   ├── matcher.ts                     # 가중치 합산 매칭 로직 → Top 3 반환
│   └── gemini.ts                      # Gemini SDK 스트리밍 래퍼
├── data/
│   ├── ai-tools.json
│   ├── questions.json
│   └── matching-rules.json
├── .env.example                       # 키 없는 환경변수 템플릿 (GitHub 커밋)
└── .env.local                         # 실제 키 입력 파일 (gitignore, 로컬 전용)
```

---

## 3. 페이지별 역할

### 랜딩 (`/`)
- 서비스 소개 + "내 AI 찾기 시작" CTA 버튼
- 버튼 클릭 → `/survey`로 이동

### 설문 (`/survey`)
- 8문항 전체를 단일 페이지에서 상태로 관리 (SPA 방식)
- 페이지 이동 없이 컴포넌트 교체로 질문 전환
- 뒤로가기: 내부 히스토리 스택으로 처리

### 결과 (`/result`)
- `sessionStorage`에서 매칭 결과 읽기
- Top 3 AI 카드 표시
- 1위 AI에 대한 맞춤 프롬프트 스트리밍 출력

### 이스터에그 (`/easter-egg`)
- `occupation_category === 'it'` 선택 시 분기
- 유머러스한 메시지 + GitHub/Kaggle 링크 버튼

---

## 4. 설문 상태 관리

`survey/page.tsx` 내부 상태:

```ts
type Answers = {
  age?: string
  occupation_category?: string
  occupation_detail?: string
  follow_up?: string
  device?: string
  digital_literacy?: string
  mbti?: string
  main_concern?: string
}

const [currentQuestion, setCurrentQuestion] = useState<string>('age')
const [history, setHistory] = useState<string[]>([])
const [answers, setAnswers] = useState<Answers>({})
```

**답변 선택 흐름:**
1. `answers`에 저장
2. `history`에 현재 질문 ID push
3. `questions.json`의 `next` 로직으로 다음 질문 ID 계산
4. `occupation_category === 'it'` → `router.push('/easter-egg')`
5. `next === null` (마지막) → `matcher.ts` 실행 → `sessionStorage` 저장 → `router.push('/result')`

**뒤로가기:**
1. `history`에서 pop → 이전 질문 ID로 복원
2. `answers`에서 해당 질문 답변 제거

---

## 5. 매칭 로직 (`lib/matcher.ts`)

가중치 합산 방식:

| 항목 | 비중 | 출처 |
|------|------|------|
| occupation | 30% | `ai-tools.json` `matchingWeight.occupation` |
| occupationDetail | 20% | `matching-rules.json` `rules.occupationDetail` |
| followUp | 20% | `matching-rules.json` `rules.followUp` |
| device | 15% | `ai-tools.json` `matchingWeight.device` |
| digitalLiteracy | 15% | `ai-tools.json` `matchingWeight.digitalLiteracy` |
| ageBonus | 보정 | `matching-rules.json` `rules.ageBonus` |

- `minScoreThreshold(3)` 미만 제외
- 동점 시 `digitalLiteracy` 점수 높은 순 타이브레이커
- 상위 3개 반환

**반환 타입:**
```ts
type RankedAI = {
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
  resultMessage: string  // {occupation}, {concern} 플레이스홀더 치환 완료
}
```

---

## 6. Gemini API 연동

### `lib/gemini.ts`
- `@google/generative-ai` 패키지 사용
- 직업, 고민, 추천 AI 정보를 받아 스트리밍 응답 반환

### `app/api/generate-prompt/route.ts`
- Method: POST
- Request body: `{ occupation, concern, aiName, aiDescription }`
- 시스템 프롬프트:
  ```
  당신은 {aiName} 전문가입니다.
  {occupation}인 사용자가 {concern}을 해결하기 위해
  {aiName}에서 바로 복사해 쓸 수 있는 한국어 프롬프트를 작성해주세요.
  ```
- Response: `ReadableStream` (텍스트 스트리밍)

### `components/result/PromptBox.tsx`
- `fetch` + `response.body.getReader()`로 청크 단위 수신
- 글자 타이핑 효과로 순차 출력
- 완료 후 복사 버튼 활성화 (`navigator.clipboard.writeText()`)

---

## 7. 환경변수 & 보안

### `.env.example` (GitHub 커밋용 템플릿)
```env
# Gemini API 키 (https://aistudio.google.com/apikey 에서 발급)
GEMINI_API_KEY=

# 카카오 공유 JS 키 (Phase 2용, 지금은 비워두세요)
NEXT_PUBLIC_KAKAO_JS_KEY=
```

### 로컬 세팅 순서
```bash
cp .env.example .env.local
# .env.local 열어서 GEMINI_API_KEY=발급받은키 입력
npm run dev
```

### Vercel 배포 시
- 대시보드 → Settings → Environment Variables에서 `GEMINI_API_KEY` 직접 입력
- `.env.local`은 절대 push하지 않음 (`.gitignore`에 자동 포함)

**보안 원칙:** `GEMINI_API_KEY`는 `NEXT_PUBLIC_` 접두사 없음 → 서버 전용, 클라이언트 번들에 노출 안 됨.

---

## 8. 데이터 파일 위치 변경

현재 루트에 있는 JSON 파일들을 `data/` 폴더로 이동:
- `ai-tools.json` → `data/ai-tools.json`
- `questions.json` → `data/questions.json`
- `matching-rules.json` → `data/matching-rules.json`
