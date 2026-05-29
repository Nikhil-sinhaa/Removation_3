// app/api/stats/public/route.ts
// Public endpoint — no auth required.
// Returns real platform counts for the landing page stats section.
// Cached with ISR (revalidate every hour) to avoid hitting DB on every page load.

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { Designer } from '@/lib/db/models/Designer'
import { Render } from '@/lib/db/models/Render'
import { User } from '@/lib/db/models/User'

// Next.js ISR — revalidate every hour
export const revalidate = 3600

export async function GET() {
  try {
    await dbConnect()

    // Run all counts in parallel for performance
    const [designersVerified, rendersGenerated, happyCustomers, cityList] =
      await Promise.all([
        // Verified designers on the platform
        Designer.countDocuments({ isVerified: true }),
        // Total renders generated (all statuses — shows platform usage)
        Render.countDocuments({}),
        // All users with the default customer role
        User.countDocuments({ role: 'customer' }),
        // Distinct cities where verified designers operate
        Designer.distinct('city', { isVerified: true }),
      ])

    // Numbers are real from DB — do not inflate
    const stats = {
      designersVerified,
      rendersGenerated,
      happyCustomers,
      citiesServed: cityList.length,
    }

    return NextResponse.json(stats, {
      status: 200,
      headers: {
        // Public cache — CDN can cache for 1 hour
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('[/api/stats/public] Error fetching stats:', error)

    // Return safe fallback — never expose DB errors publicly
    return NextResponse.json(
      {
        designersVerified: 0,
        rendersGenerated: 0,
        happyCustomers: 0,
        citiesServed: 0,
      },
      { status: 200 }
    )
  }
}
