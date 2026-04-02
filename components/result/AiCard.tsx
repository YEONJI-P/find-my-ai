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

function CharacterBanner({ ai }: { ai: RankedAI }) {
  const [imgError, setImgError] = useState(false)
  const gradient = CHARACTER_GRADIENTS[ai.id] ?? DEFAULT_GRADIENT

  if (imgError) {
    return (
      <div
        data-character-placeholder=""
        className={`w-full bg-gradient-to-br ${gradient} flex items-center justify-center text-6xl rounded-t-xl`}
        style={{ height: 160 }}
      >
        🤖
      </div>
    )
  }

  return (
    <div className="w-full rounded-t-xl overflow-hidden aspect-square" >
      <Image
        src={`/characters/${ai.id}.png`}
        alt={`${ai.name} 캐릭터`}
        width={400}
        height={400}
        className="w-full h-full object-contain"
        onError={() => setImgError(true)}
      />
    </div>
  )
}

export default function AiCard({ ai, isTop }: AiCardProps) {
  return (
    <Card
      className={`border-2 ${RANK_STYLES[ai.rank]} ${isTop ? 'shadow-lg overflow-hidden' : ''}`}
      {...(isTop ? { 'data-share-card': '' } : {})}
    >
      {isTop && <CharacterBanner ai={ai} />}

      <CardContent className={`p-4 space-y-3 `}>
        <div className={`flex items-center justify-between`}>
          <span className="text-sm font-semibold text-gray-500">{RANK_LABELS[ai.rank]}</span>
          <Badge variant="secondary">{ai.badge}</Badge>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900">{ai.name}</h3>
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
