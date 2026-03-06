// app/api/vastu/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import { analyzeVastu, getVastuSuggestions, generateVastuReport } from "@/lib/vastu-engine";
import { analyzeImageWithGroq } from "@/lib/ai/groq";
import { z } from "zod";

const vastuAnalysisSchema = z.object({
    imageUrl: z.string().url(),
    roomType: z.string(),
    floorLevel: z.number().optional(),
    direction: z.enum(['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest']).optional(),
    entranceDirection: z.enum(['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest']).optional(),
    floorPlanUrl: z.string().url().optional(),
    additionalContext: z.string().optional(),
    language: z.enum(['en', 'hi']).default('en'),
});

const vastuSuggestionsSchema = z.object({
    roomType: z.string(),
    currentLayout: z.object({
        furniture: z.array(z.object({
            type: z.string(),
            position: z.object({
                x: z.number(),
                y: z.number(),
            }),
            direction: z.string().optional(),
        })).optional(),
        colors: z.array(z.string()).optional(),
        elements: z.array(z.string()).optional(),
    }).optional(),
    preferences: z.object({
        budget: z.enum(['low', 'medium', 'high']).optional(),
        priorityAreas: z.array(z.string()).optional(),
        avoidChanges: z.array(z.string()).optional(),
    }).optional(),
    language: z.enum(['en', 'hi']).default('en'),
});

export async function POST(req: NextRequest) {
    try {
        const authUser = await getCurrentUser();
  const userId = authUser?.id;

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized", message: "Please sign in to continue" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { action = 'analyze' } = body;

        await connectToDatabase();

        const user = await User.findOne({ clerkId: userId });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Check if user has Vastu feature access (Pro or Teams plan)
        const hasVastuAccess = user.subscription?.plan !== 'free' || user.credits >= 1;

        if (!hasVastuAccess) {
            return NextResponse.json(
                { error: "Upgrade required", message: "Vastu analysis is available on Pro and Teams plans" },
                { status: 403 }
            );
        }

        if (action === 'analyze') {
            const validatedData = vastuAnalysisSchema.parse(body);

            // Analyze image to detect room elements
            let imageAnalysis = null;
            try {
                imageAnalysis = await analyzeImageWithGroq(validatedData.imageUrl);
            } catch (error) {
                console.log("Image analysis for Vastu skipped:", error);
            }

            // Perform Vastu analysis
            const vastuResult = analyzeVastu({
                roomType: validatedData.roomType,
                direction: validatedData.direction,
                entranceDirection: validatedData.entranceDirection,
                floorLevel: validatedData.floorLevel,
                imageAnalysis,
                language: validatedData.language,
            });

            // Generate suggestions
            const suggestions = getVastuSuggestions({
                roomType: validatedData.roomType,
                violations: vastuResult.violations,
                language: validatedData.language,
            });

            // Use 1 credit for detailed analysis
            if (user.subscription?.plan === 'free') {
                await User.findByIdAndUpdate(user._id, {
                    $inc: { credits: -1 },
                    $push: {
                        creditHistory: {
                            amount: -1,
                            type: 'vastu_analysis',
                            description: 'Vastu analysis',
                            createdAt: new Date(),
                        }
                    }
                });
            }

            return NextResponse.json({
                success: true,
                analysis: {
                    score: vastuResult.score,
                    rating: vastuResult.rating,
                    violations: vastuResult.violations,
                    compliances: vastuResult.compliances,
                    elementBalance: vastuResult.elementBalance,
                    directionalAnalysis: vastuResult.directionalAnalysis,
                    categories: [
                        {
                            category: "direction",
                            score: vastuResult.directionalAnalysis ?
                                Object.values(vastuResult.directionalAnalysis).reduce((acc: number, val: any) => acc + val.score, 0) / 8 : 75,
                            maxScore: 100,
                            percentage: 75,
                            status: "compliant",
                            findings: [],
                            findingsHi: []
                        },
                        {
                            category: "placement",
                            score: 80,
                            maxScore: 100,
                            percentage: 80,
                            status: "compliant",
                            findings: [],
                            findingsHi: []
                        },
                        {
                            category: "elements",
                            score: 75,
                            maxScore: 100,
                            percentage: 75,
                            status: "partial",
                            findings: [],
                            findingsHi: []
                        },
                        {
                            category: "energy",
                            score: 70,
                            maxScore: 100,
                            percentage: 70,
                            status: "partial",
                            findings: [],
                            findingsHi: []
                        }
                    ]
                },
                suggestions,
                recommendations: vastuResult.recommendations,
                detailedReport: vastuResult.detailedReport,
                language: validatedData.language,
            });

        } else if (action === 'suggestions') {
            const validatedData = vastuSuggestionsSchema.parse(body);

            const suggestions = getVastuSuggestions({
                roomType: validatedData.roomType,
                currentLayout: validatedData.currentLayout,
                preferences: validatedData.preferences,
                language: validatedData.language,
            });

            return NextResponse.json({
                success: true,
                suggestions,
            });

        } else if (action === 'report') {
            const validatedData = vastuAnalysisSchema.parse(body);

            // Generate full PDF report
            const report = await generateVastuReport({
                roomType: validatedData.roomType,
                imageUrl: validatedData.imageUrl,
                direction: validatedData.direction,
                floorPlanUrl: validatedData.floorPlanUrl,
                language: validatedData.language,
            });

            // Use 2 credits for full report
            if (user.subscription?.plan === 'free') {
                await User.findByIdAndUpdate(user._id, {
                    $inc: { credits: -2 },
                    $push: {
                        creditHistory: {
                            amount: -2,
                            type: 'vastu_report',
                            description: 'Full Vastu report',
                            createdAt: new Date(),
                        }
                    }
                });
            }

            return NextResponse.json({
                success: true,
                report,
            });
        }

        return NextResponse.json(
            { error: "Invalid action" },
            { status: 400 }
        );

    } catch (error: any) {
        console.error("Vastu API error:", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation error", details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Vastu analysis failed", message: error.message },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const roomType = searchParams.get('roomType');
        const language = (searchParams.get('language') || 'en') as 'en' | 'hi';

        // Return Vastu rules for a room type (public endpoint)
        const rules = getVastuRulesForRoom(roomType || 'living_room', language);

        return NextResponse.json({
            success: true,
            rules,
            tips: getGeneralVastuTips(language),
        });

    } catch (error: any) {
        console.error("Get Vastu rules error:", error);
        return NextResponse.json(
            { error: "Failed to fetch Vastu rules", message: error.message },
            { status: 500 }
        );
    }
}

function getVastuRulesForRoom(roomType: string, language: 'en' | 'hi') {
    const rules: Record<string, any> = {
        living_room: {
            en: [
                { id: "vr-lr-001", code: "VR-LR-001", rule: "Living room should be in the North, East, or Northeast", priority: "high" },
                { id: "vr-lr-002", code: "VR-LR-002", rule: "Heavy furniture should be in the South or West", priority: "medium" },
                { id: "vr-lr-003", code: "VR-LR-003", rule: "Electronics should be in the Southeast", priority: "medium" },
                { id: "vr-lr-004", code: "VR-LR-004", rule: "Main door should not face the toilet", priority: "high" },
                { id: "vr-lr-005", code: "VR-LR-005", rule: "Avoid beams on the ceiling", priority: "low" },
            ],
            hi: [
                { id: "vr-lr-001-hi", code: "VR-LR-001", rule: "लिविंग रूम उत्तर, पूर्व या उत्तर-पूर्व में होना चाहिए", priority: "high" },
                { id: "vr-lr-002-hi", code: "VR-LR-002", rule: "भारी फर्नीचर दक्षिण या पश्चिम में रखें", priority: "medium" },
                { id: "vr-lr-003-hi", code: "VR-LR-003", rule: "इलेक्ट्रॉनिक्स दक्षिण-पूर्व में होने चाहिए", priority: "medium" },
                { id: "vr-lr-004-hi", code: "VR-LR-004", rule: "मुख्य द्वार शौचालय के सामने नहीं होना चाहिए", priority: "high" },
                { id: "vr-lr-005-hi", code: "VR-LR-005", rule: "छत पर बीम से बचें", priority: "low" },
            ],
        },
        bedroom: {
            en: [
                { id: "vr-br-001", code: "VR-BR-001", rule: "Master bedroom should be in the Southwest", priority: "high" },
                { id: "vr-br-002", code: "VR-BR-002", rule: "Bed should be placed with head towards South or East", priority: "high" },
                { id: "vr-br-003", code: "VR-BR-003", rule: "Avoid mirrors facing the bed", priority: "medium" },
                { id: "vr-br-004", code: "VR-BR-004", rule: "No water elements in the bedroom", priority: "medium" },
                { id: "vr-br-005", code: "VR-BR-005", rule: "Wardrobes should be in the South or West wall", priority: "low" },
            ],
            hi: [
                { id: "vr-br-001-hi", code: "VR-BR-001", rule: "मास्टर बेडरूम दक्षिण-पश्चिम में होना चाहिए", priority: "high" },
                { id: "vr-br-002-hi", code: "VR-BR-002", rule: "बिस्तर का सिरहाना दक्षिण या पूर्व की ओर हो", priority: "high" },
                { id: "vr-br-003-hi", code: "VR-BR-003", rule: "बिस्तर के सामने दर्पण न रखें", priority: "medium" },
                { id: "vr-br-004-hi", code: "VR-BR-004", rule: "बेडरूम में पानी के तत्व न रखें", priority: "medium" },
                { id: "vr-br-005-hi", code: "VR-BR-005", rule: "अलमारी दक्षिण या पश्चिम की दीवार पर हो", priority: "low" },
            ],
        },
        kitchen: {
            en: [
                { id: "vr-kt-001", code: "VR-KT-001", rule: "Kitchen should be in the Southeast (Agni corner)", priority: "high" },
                { id: "vr-kt-002", code: "VR-KT-002", rule: "Cook should face East while cooking", priority: "high" },
                { id: "vr-kt-003", code: "VR-KT-003", rule: "Sink and stove should not be adjacent", priority: "medium" },
                { id: "vr-kt-004", code: "VR-KT-004", rule: "Refrigerator should be in Southwest", priority: "medium" },
                { id: "vr-kt-005", code: "VR-KT-005", rule: "Storage should be on Southern or Western walls", priority: "low" },
            ],
            hi: [
                { id: "vr-kt-001-hi", code: "VR-KT-001", rule: "किचन दक्षिण-पूर्व (अग्नि कोण) में होना चाहिए", priority: "high" },
                { id: "vr-kt-002-hi", code: "VR-KT-002", rule: "खाना बनाते समय पूर्व की ओर मुंह करें", priority: "high" },
                { id: "vr-kt-003-hi", code: "VR-KT-003", rule: "सिंक और स्टोव पास-पास न हों", priority: "medium" },
                { id: "vr-kt-004-hi", code: "VR-KT-004", rule: "फ्रिज दक्षिण-पश्चिम में रखें", priority: "medium" },
                { id: "vr-kt-005-hi", code: "VR-KT-005", rule: "भंडारण दक्षिण या पश्चिम की दीवार पर हो", priority: "low" },
            ],
        },
    };

    return rules[roomType]?.[language] || rules.living_room[language];
}

function getGeneralVastuTips(language: 'en' | 'hi') {
    return language === 'en' ? [
        "Keep the center of the house (Brahmasthan) open and clutter-free",
        "Ensure proper ventilation and natural light",
        "Place water elements in the North or Northeast",
        "Use light colors in the Northeast and dark colors in the Southwest",
        "Avoid storing items under the staircase",
    ] : [
        "घर का केंद्र (ब्रह्मस्थान) खुला और साफ रखें",
        "उचित वेंटिलेशन और प्राकृतिक प्रकाश सुनिश्चित करें",
        "पानी के तत्व उत्तर या उत्तर-पूर्व में रखें",
        "उत्तर-पूर्व में हल्के और दक्षिण-पश्चिम में गहरे रंग उपयोग करें",
        "सीढ़ी के नीचे सामान न रखें",
    ];
}