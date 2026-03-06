
import { analyzeVastu } from '../lib/vastu-engine';
import { calculateRenovationCost } from '../lib/cost-engine';

console.log("Starting Backend Logic Verification...");

// 1. Verify Vastu Engine
console.log("\n--- Testing Vastu Engine ---");
try {
    const vastuResult = analyzeVastu({
        roomType: 'bedroom',
        direction: 'South', // Ideal for bedroom
        language: 'en'
    });

    if (vastuResult.score >= 80 && vastuResult.rating === 'excellent') {
        console.log("✅ Vastu Analysis (Ideal Case): Passed");
    } else {
        console.error("❌ Vastu Analysis (Ideal Case): Failed", vastuResult);
    }

    const vastuBadResult = analyzeVastu({
        roomType: 'kitchen',
        direction: 'Northeast', // Bad for kitchen (Fire element in Water zone)
        language: 'en'
    });

    if (vastuBadResult.score < 80 && vastuBadResult.violations.length > 0) {
        console.log("✅ Vastu Analysis (Non-Ideal Case): Passed");
    } else {
        console.error("❌ Vastu Analysis (Non-Ideal Case): Failed", vastuBadResult);
    }
} catch (error) {
    console.error("❌ Vastu Engine Crashed:", error);
}

// 2. Verify Cost Engine
console.log("\n--- Testing Cost Engine ---");
try {
    const area = 200;
    const costResult = calculateRenovationCost({
        roomType: 'living-room',
        areaInSqft: area,
        city: 'mumbai',
        renovationType: 'premium',
        includeLabor: true,
        includeTax: true
    });

    // Manual sanity check: 
    // Base cost for premium = 2500 per sqft
    // Mumbai multiplier = 1.2
    // Base = 2500 * 200 * 1.2 = 600,000
    // Material (60%) = 360,000
    // Labor (40%) = 240,000
    // Subtotal = 600,000
    // Tax (18%) = 108,000
    // Total = 708,000

    const expectedTotal = 708000;
    // Allow small floating point diffs
    if (Math.abs(costResult.totalCost - expectedTotal) < 100) {
        console.log(`✅ Cost Calculation (Premium Mumbai): Passed (Got ${costResult.totalCost})`);
    } else {
        console.error(`❌ Cost Calculation: Failed. Expected ~${expectedTotal}, got ${costResult.totalCost}`);
    }

} catch (error) {
    console.error("❌ Cost Engine Crashed:", error);
}

console.log("\nVerification Complete.");
