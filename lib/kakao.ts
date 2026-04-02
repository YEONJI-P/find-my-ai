import type { RankedAI } from '@/lib/types'

declare global {
  interface Window {
    Kakao: {
      isInitialized: () => boolean
      init: (key: string) => void
      Share: {
        sendDefault: (params: KakaoFeedParams) => void
      }
    }
  }
}

type KakaoLink = {
  webUrl: string
  mobileWebUrl: string
}

type KakaoFeedParams = {
  objectType: 'feed'
  content: {
    title: string
    description: string
    imageUrl: string
    imageWidth: number
    imageHeight: number
    link: KakaoLink
  }
  buttons: Array<{ title: string; link: KakaoLink }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://find-my-ai-wine.vercel.app'
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`
const DEFAULT_IMAGE_WIDTH = 1200
const DEFAULT_IMAGE_HEIGHT = 630
const CHARACTER_IMAGE_SIZE = 200

export function buildShareParams(ai: RankedAI): KakaoFeedParams {
  const raw = ai.resultMessage ?? ''
  const description = raw.length > 30 ? `"${raw.slice(0, 30).trimEnd()}..."` : `"${raw}"`

  const hasCharacter = Boolean(ai.id)
  const imageUrl = hasCharacter ? `${SITE_URL}/characters/${ai.id}.png` : DEFAULT_IMAGE
  const imageWidth = hasCharacter ? CHARACTER_IMAGE_SIZE : DEFAULT_IMAGE_WIDTH
  const imageHeight = hasCharacter ? CHARACTER_IMAGE_SIZE : DEFAULT_IMAGE_HEIGHT

  const link: KakaoLink = { webUrl: SITE_URL, mobileWebUrl: SITE_URL }

  return {
    objectType: 'feed',
    content: {
      title: `내 AI 궁합 1위는 ${ai.name}이에요! 🥇`,
      description,
      imageUrl,
      imageWidth,
      imageHeight,
      link,
    },
    buttons: [{ title: '나도 AI 찾아보기 →', link }],
  }
}

export function shareToKakao(ai: RankedAI) {
  if (typeof window === 'undefined') return

  if (!window.Kakao) {
    console.warn('[Kakao] SDK not loaded yet')
    return
  }

  if (!window.Kakao.isInitialized()) {
    const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
    if (!key) {
      console.warn('[Kakao] NEXT_PUBLIC_KAKAO_JS_KEY not set')
      return
    }
    window.Kakao.init(key)
  }

  window.Kakao.Share.sendDefault(buildShareParams(ai))
}
