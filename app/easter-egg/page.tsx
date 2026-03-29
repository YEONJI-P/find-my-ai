'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function EasterEggPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <p className="text-5xl">🖥️</p>
        <h1 className="text-2xl font-bold text-white">잠깐, 잠깐만요...</h1>
        <p className="text-gray-300 whitespace-pre-line leading-relaxed">
          {`혹시 지금 터미널 3개 켜놓고 이거 하고 계신 거 아니죠?\n\nAI 리터러시가 낮은 분들을 위한 서비스라\n당신에겐 해줄 말이 없어요 😅\n\nClaude Code 돌아가고 있을 텐데\n얼른 가서 PR이나 올리세요 🫡`}
        </p>
        <div className="space-y-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 px-4 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            GitHub 바로가기 →
          </a>
          <Button
            variant="ghost"
            className="w-full text-gray-400 hover:text-white"
            onClick={() => router.push('/survey')}
          >
            그래도 해볼래요 (처음으로)
          </Button>
        </div>
      </div>
    </main>
  )
}
