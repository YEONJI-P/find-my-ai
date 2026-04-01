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

export function initKakao() {
  const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
  if (!key) return
  if (window.Kakao?.isInitialized()) return
  window.Kakao?.init(key)
}

export function buildShareParams(ai: RankedAI): KakaoShareParams {
  const raw = ai.resultMessage
  const truncated = raw.length > 23 ? `"${raw.slice(0, 23)}..."` : `"${raw}"`
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
