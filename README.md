# 🔍 Find My AI — 내게 맞는 AI 찾기

> **"AI는 알겠는데, 나한테 맞는 게 뭔지 모르겠어요"**
>
> 직업·고민·사용 환경을 분석해 가장 적합한 AI 도구와  
> **바로 복사해서 쓸 수 있는 맞춤 프롬프트**를 제공하는 서비스

---

## 🎯 서비스 소개

AI 도구가 쏟아지는 시대, 정작 일반 대중은 어디서 어떻게 시작해야 할지 몰라 막막함을 느낍니다.  
**Find My AI**는 MBTI 테스트처럼 가볍고 재미있는 설문(약 2분)으로 사용자의 상황에 최적화된 AI를 추천하고,  
해당 도구에서 **바로 복사해 쓸 수 있는 초개인화 프롬프트**까지 자동 생성해줍니다.

### 타겟 사용자

- AI 사용 경험이 없거나 적은 일반 대중 (시니어, 자영업자, 현장직 등)
- 어떤 AI를 어떻게 써야 할지 막막한 직장인·취준생
- AI 도구 선택에 피로감을 느끼는 N잡러·프리랜서·주부

> 💡 개발자·데이터 분석가 등 IT 직군은 서비스 특성상 별도 **이스터에그 화면**으로 안내됩니다.

---

## ✨ 핵심 기능

### 1. 동적 설문 (Decision Tree)
직업 대분류 → 세부 직종 → 꼬리 질문으로 이어지는 2단계 분기 구조.  
화면당 최대 5개 선택지, 총 8문항으로 완주율을 높입니다.

### 2. AI 도구 매칭
설문 응답 기반 가중치 로직(직업 30% + 세부직종 20% + 꼬리질문 20% + 기기 15% + 디지털편의도 15%)으로  
9개 AI 중 최적 도구 Top 3 추천.  
**"왜 이 AI가 나한테 맞는지"** 이유를 함께 제공하여 신뢰도 확보.

### 3. 맞춤 프롬프트 자동 생성
주관식으로 입력한 '요즘 고민'을 Gemini API에 전달하여,  
추천된 AI에서 **바로 복사·붙여넣기 가능한** 맞춤형 프롬프트를 실시간 스트리밍으로 생성.

### 4. 결과 공유
카카오톡 공유 / 링크 복사로 지인에게 손쉽게 전달 가능.

### 5. 🥚 개발자 이스터에그
직업군에서 IT·개발·데이터를 선택하면 별도 페이지로 분기.  
서비스 특성에 맞는 유머러스한 메시지로 바이럴 포인트를 만듭니다.

---

## 🤖 추천 AI 도구 목록 (9종)

| # | AI 도구 | 핵심 포지션 | 주요 대상 |
|---|---------|------------|----------|
| 1 | **ChatGPT** | 만능 범용 / 음성 대화 | 복잡한 문제 해결, 다양한 직군 |
| 2 | **CLOVA X** | 국내 로컬 특화 | 자영업자, 네이버 생태계 사용자 |
| 3 | **뤼튼 (Wrtn)** | 한국어 글쓰기 템플릿 | 취준생, N잡러, SNS 운영자 |
| 4 | **Gemini** | 구글 생태계 통합 | 구글 툴 헤비유저, 정보 수집가 |
| 5 | **MS Copilot** | MS Office 완전 연동 | 사무직, 문서·보고서 작성자 |
| 6 | **Perplexity AI** | 출처 기반 AI 검색 | 투자자, 연구자, 팩트체커 |
| 7 | **Claude** | 자연스러운 한국어 작문 | 기획자, 마케터, 문서 작성자 |
| 8 | **Canva AI** | 비주얼 디자인 자동화 | 디자인 초보 사장님, 크리에이터 |
| 9 | **Lilys AI** | 영상·링크 요약 특화 | 바쁜 직장인, 시니어, 정보 탐색자 |

> AI 도구 정보는 `/data/ai-tools.json`에서 관리됩니다.

---

## ❓ 설문 구성 (8문항)

```
Q1. 나이대                  [필수] 단일 선택 (10대 ~ 50대+)
Q2. 직업 대분류              [필수] 그리드 선택 (8개 카테고리)
      └─ IT·개발·데이터 선택 시 → 🥚 이스터에그 페이지로 분기
Q3. 직업 세부 직종            [필수] 대분류별 3~4개 선택지
Q4. 직업 꼬리질문             [필수] 세부 직종 기반 분기 (업무·고민 심화)
Q5. 주 사용 기기              [필수] 스마트폰 전용 / 혼용 / PC 주력
Q6. 디지털 편의도             [필수] "앱 설치가 편한가요?" 수준의 평이한 표현
Q7. MBTI                    [선택] 무응답 허용, 결과에 한 줄 반영
Q8. 요즘 가장 큰 고민         [필수] 주관식 + 직업 연동 placeholder 자동 제공
```

> 질문 흐름 및 선택지 전체는 `/data/questions.json`에서 관리됩니다.

### 직업 대분류 & 세부 직종 한눈에 보기

| 대분류 | 세부 직종 | 꼬리질문 주제 |
|--------|----------|-------------|
| 🎓 학생·수험생 | 중고생 / 대학(원)생 / 재수·편입 | 내신수능 / 취업 / 논문 / 어학 |
| 💼 취준생·이직 | 신입 / 경력 / 진로고민 | 자소서 / 면접 / 포트폴리오 / 직무방향 |
| 🏢 직장인 | 사무직 / 전문직 / 공무원 / 관리직 | 문서 / 이메일 / 데이터 / PPT |
| 🏪 자영업·소상공인 | 요식업 / 판매업 / 서비스업 / 공방 | SNS홍보 / 고객응대 / 상품설명 / 플랫폼 |
| 🎨 프리랜서·크리에이터 | 디자이너 / 작가·번역 / 유튜버 / 강사 | 기획 / 글쓰기 / 비주얼 / 클라이언트 |
| 🏠 주부·육아 | 전업주부 / 영유아 / 초등이상 / 복귀준비 | 육아정보 / 집안일 / 재취업 / 자기계발 |
| 🌿 시니어 (50대+) | 현직 / 은퇴여가 / 재취업·창업 / 손자녀 | 카카오톡 / 유튜브 / 쇼핑 / 뉴스 |
| 💻 IT·개발·데이터 | — | 🥚 이스터에그 페이지 |

---

## 🛠 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend + Backend | Next.js 14 (App Router + Server Actions) |
| AI / LLM | Google Gemini API (Streaming) |
| 정적 데이터 | JSON 파일 (서버 메모리 캐싱) |
| 배포 | Vercel |
| Analytics | Vercel Analytics / GA4 |
| 공유 | Kakao SDK (카카오톡 공유) |

---

## 🏗 시스템 아키텍처

```
[Client: Next.js]
     │
     │  설문 응답 submit
     ▼
[Server Action]
     ├── ① 객관식 데이터 → 매칭 로직 (JSON 인메모리, 즉시 처리)
     └── ② 주관식 고민   → Gemini API (Streaming, 2~4초)
                              │
                              ▼
                     [결과 조합 → Client로 스트리밍 반환]
```

**⚡ 응답 속도 전략**
- 객관식 매칭은 JSON 인메모리 처리로 **즉시** 반환
- Gemini 프롬프트 생성은 **Streaming** 방식으로 첫 글자부터 화면에 출력 → 체감 대기 시간 최소화
- 로딩 중 동적 애니메이션으로 이탈 방지

---

## 📁 프로젝트 구조

```
find-my-ai/
├── app/
│   ├── page.tsx                  # 랜딩 페이지
│   ├── survey/
│   │   └── page.tsx              # 설문 진행 페이지
│   ├── result/
│   │   └── page.tsx              # 결과 페이지
│   ├── easter-egg/
│   │   └── page.tsx              # IT 직군 이스터에그 페이지 🥚
│   └── api/
│       └── match/
│           └── route.ts          # 매칭 API (Server Action)
├── components/
│   ├── survey/
│   │   ├── QuestionCard.tsx      # 질문 카드 컴포넌트
│   │   ├── GridSelect.tsx        # 대분류 그리드 선택 UI
│   │   └── ProgressBar.tsx       # 진행률 표시
│   └── result/
│       ├── AiCard.tsx            # AI 추천 결과 카드
│       ├── PromptBox.tsx         # 맞춤 프롬프트 출력 (스트리밍)
│       └── ShareButtons.tsx      # 공유 버튼 (카카오·링크)
├── data/
│   ├── ai-tools.json             # AI 도구 9종 정보 및 매칭 가중치
│   ├── questions.json            # 질문 흐름, 선택지, 분기 로직 전체
│   └── matching-rules.json       # 직종별·꼬리질문별 상세 매칭 룰셋
├── lib/
│   ├── matcher.ts                # 가중치 합산 매칭 로직
│   └── gemini.ts                 # Gemini Streaming API 연동
└── public/
    └── characters/               # AI 캐릭터 이미지 (Phase 2 추가 예정)
```

---

## 🚀 개발 로드맵

### Phase 1 — MVP (핵심 로직 검증)
- [ ] 랜딩 페이지 UI/UX 설계
- [ ] `/data` JSON 파일 구축 (`ai-tools` / `questions` / `matching-rules`)
- [ ] 설문 폼 컴포넌트 구현 (분기 없는 단순 버전)
- [ ] Gemini API 연동 및 Server Action 구성
- [ ] 결과 페이지 레이아웃 구현

### Phase 2 — 고도화 (개인화 & 디자인)
- [ ] 직업 2단계 선택 + 꼬리질문 분기 처리 (Dynamic Decision Tree)
- [ ] 이스터에그 페이지 구현 (개발자·데이터 분석가 각각 다른 메시지)
- [ ] Gemini 프롬프트 엔지니어링 정교화 (직업군별 few-shot 예시 삽입)
- [ ] Streaming 응답 연동 및 타이핑 애니메이션 적용
- [ ] MBTI 결과 한 줄 코멘트 반영
- [ ] 카카오톡 공유 / 링크 복사 기능
- [ ] AI 캐릭터 일러스트 제작 및 연동
- [ ] 모바일 UX 집중 점검 (시니어·자영업자 타겟)

### Phase 3 — 배포 & 운영
- [ ] Vercel 배포 및 환경 변수 설정
- [ ] Vercel Analytics / GA4 연동 (직종별 고민 패턴 분석)
- [ ] 타겟 페르소나 대상 클로즈 베타 테스트
- [ ] (Optional) 수익화 배너 검토

---

## ⚙️ 시작하기

```bash
# 레포 클론
git clone https://github.com/your-username/find-my-ai.git
cd find-my-ai

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local에 아래 키 입력

# 개발 서버 실행
npm run dev
```

### 환경 변수

```env
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_KAKAO_JS_KEY=your_kakao_js_key
```

---

## 📦 데이터 파일 구조

모든 콘텐츠 데이터는 `/data` 폴더의 JSON 파일로 관리합니다.  
코드 수정 없이 질문·AI 정보·매칭 로직을 자유롭게 변경할 수 있습니다.

| 파일 | 역할 | 주요 필드 |
|------|------|----------|
| `ai-tools.json` | AI 9종 정보 | `strengths`, `accessInfo`, `matchingWeight`, `samplePromptTemplate` |
| `questions.json` | 설문 흐름 전체 | `flow`, `options`, `next`(분기), `placeholder`, `mbtiHints` |
| `matching-rules.json` | 매칭 가중치 룰 | `weights`, `rules`, `resultMessages`, `easterEggCondition` |

---

## 🤝 기여 방법

1. 이 저장소를 Fork합니다.
2. 새 브랜치를 생성합니다. (`git checkout -b feat/your-feature`)
3. 변경 사항을 커밋합니다. (`git commit -m 'feat: 기능 설명'`)
4. 브랜치에 Push합니다. (`git push origin feat/your-feature`)
5. Pull Request를 열어주세요.

---

## 📄 라이선스

MIT License © 2025 find-my-ai