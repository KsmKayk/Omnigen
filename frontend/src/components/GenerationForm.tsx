'use client'

import { useState } from 'react'
import { Button } from './ui/Button'
import type { VideoType } from '../types'

interface GenerationFormProps {
  onSubmit: (theme: string, videoType: VideoType) => void
  disabled: boolean
}

export function GenerationForm({ onSubmit, disabled }: GenerationFormProps) {
  const [theme, setTheme] = useState('')
  const [videoType, setVideoType] = useState<VideoType>('short')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!theme.trim()) {
      setError('Informe um tema para o vídeo')
      return
    }
    setError('')
    onSubmit(theme.trim(), videoType)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5" noValidate>
      <div>
        <label htmlFor="theme" className="block text-sm font-medium text-near-black mb-1.5">
          Tema do vídeo
        </label>
        <input
          id="theme"
          type="text"
          value={theme}
          onChange={(e) => { setTheme(e.target.value); setError('') }}
          placeholder="Ex: Zeus, Cleopatra, Revolução Francesa..."
          disabled={disabled}
          className="w-full rounded-button border border-border-gray bg-white px-4 py-3 text-base text-near-black placeholder:text-silver-blue focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
        />
        {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
      </div>

      <fieldset>
        <legend className="block text-sm font-medium text-near-black mb-2">
          Tipo de vídeo
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {(['short', 'long'] as const).map((type) => (
            <label
              key={type}
              className={`relative flex cursor-pointer flex-col rounded-button border-2 p-4 transition-colors ${
                videoType === type
                  ? 'border-brand bg-brand-subtle'
                  : 'border-border-gray bg-white hover:border-silver-blue'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                name="videoType"
                value={type}
                checked={videoType === type}
                onChange={() => setVideoType(type)}
                disabled={disabled}
                className="sr-only"
              />
              <span className="text-sm font-semibold text-near-black">
                {type === 'short' ? 'Vídeo Curto' : 'Vídeo Longo'}
              </span>
              <span className="text-xs text-cool-gray mt-0.5">
                {type === 'short' ? '9:16 · 45–60s' : '16:9 · 10–12min'}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Button type="submit" disabled={disabled} className="w-full">
        Gerar Vídeo
      </Button>
    </form>
  )
}
