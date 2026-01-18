'use client'

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  }

  return (
    <div
      className={`${sizeClasses[size]} border-barbar-border border-t-amber-500 rounded-full animate-spin`}
    />
  )
}

export function LoadingScreen() {
  const quotes = [
    "\"Risk comes from not knowing what you're doing.\" - Warren Buffett",
    "\"The stock market is a device to transfer money from the impatient to the patient.\"",
    "\"In investing, what is comfortable is rarely profitable.\" - Robert Arnott",
    "\"Time in the market beats timing the market.\"",
    "\"Be fearful when others are greedy.\" - Warren Buffett",
  ]

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]

  return (
    <div className="min-h-screen bg-barbar-bg flex flex-col items-center justify-center p-6">
      <div className="relative mb-8">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl animate-pulse-slow" />
        
        {/* Logo placeholder */}
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
          <span className="text-3xl font-bold text-barbar-bg">B</span>
        </div>
      </div>

      <Spinner size="lg" />

      <p className="mt-8 text-barbar-muted text-center max-w-md text-sm italic">
        {randomQuote}
      </p>
    </div>
  )
}
