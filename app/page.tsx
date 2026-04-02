import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <p className="text-4xl">🔍</p>
          <h1 className="text-3xl font-bold text-white leading-snug">
            내 AI 타입 찾기
          </h1>
          <p className="text-blue-200 text-base leading-relaxed">
            내 성향엔 어떤 AI가 맞을까?<br />
            2분 안에 내 타입을 찾고 맞춤 프롬프트까지 받아보세요
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/survey" className="block">
            <Button className="w-full h-14 text-lg font-bold bg-white text-blue-700 hover:bg-blue-50">
              내 AI 타입 알아보기 →
            </Button>
          </Link>
          <p className="text-blue-300 text-sm">약 2분 소요 · 8문항</p>
        </div>

        <div className="space-y-3 pt-2">
          <p className="text-xs text-blue-400 uppercase tracking-widest">이런 때 써보세요</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { emoji: '📊', label: '보고서·업무 정리' },
              { emoji: '🎮', label: '게임·취미 정보' },
              { emoji: '✈️', label: '여행·일정 계획' },
            ].map((item) => (
              <div key={item.label} className="text-center space-y-1 cursor-default">
                <p className="text-2xl">{item.emoji}</p>
                <p className="text-xs text-blue-200">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
