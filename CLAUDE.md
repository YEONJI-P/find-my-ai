# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**Find My AI** — 설문(8문항, 약 2분)을 통해 사용자에게 최적화된 AI 도구 Top 3를 추천하고, Gemini API로 맞춤 프롬프트를 자동 생성하는 서비스.

- 기술 스택: Next.js 14 (App Router + Server Actions), Google Gemini API (Streaming), Vercel
- 타겟: AI 초보 일반 대중 (시니어, 자영업자, 현장직 등)
- IT·개발직 선택 시 이스터에그 페이지로 분기

## 개발 명령어

```bash
npm install
npm run dev       # 개발 서버 (http://localhost:3000)
npm run build     # 프로덕션 빌드
npm run lint      # ESLint
```

### 환경 변수 (`.env.local`)

```env
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_KAKAO_JS_KEY=your_kakao_js_key
```

## 프로젝트 구조

```
find-my-ai/
├── app/
│   ├── page.tsx                  # 랜딩 페이지
│   ├── survey/page.tsx           # 설문 진행 (Dynamic Decision Tree)
│   ├── result/page.tsx           # 결과 페이지 (Top 3 추천 + 프롬프트 스트리밍)
│   ├── easter-egg/page.tsx       # IT 직군 이스터에그
│   └── api/match/route.ts        # 매칭 API
├── components/
│   ├── survey/                   # QuestionCard, GridSelect, ProgressBar
│   └── result/                   # AiCard, PromptBox (스트리밍), ShareButtons
├── data/                         # 콘텐츠 데이터 JSON (코드 변경 없이 수정 가능)
│   ├── ai-tools.json             # AI 9종 정보 및 matchingWeight
│   ├── questions.json            # 설문 흐름·분기 로직 전체
│   └── matching-rules.json       # 가중치 룰셋 및 resultMessages 템플릿
├── lib/
│   ├── matcher.ts                # 가중치 합산 매칭 로직
│   └── gemini.ts                 # Gemini Streaming API 연동
└── public/characters/            # AI 캐릭터 이미지
```

> 현재 `data/` JSON 파일들이 루트에 위치해 있으나, 구현 시 `data/` 폴더로 이동 예정.

## 핵심 아키텍처

### 설문 분기 구조 (questions.json)

`flow` 배열: `age → occupation_category → occupation_detail_{category} → follow_up_{category} → device → digital_literacy → mbti → main_concern`

- `occupation_category`에서 `it` 선택 시 `easter_egg`로 즉시 분기
- 각 질문의 `next` 필드로 다음 질문 ID 또는 분기 맵 지정
- `mbti`는 `optional: true` (건너뛰기 허용)

### 매칭 로직 (matching-rules.json)

가중치 합산 방식 (`weighted_sum`):

| 항목 | 비중 |
|------|------|
| occupation | 30% |
| occupationDetail | 20% |
| followUp | 20% |
| device | 15% |
| digitalLiteracy | 15% |

- `occupation`, `device`, `digitalLiteracy` 점수는 `ai-tools.json`의 `matchingWeight` 사용
- `occupationDetail`, `followUp` 점수는 `matching-rules.json`의 `rules` 사용
- 나이대별 `ageBonus` 미세 보정 추가 적용
- 상위 3개 AI 반환, 동점 시 `digitalLiteracy` 기준 타이브레이커

### 응답 속도 전략

- 객관식 매칭 결과: JSON 인메모리 처리 → 즉시 반환
- 맞춤 프롬프트: Gemini API Streaming → 첫 글자부터 화면 출력

### 프롬프트 생성

`ai-tools.json`의 `samplePromptTemplate`에 `{occupation}`, `{concern}` 플레이스홀더를 주관식 응답으로 치환하여 Gemini API에 전달.

## 데이터 파일 수정 지침

- **AI 정보 변경**: `data/ai-tools.json` — `strengths`, `weaknesses`, `matchingWeight` 수정
- **질문·선택지 변경**: `data/questions.json` — `options`, `next` 분기 수정
- **추천 로직 조정**: `data/matching-rules.json` — `rules.occupationDetail`, `rules.followUp` 가중치 수정
- **결과 설명문 변경**: `data/matching-rules.json` — `resultMessages.templates` 수정
