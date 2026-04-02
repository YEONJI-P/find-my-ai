'use client'

import { useState } from 'react'
import { shareToKakao } from '@/lib/kakao'
import type { RankedAI } from '@/lib/types'

interface ShareButtonsProps {
  topAI: RankedAI
}

async function saveAsImage() {
  try {
    const card = document.querySelector('[data-share-card]') as HTMLElement | null
    if (!card) return
    const { toPng } = await import('html-to-image')
    const dataUrl = await toPng(card)
    const link = document.createElement('a')
    link.download = `my-ai-${Date.now()}.png`
    link.href = dataUrl
    link.click()
  } catch (error) {
    // Silently handle error
    console.error('Failed to save image:', error)
  }
}

export default function ShareButtons({ topAI }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
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
          <span className="flex items-center justify-center bg-[#FEE500] rounded-full text-2xl shadow-sm"
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
