# Result Page — 캐릭터 이미지 & 공유 기능 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 결과 페이지 Top1 카드에 캐릭터 이미지 섹션을 추가하고, 카카오톡 공유 / 이미지 저장 / 링크 복사 기능을 구현한다.

**Architecture:** `AiCard`에 캐릭터 이미지 영역을 추가하고, 별도 `ShareButtons` 컴포넌트가 세 가지 공유 수단을 담당한다. 카카오 SDK는 `lib/kakao.ts`에서 초기화하고 `layout.tsx`에서 스크립트를 로드한다. 이미지 저장은 `html2canvas`로 Top1 카드 DOM을 캡처한다.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, html2canvas, Kakao JavaScript SDK

---

## 파일 변경 범위

| 파일 | 상태 | 역할 |
|------|------|------|
| `components/result/AiCard.tsx` | 수정 | 캐릭터 이미지 섹션, `data-share-card` attr 추가 |
| `components/result/ShareButtons.tsx` | 신규 | 공유 버튼 3개 (카카오/이미지/링크) |
| `app/result/page.tsx` | 수정 | ShareButtons 렌더링 |
| `lib/kakao.ts` | 신규 | Kakao SDK 초기화 + 공유 유틸 |
| `app/layout.tsx` | 수정 | Kakao SDK `<Script>` 로드 |
| `__tests__/components/ShareButtons.test.tsx` | 신규 | ShareButtons 단위 테스트 |
| `__tests__/components/AiCard.test.tsx` | 신규 | AiCard 캐릭터 이미지 렌더링 테스트 |
| `__tests__/lib/kakao.test.ts` | 신규 | kakao 유틸 단위 테스트 |

---

## Task 1: html2canvas 설치

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 패키지 설치**

```bash
cd /home/yeon/projects/find-my-ai
npm install html2canvas
npm install --save-dev @types/html2canvas
```

- [ ] **Step 2: 설치 확인**

```bash
node -e "require('html2canvas'); console.log('ok')"
```

Expected output: `ok`

- [ ] **Step 3: 커밋**

```bash
git add package.json package-lock.json
git commit -m "chore: html2canvas 설치"
```

---

## Task 2: Kakao SDK 유틸 작성

**Files:**
- Create: `lib/kakao.ts`
- Create: `__tests__/lib/kakao.test.ts`

- [ ] **Step 1: 테스트 작성**

`__tests__/lib/kakao.test.ts`:

```typescript
import { buildShareParams } from '@/lib/kakao'

const mockAI = {
  rank: 1 as const,
  id: 'claude',
  name: 'Claude',
  badge: '글쓰기',
  shortDescription: '글쓰기·분석에 강한 AI',
  strengths: [],
  accessInfo: { platform: [], signupRequired: false, freeAvailable: true, url: '' },
  resultMessage: '복잡한 내용도 차분하게 정리해주는 AI예요. 분석적인 사고가 필요한 작업에서 빛을 발해요.',
}

describe('buildShareParams', () => {
  it('title에 AI 이름을 포함한다', () => {
    const params = buildShareParams(mockAI)
    expect(params.content.title).toContain('Claude')
  })

  it('description은 resultMessage 앞 30자 + 말줄임이다', () => {
    const params = buildShareParams(mockAI)
    expect(params.content.description).toBe('"복잡한 내용도 차분하게 정리해주는 AI예요..."')
  })

  it('resultMessage가 30자 이하면 말줄임 없이 그대로다', () => {
    const short = { ...mockAI, resultMessage: '짧은 코멘트' }
    const params = buildShareParams(short)
    expect(params.content.description).toBe('"짧은 코멘트"')
  })

  it('buttonTitle은 나도 테스트하기다', () => {
    const params = buildShareParams(mockAI)
    expect(params.buttons[0].title).toBe('나도 테스트하기 →')
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd /home/yeon/projects/find-my-ai
npx jest __tests__/lib/kakao.test.ts
```

Expected: FAIL (모듈 없음)

- [ ] **Step 3: `lib/kakao.ts` 작성**

```typescript
import type { RankedAI } from '@/lib/types'

declare global {
  interface Window {
    Kakao: {
      isInitialized: () => boolean
      init: (key: string) => void
      Share: {
        sendDefault: (params: KakaoShareParams) => void
      }
    }
  }
}

type KakaoShareParams = {
  objectType: 'feed'
  content: {
    title: string
    description: string
    imageUrl: string
    link: { mobileWebUrl: string; webUrl: string }
  }
  buttons: Array<{ title: string; link: { mobileWebUrl: string; webUrl: string } }>
}

const SITE_URL = 'https://find-my-ai.vercel.app'
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`

export function initKakao() {
  const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
  if (!key) return
  if (window.Kakao?.isInitialized()) return
  window.Kakao?.init(key)
}

export function buildShareParams(ai: RankedAI): KakaoShareParams {
  const raw = ai.resultMessage
  const truncated = raw.length > 30 ? `"${raw.slice(0, 30)}..."` : `"${raw}"`
  const link = { mobileWebUrl: SITE_URL, webUrl: SITE_URL }
  const imageUrl = `${SITE_URL}/characters/${ai.id}.png`

  return {
    objectType: 'feed',
    content: {
      title: `내 AI는 ${ai.name} 🥇`,
      description: truncated,
      imageUrl,
      link,
    },
    buttons: [{ title: '나도 테스트하기 →', link }],
  }
}

export function shareToKakao(ai: RankedAI) {
  initKakao()
  window.Kakao?.Share.sendDefault(buildShareParams(ai))
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
npx jest __tests__/lib/kakao.test.ts
```

Expected: PASS (4개 테스트)

- [ ] **Step 5: 커밋**

```bash
git add lib/kakao.ts __tests__/lib/kakao.test.ts
git commit -m "feat: Kakao 공유 유틸 추가"
```

---

## Task 3: layout.tsx에 Kakao SDK 스크립트 추가

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Script import 추가 및 스크립트 삽입**

`app/layout.tsx`를 다음과 같이 수정:

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI 궁합 테스트",
  description: "2분 설문으로 나에게 딱 맞는 AI 도구를 찾고, 바로 쓸 수 있는 맞춤 프롬프트까지 받아보세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
          integrity="sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: 빌드 에러 없는지 확인**

```bash
cd /home/yeon/projects/find-my-ai
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add app/layout.tsx
git commit -m "feat: layout에 Kakao SDK 스크립트 추가"
```

---

## Task 4: AiCard에 캐릭터 이미지 섹션 추가

**Files:**
- Modify: `components/result/AiCard.tsx`
- Create: `__tests__/components/AiCard.test.tsx`

- [ ] **Step 1: 테스트 작성**

`__tests__/components/AiCard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import AiCard from '@/components/result/AiCard'
import type { RankedAI } from '@/lib/types'

const mockAI: RankedAI = {
  rank: 1,
  id: 'claude',
  name: 'Claude',
  badge: '글쓰기',
  shortDescription: '글쓰기·분석에 강한 AI',
  strengths: ['긴 문서 요약', '코드 작성'],
  accessInfo: { platform: ['web'], signupRequired: true, freeAvailable: true, url: 'https://claude.ai' },
  resultMessage: '복잡한 내용도 차분하게 정리해 주는 AI예요.',
}

describe('AiCard', () => {
  it('isTop=true일 때 캐릭터 이미지 영역을 렌더링한다', () => {
    render(<AiCard ai={mockAI} isTop={true} />)
    const img = screen.queryByAltText('Claude 캐릭터')
    // 이미지 또는 플레이스홀더 div가 있어야 한다
    const placeholder = document.querySelector('[data-character-placeholder]')
    expect(img || placeholder).not.toBeNull()
  })

  it('isTop=false일 때 캐릭터 이미지 영역을 렌더링하지 않는다', () => {
    render(<AiCard ai={{ ...mockAI, rank: 2 }} isTop={false} />)
    expect(screen.queryByAltText('Claude 캐릭터')).toBeNull()
    expect(document.querySelector('[data-character-placeholder]')).toBeNull()
  })

  it('isTop=true일 때 data-share-card 속성이 있다', () => {
    render(<AiCard ai={mockAI} isTop={true} />)
    expect(document.querySelector('[data-share-card]')).not.toBeNull()
  })

  it('AI 이름이 표시된다', () => {
    render(<AiCard ai={mockAI} isTop={true} />)
    expect(screen.getByText('Claude')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npx jest __tests__/components/AiCard.test.tsx
```

Expected: FAIL

- [ ] **Step 3: AiCard.tsx 수정**

```typescript
'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { RankedAI } from '@/lib/types'

interface AiCardProps {
  ai: RankedAI
  isTop?: boolean
}

const RANK_STYLES = {
  1: 'border-yellow-400 bg-yellow-50',
  2: 'border-gray-300 bg-gray-50',
  3: 'border-orange-300 bg-orange-50',
}

const RANK_LABELS = {
  1: '🥇 1위 추천',
  2: '🥈 2위',
  3: '🥉 3위',
}

const CHARACTER_GRADIENTS: Record<string, string> = {
  claude: 'from-purple-500 to-indigo-600',
  chatgpt: 'from-emerald-500 to-green-600',
  gemini: 'from-blue-500 to-blue-700',
}
const DEFAULT_GRADIENT = 'from-gray-400 to-gray-600'

function CharacterImage({ ai }: { ai: RankedAI }) {
  const [imgError, setImgError] = useState(false)
  const gradient = CHARACTER_GRADIENTS[ai.id] ?? DEFAULT_GRADIENT

  if (imgError) {
    return (
      <div
        data-character-placeholder
        className={`w-22 h-22 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-4xl mx-auto mb-3`}
        style={{ width: 88, height: 88 }}
      >
        🤖
      </div>
    )
  }

  return (
    <div className="mx-auto mb-3" style={{ width: 88, height: 88 }}>
      <Image
        src={`/characters/${ai.id}.png`}
        alt={`${ai.name} 캐릭터`}
        width={88}
        height={88}
        className="rounded-2xl object-cover"
        onError={() => setImgError(true)}
      />
    </div>
  )
}

export default function AiCard({ ai, isTop }: AiCardProps) {
  return (
    <Card
      className={`border-2 ${RANK_STYLES[ai.rank]} ${isTop ? 'shadow-lg' : ''}`}
      {...(isTop ? { 'data-share-card': '' } : {})}
    >
      <CardContent className={`p-4 space-y-3 ${isTop ? 'text-center' : ''}`}>
        <div className={`flex items-center ${isTop ? 'justify-center' : 'justify-between'}`}>
          <span className="text-sm font-semibold text-gray-500">{RANK_LABELS[ai.rank]}</span>
          {!isTop && <Badge variant="secondary">{ai.badge}</Badge>}
        </div>

        {isTop && <CharacterImage ai={ai} />}

        <div>
          <h3 className="text-lg font-bold text-gray-900">{ai.name}</h3>
          {isTop && <Badge variant="secondary" className="mt-1">{ai.badge}</Badge>}
          <p className="text-sm text-gray-600 mt-1">{ai.shortDescription}</p>
        </div>

        {!isTop && (
          <ul className="space-y-1">
            {ai.strengths.map((s, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2">
                <span className="text-blue-500">✓</span>
                {s}
              </li>
            ))}
          </ul>
        )}

        {isTop && ai.resultMessage && (
          <p className="text-sm text-blue-700 bg-blue-50 rounded-lg p-3 text-left">{ai.resultMessage}</p>
        )}

        <a
          href={ai.accessInfo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-sm font-medium text-blue-600 hover:text-blue-800 underline"
        >
          {ai.name} 시작하기 →
        </a>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
npx jest __tests__/components/AiCard.test.tsx
```

Expected: PASS (4개 테스트)

- [ ] **Step 5: 커밋**

```bash
git add components/result/AiCard.tsx __tests__/components/AiCard.test.tsx
git commit -m "feat: AiCard top1에 캐릭터 이미지 섹션 추가"
```

---

## Task 5: ShareButtons 컴포넌트 작성

**Files:**
- Create: `components/result/ShareButtons.tsx`
- Create: `__tests__/components/ShareButtons.test.tsx`

- [ ] **Step 1: 테스트 작성**

`__tests__/components/ShareButtons.test.tsx`:

```typescript
import { render, screen, fireEvent, act } from '@testing-library/react'
import ShareButtons from '@/components/result/ShareButtons'
import type { RankedAI } from '@/lib/types'

// html2canvas mock
jest.mock('html2canvas', () => jest.fn().mockResolvedValue({
  toDataURL: () => 'data:image/png;base64,abc'
}))

// kakao mock
jest.mock('@/lib/kakao', () => ({
  shareToKakao: jest.fn(),
}))

const mockAI: RankedAI = {
  rank: 1,
  id: 'claude',
  name: 'Claude',
  badge: '글쓰기',
  shortDescription: '글쓰기·분석에 강한 AI',
  strengths: [],
  accessInfo: { platform: [], signupRequired: false, freeAvailable: true, url: '' },
  resultMessage: '좋은 AI예요.',
}

describe('ShareButtons', () => {
  it('카카오톡, 이미지 저장, 링크 복사 버튼을 렌더링한다', () => {
    render(<ShareButtons topAI={mockAI} />)
    expect(screen.getByText('카카오톡')).toBeInTheDocument()
    expect(screen.getByText('이미지 저장')).toBeInTheDocument()
    expect(screen.getByText('링크 복사')).toBeInTheDocument()
  })

  it('링크 복사 버튼 클릭 시 clipboard에 URL을 쓴다', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    })
    render(<ShareButtons topAI={mockAI} />)
    await act(async () => {
      fireEvent.click(screen.getByText('링크 복사').closest('button')!)
    })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.href)
  })

  it('링크 복사 후 버튼 라벨이 "확인 ✓"로 바뀐다', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    })
    render(<ShareButtons topAI={mockAI} />)
    await act(async () => {
      fireEvent.click(screen.getByText('링크 복사').closest('button')!)
    })
    expect(screen.getByText('확인 ✓')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npx jest __tests__/components/ShareButtons.test.tsx
```

Expected: FAIL (모듈 없음)

- [ ] **Step 3: ShareButtons.tsx 작성**

```typescript
'use client'

import { useState } from 'react'
import { shareToKakao } from '@/lib/kakao'
import type { RankedAI } from '@/lib/types'

interface ShareButtonsProps {
  topAI: RankedAI
}

async function saveAsImage() {
  const card = document.querySelector('[data-share-card]') as HTMLElement | null
  if (!card) return
  const html2canvas = (await import('html2canvas')).default
  const canvas = await html2canvas(card, { useCORS: true })
  const link = document.createElement('a')
  link.download = `my-ai-${Date.now()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export default function ShareButtons({ topAI }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        결과 공유하기
      </p>
      <div className="flex justify-center gap-6">
        <button
          onClick={() => shareToKakao(topAI)}
          className="flex flex-col items-center gap-1.5"
        >
          <span className="w-13 h-13 flex items-center justify-center bg-[#FEE500] rounded-full text-2xl shadow-sm"
            style={{ width: 52, height: 52 }}>
            💬
          </span>
          <span className="text-xs text-gray-500">카카오톡</span>
        </button>

        <button
          onClick={saveAsImage}
          className="flex flex-col items-center gap-1.5"
        >
          <span className="flex items-center justify-center bg-blue-50 rounded-full text-2xl shadow-sm"
            style={{ width: 52, height: 52 }}>
            🖼️
          </span>
          <span className="text-xs text-gray-500">이미지 저장</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="flex flex-col items-center gap-1.5"
        >
          <span className="flex items-center justify-center bg-green-50 rounded-full text-2xl shadow-sm"
            style={{ width: 52, height: 52 }}>
            🔗
          </span>
          <span className="text-xs text-gray-500">{copied ? '확인 ✓' : '링크 복사'}</span>
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
npx jest __tests__/components/ShareButtons.test.tsx
```

Expected: PASS (3개 테스트)

- [ ] **Step 5: 커밋**

```bash
git add components/result/ShareButtons.tsx __tests__/components/ShareButtons.test.tsx
git commit -m "feat: ShareButtons 컴포넌트 추가 (카카오/이미지/링크)"
```

---

## Task 6: 결과 페이지에 ShareButtons 연결

**Files:**
- Modify: `app/result/page.tsx`

- [ ] **Step 1: ShareButtons import 및 렌더링 추가**

`app/result/page.tsx`를 다음과 같이 수정:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AiCard from '@/components/result/AiCard'
import PromptBox from '@/components/result/PromptBox'
import ShareButtons from '@/components/result/ShareButtons'
import { Button } from '@/components/ui/button'
import type { RankedAI, Answers } from '@/lib/types'

type SurveyResults = {
  rankedAIs: RankedAI[]
  answers: Answers
}

export default function ResultPage() {
  const router = useRouter()
  const [results, setResults] = useState<SurveyResults | null>(null)
  const [topResultMessage, setTopResultMessage] = useState('')

  useEffect(() => {
    const raw = sessionStorage.getItem('surveyResults')
    if (!raw) {
      router.replace('/survey')
      return
    }
    try {
      setResults(JSON.parse(raw))
    } catch {
      router.replace('/survey')
    }
  }, [router])

  if (!results) return null

  const { rankedAIs, answers } = results
  const topAI = rankedAIs[0]
  const otherAIs = rankedAIs.slice(1)
  const topAIWithMessage = topAI ? { ...topAI, resultMessage: topResultMessage } : topAI

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-1">
          <p className="text-sm text-blue-600 font-medium">분석 완료!</p>
          <h1 className="text-2xl font-bold text-gray-900">
            나에게 딱 맞는 AI는 {topAI?.name} 🎉
          </h1>
        </div>

        {topAIWithMessage && <AiCard ai={topAIWithMessage} isTop={true} />}

        {topAI && (
          <PromptBox
            topAI={topAI}
            answers={answers}
            onResultMessage={setTopResultMessage}
          />
        )}

        {topAIWithMessage && <ShareButtons topAI={topAIWithMessage} />}

        {otherAIs.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-bold text-gray-700">다른 추천 AI</h2>
            {otherAIs.map((ai) => (
              <AiCard key={ai.id} ai={ai} isTop={false} />
            ))}
          </div>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            sessionStorage.removeItem('surveyResults')
            router.push('/survey')
          }}
        >
          다시 테스트하기
        </Button>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: 타입 에러 없는지 확인**

```bash
cd /home/yeon/projects/find-my-ai
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 전체 테스트 실행**

```bash
npx jest
```

Expected: 모든 테스트 PASS

- [ ] **Step 4: 커밋**

```bash
git add app/result/page.tsx
git commit -m "feat: 결과 페이지에 ShareButtons 연결"
```

---

## Task 7: 환경변수 설정 안내

**Files:**
- (수동 작업) `.env.local`

- [ ] **Step 1: .env.local에 카카오 앱 키 추가**

카카오 디벨로퍼스(developers.kakao.com) → 내 애플리케이션 → 앱 키 → **JavaScript 키** 복사 후:

```bash
# .env.local (이미 존재하는 파일에 추가)
NEXT_PUBLIC_KAKAO_JS_KEY=여기에_JavaScript_키_입력
```

- [ ] **Step 2: 카카오 디벨로퍼스 플랫폼 설정**

내 애플리케이션 → 플랫폼 → Web 사이트 도메인 등록:
- `http://localhost:3000` (로컬 개발)
- `https://find-my-ai.vercel.app` (운영)

- [ ] **Step 3: 로컬 서버 실행 후 카카오 공유 수동 테스트**

```bash
npm run dev
```

브라우저에서 설문 완료 → 결과 페이지 → 💬 카카오톡 버튼 클릭 → 공유 팝업 확인

---

## Task 8: 캐릭터 이미지 추가 (자료 준비 후)

**Files:**
- Create: `public/characters/claude.png`
- Create: `public/characters/chatgpt.png`
- Create: `public/characters/gemini.png`
- (기타 AI ID에 맞는 파일명)

- [ ] **Step 1: 이미지 파일 배치**

```bash
ls /home/yeon/projects/find-my-ai/public/characters/
# claude.png, chatgpt.png, gemini.png 등이 있어야 함
```

- [ ] **Step 2: 로컬 서버에서 이미지 로딩 확인**

```bash
npm run dev
# 결과 페이지에서 캐릭터 이미지가 플레이스홀더 대신 표시되는지 확인
```

- [ ] **Step 3: next.config.ts에서 이미지 도메인 확인**

`next.config.ts`를 열어 외부 이미지 도메인이 필요한지 확인. `/characters/` 는 `public/` 로컬이므로 별도 설정 불필요.

- [ ] **Step 4: 커밋**

```bash
git add public/characters/
git commit -m "feat: AI 캐릭터 이미지 추가"
```
