import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <p className="text-4xl">🔍</p>
          <h1 className="text-3xl font-bold text-white leading-snug">
            내게 맞는 AI가<br />
            뭔지 모르겠어요
          </h1>
          <p className="text-blue-200 text-base leading-relaxed">
            2분 설문으로 나에게 딱 맞는 AI 도구를 찾고<br />
            바로 쓸 수 있는 맞춤 프롬프트까지 받아보세요
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/survey" className="block">
            <Button className="w-full h-14 text-lg font-bold bg-white text-blue-700 hover:bg-blue-50">
              내 AI 찾기 시작 ✨
            </Button>
          </Link>
          <p className="text-blue-300 text-sm">약 2분 소요 · 8문항</p>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4">
          {[
            { emoji: '🎓', label: '학생·취준생' },
            { emoji: '🏪', label: '자영업자' },
            { emoji: '🌿', label: '시니어' },
          ].map((item) => (
            <div key={item.label} className="text-center space-y-1">
              <p className="text-2xl">{item.emoji}</p>
              <p className="text-xs text-blue-200">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
