import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This endpoint is called by Vercel Cron every Friday at 22:00 UTC
// Configure in vercel.json

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: Request) {
  // Verify cron secret (optional but recommended)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow in development or if no secret is set
    if (process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    // Use service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all users with assets
    const { data: users, error: usersError } = await supabase
      .from('assets')
      .select('user_id')
      .not('user_id', 'is', null)

    if (usersError) {
      throw usersError
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(users?.map(u => u.user_id) || [])]

    // Get current USD/TRY rate
    let usdTry = 34.5
    try {
      const rateRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
      if (rateRes.ok) {
        const rateData = await rateRes.json()
        usdTry = rateData.rates?.TRY || 34.5
      }
    } catch (e) {
      console.error('Error fetching USD/TRY:', e)
    }

    const now = new Date()
    const weekNumber = getWeekNumber(now)
    let snapshotsCreated = 0

    // Create snapshot for each user
    for (const userId of uniqueUserIds) {
      // Get user's assets
      const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', userId)

      if (assetsError || !assets || assets.length === 0) continue

      // Calculate total value
      let totalValueTRY = 0
      const assetsSnapshot = assets.map((a: any) => {
        const quantity = parseFloat(a.quantity)
        const avgCost = parseFloat(a.average_cost)
        const value = quantity * avgCost // Using avg cost as current price for snapshot
        const valueTRY = a.currency === 'USD' ? value * usdTry : value
        totalValueTRY += valueTRY
        
        return {
          symbol: a.symbol,
          name: a.name,
          type: a.type,
          category: a.category,
          quantity,
          averageCost: avgCost,
          currency: a.currency,
          valueTRY,
        }
      })

      // Check if snapshot already exists for this week
      const { data: existing } = await supabase
        .from('snapshots')
        .select('id')
        .eq('user_id', userId)
        .eq('week_number', weekNumber)
        .single()

      if (existing) {
        // Update existing snapshot
        await supabase
          .from('snapshots')
          .update({
            total_value_try: totalValueTRY,
            assets: assetsSnapshot,
          })
          .eq('id', existing.id)
      } else {
        // Create new snapshot
        await supabase
          .from('snapshots')
          .insert({
            user_id: userId,
            total_value_try: totalValueTRY,
            assets: assetsSnapshot,
            week_number: weekNumber,
          })
        snapshotsCreated++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${snapshotsCreated} snapshots for week ${weekNumber}`,
      usersProcessed: uniqueUserIds.length,
    })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
