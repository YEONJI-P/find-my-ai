# Result Page — 캐릭터 이미지 & 공유 기능 설계

**날짜:** 2026-04-01  
**범위:** Phase 2 — 결과 페이지 고도화 (공유 기능 + 캐릭터 이미지)

---

## 1. 개요

결과 페이지(`app/result/page.tsx`)의 Top1 AI 카드에 캐릭터 이미지 섹션을 추가하고, 카카오톡 공유 / 이미지 저장 / 링크 복사 기능을 도입한다.

---

## 2. 캐릭터 이미지 섹션

### 배치 방식: 중앙 정렬 카드형

`AiCard` 컴포넌트의 `isTop=true` 일 때만 렌더링한다.

```
┌─────────────────────────┐
│  🥇 1위 추천             │
│                         │
│       [캐릭터 이미지]    │  ← 88×88, border-radius: 20px
│         Claude          │
│    글쓰기·분석에 강한 AI │
│                         │
│  "Gemini 한줄 코멘트..." │
└─────────────────────────┘
```

- **이미지 소스:** `public/characters/{ai.id}.png` (예: `claude.png`, `chatgpt.png`)
- **이미지 미준비 시:** AI별 색상 그라데이션 + 🤖 이모지 플레이스홀더 표시
- **크기:** 88×88px, `border-radius: 20px`
- **AI별 색상 맵** (플레이스홀더용):

| AI ID | 그라데이션 |
|-------|-----------|
| claude | `#667eea → #764ba2` |
| chatgpt | `#10b981 → #059669` |
| gemini | `#3b82f6 → #1d4ed8` |
| others | `#9ca3af → #6b7280` |

---

## 3. 공유 기능

### 3-1. 공유 버튼 UI

위치: Top1 카드 아래, `다시 테스트하기` 버튼 위.

```
┌────────────────────────────────┐
│       결과 공유하기             │
│                                │
│  [💬]     [🖼️]     [🔗]       │
│ 카카오톡  이미지저장  링크복사  │
└────────────────────────────────┘
```

- 원형 버튼(52×52px), 라벨 아래 표기
- 별도 `ShareButtons` 컴포넌트로 분리 (`components/result/ShareButtons.tsx`)
- props: `topAI: RankedAI`, `resultMessage: string`

### 3-2. 카카오톡 공유

**Kakao JavaScript SDK** 사용 (`kakao.share.sendDefault`).

메시지 구성:

```
┌──────────────────────────┐
│ [썸네일 이미지]           │  ← public/characters/{ai.id}.png 또는 OG 이미지
│ 나에게 딱 맞는 AI는?      │  ← 제목
│ 내 AI는 {ai.name} 🥇     │  ← 설명 1줄
│ "{resultMessage 앞 30자}" │  ← 설명 2줄 (말줄임)
│ [나도 테스트하기 →]       │  ← CTA 버튼
└──────────────────────────┘
```

- SDK 초기화: `lib/kakao.ts` (앱 키 환경변수 `NEXT_PUBLIC_KAKAO_JS_KEY`)
- 공유 URL: `https://find-my-ai.vercel.app/` (결과 재현 불가이므로 메인 유입)
- SDK 스크립트는 `app/layout.tsx`에서 `<Script>` 로드

### 3-3. 이미지 저장

**html2canvas** 라이브러리로 Top1 카드 DOM을 캡처 후 PNG 다운로드.

- 캡처 대상: `data-share-card` attribute가 붙은 `AiCard` 래퍼 div
- 파일명: `my-ai-{ai.id}.png`
- 주의: `html2canvas`는 외부 이미지 CORS 제한 있음 → 캐릭터 이미지는 `public/` 로컬 제공 필수

### 3-4. 링크 복사

`navigator.clipboard.writeText(window.location.href)` 사용.  
복사 완료 시 버튼 라벨을 `확인 ✓`으로 1.5초간 변경 후 원복.

---

## 4. 파일 변경 범위

| 파일 | 변경 내용 |
|------|----------|
| `components/result/AiCard.tsx` | 캐릭터 이미지 섹션 추가, `data-share-card` attr 추가 |
| `components/result/ShareButtons.tsx` | 신규 생성 — 공유 버튼 3개 |
| `app/result/page.tsx` | `ShareButtons` 렌더링 추가 |
| `lib/kakao.ts` | 신규 생성 — SDK 초기화 + 공유 유틸 |
| `app/layout.tsx` | Kakao SDK `<Script>` 추가 |
| `public/characters/` | AI별 캐릭터 이미지 (업로드 예정) |
| `package.json` | `html2canvas` 의존성 추가 |

---

## 5. 환경변수

```
NEXT_PUBLIC_KAKAO_JS_KEY=your_kakao_js_app_key
```

`.env.local`에 추가. 카카오 디벨로퍼스에서 JavaScript 앱 키 발급 필요.

---

## 6. 제외 범위

- 카카오 로그인/인증 — 불필요
- 결과 URL 파라미터 공유 (결과 재현) — 현재 sessionStorage 구조상 제외
- 트위터/인스타 등 타 SNS 공유 — Phase 3 이후 검토
