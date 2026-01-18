import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] })
  }

  try {
    // Yahoo Finance search API
    const response = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&listsCount=0`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Yahoo Finance API error')
    }

    const data = await response.json()
    
    // Filter and map results
    const results = (data.quotes || [])
      .filter((q: any) => 
        q.quoteType === 'EQUITY' || 
        q.quoteType === 'ETF' ||
        q.quoteType === 'CRYPTOCURRENCY'
      )
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        type: q.quoteType === 'CRYPTOCURRENCY' ? 'crypto' : 'stock',
        exchange: q.exchange,
      }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ results: [], error: 'Search failed' })
  }
}
