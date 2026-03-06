// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import { Render } from "@/lib/db/models/Render";
import { Project } from "@/lib/db/models/Project";
import { runFalPredictionSync, isFalConfigured } from "@/lib/ai/fal-adapter";
import { generatePrompt } from "@/lib/ai/prompts";
import { analyzeImageWithGroq } from "@/lib/ai/groq";
import { getVastuGuidelines } from "@/lib/vastu-engine";
import { z } from "zod";

const generateSchema = z.object({
  imageUrl: z.string().url(),
  projectId: z.string().optional(),
  mode: z.enum([
    'redesign',
    'beautify',
    'creative',
    'furnish',
    'empty',
    'outdoor',
    'sketch',
    'enhance',
    'inpaint',
    'remove'
  ]),
  style: z.string(),
  roomType: z.string(),
  settings: z.object({
    creativity: z.number().min(0).max(100).default(50),
    preserveLayout: z.boolean().default(true),
    enhanceQuality: z.boolean().default(true),
    colorScheme: z.string().optional(),
    materials: z.array(z.string()).optional(),
    lighting: z.enum(['natural', 'warm', 'cool', 'dramatic']).optional(),
    timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
  }).optional(),
  customPrompt: z.string().optional(),
  referenceImages: z.array(z.string().url()).optional(),
  numberOfVariations: z.number().min(1).max(4).default(1),
});

export async function POST(req: NextRequest) {
  try {
    // Guard: check if fal.ai is configured
    if (!isFalConfigured()) {
      return NextResponse.json(
        { error: "AI service not configured", message: "FAL_KEY is missing. Add it to .env.local." },
        { status: 503 }
      );
    }

    // ─── DEV / TRIAL BYPASS ─────────────────────────────────────────────────
    // In dev (NODE_ENV !== 'production') or when BYPASS_CREDITS=true:
    // - Skip Clerk auth check so generation works without a valid session
    // - Skip credit deduction and user DB lookup
    // Remove both bypass flags when going live.
    const DEV_BYPASS = process.env.BYPASS_CREDITS === 'true' || process.env.NODE_ENV !== 'production';

    const { userId: rawUserId } = await auth();
    const userId = rawUserId || (DEV_BYPASS ? 'dev-bypass-user' : null);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Please sign in to continue" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = generateSchema.parse(body);

    await connectToDatabase();

    // Mock user for dev bypass — skips MongoDB lookup entirely
    const MOCK_USER = { _id: 'dev-user', credits: 9999 };
    const user = DEV_BYPASS
      ? MOCK_USER
      : await User.findOne({ clerkId: userId });

    if (!user) {
      return NextResponse.json(
        { error: "User not found", message: "Please complete your registration" },
        { status: 404 }
      );
    }

    const creditsRequired = validatedData.numberOfVariations;

    const BYPASS_CREDITS = DEV_BYPASS;

    if (!BYPASS_CREDITS && user.credits < creditsRequired) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          message: `You need ${creditsRequired} credits but have ${user.credits}`,
          creditsRequired,
          creditsAvailable: user.credits
        },
        { status: 402 }
      );
    }

    // Analyze the input image for better prompt generation
    let imageAnalysis = null;
    try {
      imageAnalysis = await analyzeImageWithGroq(validatedData.imageUrl);
    } catch (error) {
      console.log("Image analysis skipped:", error);
    }

    // Get Vastu guidelines for the selected room type
    // These modifiers are injected into the prompt to generate Vastu-compliant designs
    const vastuGuidelines = getVastuGuidelines(validatedData.roomType);

    // Generate the Vastu-enhanced prompt
    const prompt = generatePrompt({
      mode: validatedData.mode,
      style: validatedData.style,
      roomType: validatedData.roomType,
      settings: validatedData.settings,
      customPrompt: validatedData.customPrompt,
      imageAnalysis,
      vastuModifiers: {
        colors: vastuGuidelines.colors,
        elements: vastuGuidelines.elements,
        tips: vastuGuidelines.tips,
      },
    });

    console.log(`[Generate] Vastu-enhanced prompt (${validatedData.roomType}): ${prompt.slice(0, 120)}...`);

    // Mode is passed directly to fal-adapter which maps it to the correct fal.ai model

    // Create render records for tracking
    const renderIds: string[] = [];

    // Deduct credits before starting (skipped in trial/dev mode)
    if (!BYPASS_CREDITS) {
      await User.findByIdAndUpdate(user._id, {
        $inc: { credits: -creditsRequired },
        $push: {
          creditHistory: {
            amount: -creditsRequired,
            type: 'generation',
            description: `Generated ${creditsRequired} ${validatedData.mode} render(s)`,
            createdAt: new Date(),
          }
        }
      });
    } else {
      console.log(`[Generate] Credit bypass active — skipping deduction of ${creditsRequired} credit(s)`);
    }

    console.log(`[Generate] Using fal.ai for mode: ${validatedData.mode}`);

    try {
      for (let i = 0; i < validatedData.numberOfVariations; i++) {
        // ── fal.ai (replaces Replicate) ─────────────────────────────────
        const { outputUrl, predictionId } = await runFalPredictionSync({
          mode: validatedData.mode,
          imageUrl: validatedData.imageUrl,
          prompt,
        });

        const render = await Render.create({
          userId: user._id,
          clerkId: userId,
          projectId: validatedData.projectId,
          inputImage: validatedData.imageUrl,
          outputImage: outputUrl,
          mode: validatedData.mode,
          style: validatedData.style,
          roomType: validatedData.roomType,
          prompt,
          settings: validatedData.settings,
          status: 'completed',
          variationIndex: i,
          predictionId,
          completedAt: new Date(),
        });

        renderIds.push(render._id.toString());
      }
    } catch (error: any) {
      console.error("Failed to create predictions:", error);

      // Refund credits on prediction creation failure
      if (!DEV_BYPASS) {
        await User.findByIdAndUpdate(user._id, {
          $inc: { credits: creditsRequired },
          $push: {
            creditHistory: {
              amount: creditsRequired,
              type: 'refund',
              description: 'Refund for failed generation',
              createdAt: new Date(),
            }
          }
        });
      }

      // Mark any created renders as failed
      if (renderIds.length > 0) {
        await Render.updateMany(
          { _id: { $in: renderIds } },
          { status: 'failed', error: error.message, completedAt: new Date() }
        );
      }

      throw error;
    }

    // Update project if provided
    if (validatedData.projectId) {
      await Project.findByIdAndUpdate(validatedData.projectId, {
        $push: { renders: { $each: renderIds } },
        lastActivity: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Generation started",
      renderIds,
      creditsUsed: creditsRequired,
      creditsRemaining: user.credits - creditsRequired,
      estimatedTime: validatedData.numberOfVariations * 15, // seconds
    });

  } catch (error: any) {
    console.error("Generate API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Generation failed", message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const DEV_BYPASS = process.env.BYPASS_CREDITS === 'true' || process.env.NODE_ENV !== 'production';
    const { userId: rawUserId } = await auth();
    const userId = rawUserId || (DEV_BYPASS ? 'dev-bypass-user' : null);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const renderId = searchParams.get('renderId');

    // ── DEV BYPASS: Return mock render to complete the polling loop ──────
    if (DEV_BYPASS && renderId?.startsWith('dev-render-')) {
      return NextResponse.json({
        render: {
          _id: renderId,
          status: 'completed',
          // Mock output image (Unsplash interior design)
          outputImage: 'https://images.unsplash.com/photo-1600210492486-724fe5c67eb0?auto=format&fit=crop&w=1024&q=80',
          variationIndex: 0,
        }
      });
    }

    if (!DEV_BYPASS) {
      await connectToDatabase();
    }

    const MOCK_USER = { _id: 'dev-user' };
    const user = DEV_BYPASS ? MOCK_USER : await User.findOne({ clerkId: userId });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (renderId) {
      if (DEV_BYPASS) {
        return NextResponse.json({ error: "Render not found" }, { status: 404 });
      }

      const render = await Render.findOne({
        _id: renderId,
        userId: user._id
      });

      if (!render) {
        return NextResponse.json({ error: "Render not found" }, { status: 404 });
      }

      return NextResponse.json({ render });
    }

    // Get recent renders
    let renders: any[] = [];
    if (!DEV_BYPASS) {
      renders = await Render.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(20);
    }

    return NextResponse.json({ renders });

  } catch (error: any) {
    console.error("Get renders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch renders", message: error.message },
      { status: 500 }
    );
  }
}