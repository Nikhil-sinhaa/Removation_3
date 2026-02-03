// app/api/cost/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import { calculateRenovationCost, getCostBreakdown, getMaterialPrices, getLaborRates } from "@/lib/cost-engine";
import { z } from "zod";

const costCalculationSchema = z.object({
  roomType: z.string(),
  area: z.object({
    value: z.number().positive(),
    unit: z.enum(['sqft', 'sqm']),
  }),
  city: z.string(),
  renovationType: z.enum(['basic', 'standard', 'premium', 'luxury']),
  selectedMaterials: z.object({
    flooring: z.string().optional(),
    wall: z.string().optional(),
    ceiling: z.string().optional(),
    furniture: z.array(z.string()).optional(),
    fixtures: z.array(z.string()).optional(),
    lighting: z.array(z.string()).optional(),
  }).optional(),
  includeLabor: z.boolean().default(true),
  includeTax: z.boolean().default(true),
  currency: z.enum(['INR', 'USD']).default('INR'),
  timeline: z.enum(['standard', 'express']).default('standard'),
  additionalRequirements: z.array(z.string()).optional(),
});

const materialQuerySchema = z.object({
  category: z.string(),
  city: z.string().optional(),
  currency: z.enum(['INR', 'USD']).default('INR'),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    // Cost calculation is available for all users (free feature for engagement)
    
    const body = await req.json();
    const { action = 'calculate' } = body;

    if (action === 'calculate') {
      const validatedData = costCalculationSchema.parse(body);

      // Convert area to sqft if needed
      const areaInSqft = validatedData.area.unit === 'sqm' 
        ? validatedData.area.value * 10.764 
        : validatedData.area.value;

      // Calculate costs
      const costResult = calculateRenovationCost({
        roomType: validatedData.roomType,
        areaInSqft,
        city: validatedData.city,
        renovationType: validatedData.renovationType,
        selectedMaterials: validatedData.selectedMaterials,
        includeLabor: validatedData.includeLabor,
        includeTax: validatedData.includeTax,
        timeline: validatedData.timeline,
        additionalRequirements: validatedData.additionalRequirements,
      });

      // Convert currency if needed
      let finalCost = costResult;
      if (validatedData.currency === 'USD') {
        const exchangeRate = 83; // INR to USD
        finalCost = {
          ...costResult,
          totalCost: Math.round(costResult.totalCost / exchangeRate),
          materialCost: Math.round(costResult.materialCost / exchangeRate),
          laborCost: Math.round(costResult.laborCost / exchangeRate),
          taxAmount: Math.round(costResult.taxAmount / exchangeRate),
          breakdown: costResult.breakdown.map((item: any) => ({
            ...item,
            cost: Math.round(item.cost / exchangeRate),
          })),
        };
      }

      // Track usage for analytics
      if (userId) {
        await connectToDatabase();
        await User.findOneAndUpdate(
          { clerkId: userId },
          { 
            $inc: { 'analytics.costCalculations': 1 },
            $push: { 
              'analytics.recentCalculations': {
                $each: [{
                  roomType: validatedData.roomType,
                  city: validatedData.city,
                  totalCost: finalCost.totalCost,
                  currency: validatedData.currency,
                  createdAt: new Date(),
                }],
                $slice: -10, // Keep last 10
              }
            }
          }
        );
      }

      return NextResponse.json({
        success: true,
        estimate: {
          ...finalCost,
          currency: validatedData.currency,
          currencySymbol: validatedData.currency === 'INR' ? '₹' : '$',
          formattedTotal: formatCurrency(finalCost.totalCost, validatedData.currency),
        },
        metadata: {
          city: validatedData.city,
          roomType: validatedData.roomType,
          area: validatedData.area,
          renovationType: validatedData.renovationType,
          estimatedDays: costResult.estimatedDays,
        },
        tips: getCostSavingTips(validatedData.renovationType),
      });

    } else if (action === 'breakdown') {
      const validatedData = costCalculationSchema.parse(body);

      const breakdown = getCostBreakdown({
        roomType: validatedData.roomType,
        renovationType: validatedData.renovationType,
        city: validatedData.city,
      });

      return NextResponse.json({
        success: true,
        breakdown,
      });

    } else if (action === 'compare') {
      const { cities, roomType, area, renovationType } = body;

      const comparisons = await Promise.all(
        cities.map(async (city: string) => {
          const cost = calculateRenovationCost({
            roomType,
            areaInSqft: area.unit === 'sqm' ? area.value * 10.764 : area.value,
            city,
            renovationType,
            includeLabor: true,
            includeTax: true,
          });
          return { city, ...cost };
        })
      );

      return NextResponse.json({
        success: true,
        comparisons: comparisons.sort((a, b) => a.totalCost - b.totalCost),
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );

  } catch (error: any) {
    console.error("Cost API error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Cost calculation failed", message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'materials';
    const category = searchParams.get('category');
    const city = searchParams.get('city') || 'mumbai';
    const currency = (searchParams.get('currency') || 'INR') as 'INR' | 'USD';

    if (type === 'materials') {
      const materials = getMaterialPrices({
        category: category || 'all',
        city,
        currency,
      });

      return NextResponse.json({
        success: true,
        materials,
        currency,
      });

    } else if (type === 'labor') {
      const laborRates = getLaborRates({
        city,
        currency,
      });

      return NextResponse.json({
        success: true,
        laborRates,
        currency,
      });

    } else if (type === 'cities') {
      const cities = getSupportedCities();

      return NextResponse.json({
        success: true,
        cities,
      });
    }

    return NextResponse.json(
      { error: "Invalid type parameter" },
      { status: 400 }
    );

  } catch (error: any) {
    console.error("Get cost data error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cost data", message: error.message },
      { status: 500 }
    );
  }
}

function formatCurrency(amount: number, currency: 'INR' | 'USD'): string {
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getCostSavingTips(renovationType: string): string[] {
  const tips: Record<string, string[]> = {
    basic: [
      "Consider painting walls yourself to save on labor",
      "Buy materials in bulk for discounts",
      "Schedule work during off-peak seasons",
    ],
    standard: [
      "Mix premium and budget materials strategically",
      "Get multiple quotes from contractors",
      "Consider phased renovation to spread costs",
    ],
    premium: [
      "Invest in quality fixtures for long-term savings",
      "Hire a designer to avoid costly mistakes",
      "Consider energy-efficient options for lower bills",
    ],
    luxury: [
      "Custom furniture can be more cost-effective than high-end brands",
      "Smart home integration adds value",
      "Consider timeless designs over trends",
    ],
  };
  
  return tips[renovationType] || tips.standard;
}

function getSupportedCities() {
  return [
    { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', tier: 1 },
    { id: 'delhi', name: 'Delhi NCR', state: 'Delhi', tier: 1 },
    { id: 'bangalore', name: 'Bangalore', state: 'Karnataka', tier: 1 },
    { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', tier: 1 },
    { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', tier: 1 },
    { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', tier: 1 },
    { id: 'pune', name: 'Pune', state: 'Maharashtra', tier: 2 },
    { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', tier: 2 },
    { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', tier: 2 },
    { id: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh', tier: 2 },
    { id: 'chandigarh', name: 'Chandigarh', state: 'Punjab', tier: 2 },
    { id: 'kochi', name: 'Kochi', state: 'Kerala', tier: 2 },
    { id: 'goa', name: 'Goa', state: 'Goa', tier: 2 },
    { id: 'indore', name: 'Indore', state: 'Madhya Pradesh', tier: 3 },
    { id: 'bhopal', name: 'Bhopal', state: 'Madhya Pradesh', tier: 3 },
    { id: 'coimbatore', name: 'Coimbatore', state: 'Tamil Nadu', tier: 3 },
  ];
}