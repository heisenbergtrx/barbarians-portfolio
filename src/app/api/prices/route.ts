import { NextResponse } from 'next/server'
import { CachedPrices, MarketData } from '@/types'

// In-memory cache
let priceCache: CachedPrices | null = null
const CACHE_DURATION_MS = 15 * 60 * 1000 // 15 minutes

// Crypto symbol to CoinGecko ID mapping
const CRYPTO_MAP: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'USDC': 'usd-coin',
  'SOL': 'solana',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'AVAX': 'avalanche-2',
  'DOT': 'polkadot',
  'LINK': 'chainlink',
  'MATIC': 'matic-network',
}

// Stablecoin prices (always $1)
const STABLECOINS = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD']

async function fetchYahooFinancePrices(symbols: string[]): Promise<Record<string, MarketData>> {
  const prices: Record<string, MarketData> = {}
  
  if (symbols.length === 0) return prices
  
  try {
    const symbolsStr = symbols.join(',')
    const response = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsStr}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        cache: 'no-store',
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      const quotes = data.quoteResponse?.result || []
      
      for (const quote of quotes) {
        if (quote.regularMarketPrice) {
          prices[quote.symbol] = {
            symbol: quote.symbol,
            price: quote.regularMarketPrice,
            change24h: quote.regularMarketChangePercent || 0,
            currency: 'USD',
            lastUpdated: new Date().toISOString(),
          }
        }
      }
    } else {
      console.error('Yahoo Finance API error:', response.status)
    }
  } catch (error) {
    console.error('Error fetching Yahoo Finance:', error)
  }
  
  return prices
}

async function fetchCoinGeckoPrices(symbols: string[]): Promise<Record<string, MarketData>> {
  const prices: Record<string, MarketData> = {}
  
  // Handle stablecoins first
  for (const symbol of symbols) {
    if (STABLECOINS.includes(symbol)) {
      prices[symbol] = {
        symbol,
        price: 1,
        change24h: 0,
        currency: 'USD',
        lastUpdated: new Date().toISOString(),
      }
    }
  }
  
  // Get CoinGecko IDs for remaining cryptos
  const cryptoIds = symbols
    .filter(s => !STABLECOINS.includes(s))
    .map(s => CRYPTO_MAP[s])
    .filter(Boolean)
  
  if (cryptoIds.length === 0) return prices
  
  try {
    const idsStr = cryptoIds.join(',')
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${idsStr}&vs_currencies=usd&include_24hr_change=true`,
      { cache: 'no-store' }
    )
    
    if (response.ok) {
      const data = await response.json()
      
      for (const [id, values] of Object.entries(data)) {
        const v = values as { usd: number; usd_24h_change: number }
        // Find the symbol for this CoinGecko ID
        const symbol = Object.entries(CRYPTO_MAP).find(([_, cgId]) => cgId === id)?.[0]
        
        if (symbol) {
          prices[symbol] = {
            symbol,
            price: v.usd,
            change24h: v.usd_24h_change || 0,
            currency: 'USD',
            lastUpdated: new Date().toISOString(),
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching CoinGecko:', error)
  }
  
  return prices
}

async function fetchUSDTRY(): Promise<number> {
  try {
    const response = await fetch(
      'https://api.exchangerate-api.com/v4/latest/USD',
      { cache: 'no-store' }
    )
    
    if (response.ok) {
      const data = await response.json()
      return data.rates?.TRY || 34.5
    }
  } catch (error) {
    console.error('Error fetching USD/TRY:', error)
  }
  
  return 34.5
}

async function refreshPrices(symbols: string[]): Promise<CachedPrices> {
  console.log('Refreshing prices for:', symbols)
  
  // Separate symbols by type
  const stockSymbols: string[] = []
  const cryptoSymbols: string[] = []
  const tefasSymbols: string[] = []
  
  for (const symbol of symbols) {
    if (CRYPTO_MAP[symbol] || STABLECOINS.includes(symbol)) {
      cryptoSymbols.push(symbol)
    } else if (symbol.length <= 3 && /^[A-Z]+$/.test(symbol)) {
      // Likely TEFAS (3 letter Turkish fund codes)
      tefasSymbols.push(symbol)
    } else {
      stockSymbols.push(symbol)
    }
  }
  
  const [stockPrices, cryptoPrices, usdTry] = await Promise.all([
    fetchYahooFinancePrices(stockSymbols),
    fetchCoinGeckoPrices(cryptoSymbols),
    fetchUSDTRY(),
  ])
  
  // TEFAS funds - mark as needing manual price (no public API)
  const tefasPrices: Record<string, MarketData> = {}
  for (const symbol of tefasSymbols) {
    tefasPrices[symbol] = {
      symbol,
      price: 0, // Will use averageCost as fallback
      change24h: 0,
      currency: 'TRY',
      lastUpdated: new Date().toISOString(),
    }
  }
  
  const now = new Date()
  const expiresAt = new Date(now.getTime() + CACHE_DURATION_MS)
  
  const cache: CachedPrices = {
    prices: {
      ...stockPrices,
      ...cryptoPrices,
      ...tefasPrices,
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

export async function GET(request: Request) {
  try {
    // Get symbols from query params
    const { searchParams } = new URL(request.url)
    const symbolsParam = searchParams.get('symbols')
    const symbols = symbolsParam ? symbolsParam.split(',') : []
    
    // If no symbols provided and cache is valid, return cache
    if (symbols.length === 0 && isCacheValid() && priceCache) {
      return NextResponse.json({
        data: priceCache,
        cached: true,
      })
    }
    
    // If symbols provided but all are in cache, return cached data
    if (symbols.length > 0 && isCacheValid() && priceCache) {
      const allCached = symbols.every(s => priceCache!.prices[s] !== undefined)
      if (allCached) {
        return NextResponse.json({
          data: priceCache,
          cached: true,
        })
      }
    }
    
    // Refresh cache with requested symbols
    const freshData = await refreshPrices(symbols)
    
    return NextResponse.json({
      data: freshData,
      cached: false,
    })
  } catch (error) {
    console.error('Price API error:', error)
    
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
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const symbols = body.symbols || []
    
    const freshData = await refreshPrices(symbols)
    return NextResponse.json({
      data: freshData,
      cached: false,
    })
  } catch (error) {
    console.error('Price refresh error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh prices' },
      { status: 500 }
    )
  }
}
