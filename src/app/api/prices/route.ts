import { NextResponse } from 'next/server'
import { CachedPrices, MarketData } from '@/types'

// In-memory cache (will reset on cold start, but that's fine for 15min cache)
let priceCache: CachedPrices | null = null
const CACHE_DURATION_MS = 15 * 60 * 1000 // 15 minutes

// TEFAS fund codes - add your actual fund codes here
const TEFAS_FUNDS = ['TI2', 'TMG', 'IPB']

// US Stocks
const US_STOCKS = ['AAPL', 'GOOGL', 'MSFT', 'NVDA', 'TSLA', 'META', 'AMZN']

// Crypto
const CRYPTO_IDS = ['bitcoin', 'ethereum']

async function fetchTEFASPrices(): Promise<Record<string, MarketData>> {
  const prices: Record<string, MarketData> = {}
  
  // TEFAS API - using TEFAS public endpoint
  // Note: You may need to adjust this based on actual TEFAS API availability
  for (const fund of TEFAS_FUNDS) {
    try {
      // TEFAS doesn't have a public API, so we'll use a workaround
      // Option 1: Use a third-party service
      // Option 2: Scrape TEFAS website (not recommended)
      // Option 3: Manual entry / database storage
      
      // For now, we'll mark these as needing manual update
      // In production, you'd integrate with a proper TEFAS data provider
      prices[fund] = {
        symbol: fund,
        price: 0, // Will be fetched from database or manual input
        change24h: 0,
        currency: 'TRY',
        lastUpdated: new Date().toISOString(),
      }
    } catch (error) {
      console.error(`Error fetching TEFAS ${fund}:`, error)
    }
  }
  
  return prices
}

async function fetchUSStockPrices(): Promise<Record<string, MarketData>> {
  const prices: Record<string, MarketData> = {}
  
  try {
    // Using Yahoo Finance API via RapidAPI or direct endpoint
    // Free alternative: Alpha Vantage, Finnhub, or Yahoo Finance scraping
    
    // Yahoo Finance unofficial API
    const symbols = US_STOCKS.join(',')
    const response = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
        next: { revalidate: 900 }, // 15 minutes
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      const quotes = data.quoteResponse?.result || []
      
      for (const quote of quotes) {
        prices[quote.symbol] = {
          symbol: quote.symbol,
          price: quote.regularMarketPrice || 0,
          change24h: quote.regularMarketChangePercent || 0,
          currency: 'USD',
          lastUpdated: new Date().toISOString(),
        }
      }
    }
  } catch (error) {
    console.error('Error fetching US stocks:', error)
  }
  
  return prices
}

async function fetchCryptoPrices(): Promise<Record<string, MarketData>> {
  const prices: Record<string, MarketData> = {}
  
  try {
    // CoinGecko API (free tier: 10-30 calls/minute)
    const ids = CRYPTO_IDS.join(',')
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      {
        next: { revalidate: 900 }, // 15 minutes
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      
      for (const [id, values] of Object.entries(data)) {
        const v = values as { usd: number; usd_24h_change: number }
        const symbol = id === 'bitcoin' ? 'BTC' : id === 'ethereum' ? 'ETH' : id.toUpperCase()
        
        prices[symbol] = {
          symbol,
          price: v.usd,
          change24h: v.usd_24h_change || 0,
          currency: 'USD',
          lastUpdated: new Date().toISOString(),
        }
      }
    }
  } catch (error) {
    console.error('Error fetching crypto:', error)
  }
  
  return prices
}

async function fetchUSDTRY(): Promise<number> {
  try {
    // Using exchangerate-api or similar
    const response = await fetch(
      'https://api.exchangerate-api.com/v4/latest/USD',
      {
        next: { revalidate: 900 }, // 15 minutes
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      return data.rates?.TRY || 34.5 // Fallback rate
    }
  } catch (error) {
    console.error('Error fetching USD/TRY:', error)
  }
  
  return 34.5 // Fallback
}

async function refreshPrices(): Promise<CachedPrices> {
  console.log('Refreshing price cache...')
  
  const [tefas, stocks, crypto, usdTry] = await Promise.all([
    fetchTEFASPrices(),
    fetchUSStockPrices(),
    fetchCryptoPrices(),
    fetchUSDTRY(),
  ])
  
  const now = new Date()
  const expiresAt = new Date(now.getTime() + CACHE_DURATION_MS)
  
  const cache: CachedPrices = {
    prices: {
      ...tefas,
      ...stocks,
      ...crypto,
    },
    usdTry,
    lastUpdated: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  }
  
  priceCache = cache
  return cache
}

function isCacheValid(): boolean {
  if (!priceCache) return false
  const expiresAt = new Date(priceCache.expiresAt)
  return new Date() < expiresAt
}

export async function GET() {
  try {
    // Check if cache is valid
    if (isCacheValid() && priceCache) {
      return NextResponse.json({
        data: priceCache,
        cached: true,
      })
    }
    
    // Refresh cache
    const freshData = await refreshPrices()
    
    return NextResponse.json({
      data: freshData,
      cached: false,
    })
  } catch (error) {
    console.error('Price API error:', error)
    
    // Return stale cache if available
    if (priceCache) {
      return NextResponse.json({
        data: priceCache,
        cached: true,
        stale: true,
      })
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    )
  }
}

// Force refresh endpoint
export async function POST() {
  try {
    const freshData = await refreshPrices()
    return NextResponse.json({
      data: freshData,
      cached: false,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to refresh prices' },
      { status: 500 }
    )
  }
}
