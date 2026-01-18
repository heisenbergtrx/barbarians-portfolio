'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-barbar-bg flex flex-col">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo & Title */}
          <div className="text-center mb-10 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 mb-6 shadow-lg shadow-amber-500/20">
              <span className="text-4xl font-bold text-barbar-bg">B</span>
            </div>
            <h1 className="text-3xl font-bold text-barbar-text mb-2">
              Barbarians Portfolio
            </h1>
            <p className="text-barbar-muted">
              Profesyonel Portföy Yönetimi
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-barbar-card border border-barbar-border rounded-2xl p-8 animate-slide-up animate-delay-100">
            <h2 className="text-xl font-semibold text-barbar-text mb-6 text-center">
              Giriş Yap
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleGoogleLogin}
              loading={loading}
              variant="secondary"
              size="lg"
              className="w-full"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google ile Giriş Yap
            </Button>

            <p className="mt-6 text-center text-xs text-barbar-muted">
              Giriş yaparak{' '}
              <a href="#" className="text-amber-500 hover:underline">
                Kullanım Şartları
              </a>
              &apos;nı kabul etmiş olursunuz.
            </p>
          </div>

          {/* Quote */}
          <p className="mt-8 text-center text-sm text-barbar-muted italic animate-fade-in animate-delay-200">
            &ldquo;The goal of a successful trader is to make the best trades. Money is secondary.&rdquo;
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative py-4 text-center text-xs text-barbar-muted">
        © {new Date().getFullYear()} Barbarians Trading
      </footer>
    </div>
  )
}
