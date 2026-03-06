import { NextResponse } from "next/server";

// IOPaint runs locally on port 8080 by default
const IOPAINT_API_URL = "http://127.0.0.1:8080/api/v1/inpaint";

export async function POST(request: Request) {
    try {
        const { imageBase64, maskBase64 } = await request.json();

        if (!imageBase64 || !maskBase64) {
            return NextResponse.json(
                { error: "Both imageBase64 and maskBase64 are required" },
                { status: 400 }
            );
        }

        // 1. Convert Base64 strings to Blobs
        const baseImageUrl = imageBase64.split(",")[1];
        const baseMaskUrl = maskBase64.split(",")[1];

        if (!baseImageUrl || !baseMaskUrl) {
            return NextResponse.json(
                { error: "Invalid base64 format" },
                { status: 400 }
            );
        }

        const imageBuffer = Buffer.from(baseImageUrl, "base64");
        const maskBuffer = Buffer.from(baseMaskUrl, "base64");

        const imageBlob = new Blob([imageBuffer], { type: "image/png" });
        const maskBlob = new Blob([maskBuffer], { type: "image/png" });

        // 2. Prepare FormData for IOPaint
        // IOPaint /api/v1/inpaint expects multipart/form-data with 'image' and 'mask' files
        const formData = new FormData();
        formData.append("image", imageBlob, "image.png");
        formData.append("mask", maskBlob, "mask.png");

        // IOPaint settings (using LaMa model defaults)
        // See https://iopaint.com/api for all options
        formData.append("ldm_steps", "25");
        formData.append("hd_strategy", "Original");
        formData.append("zits_wireframe", "false");
        formData.append("cv2_flag", "INPAINT_NS");
        formData.append("cv2_radius", "4");

        console.log(`Sending inpaint request to ${IOPAINT_API_URL}...`);

        // 3. Call local IOPaint Server
        const response = await fetch(IOPAINT_API_URL, {
            method: "POST",
            body: formData,
            // don't stringify, fetch automatically sets headers for FormData
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("IOPaint server error:", response.status, errText);
            throw new Error(`IOPaint returned ${response.status}: ${errText}`);
        }

        // 4. IOPaint returns the raw image binary (image/jpeg or png)
        const outputBlob = await response.blob();
        const arrayBuffer = await outputBlob.arrayBuffer();
        const outputBuffer = Buffer.from(arrayBuffer);

        // Convert the binary result back to a base64 Data URL for the frontend to show
        const mimeType = outputBlob.type || "image/png";
        const outputDataUrl = `data:${mimeType};base64,${outputBuffer.toString("base64")}`;

        return NextResponse.json({ success: true, imageUrl: outputDataUrl });

    } catch (error: any) {
        console.error("IOPaint API Error:", error?.message || error);
        
        let message = `Failed to process image: ${error?.message}`;
        if (error.message.includes("fetch failed") || error.code === "ECONNREFUSED") {
            message = "⚠️ Could not connect to the local IOPaint server. Please ensure you ran 'iopaint start --model=lama --port=8080' in your terminal.";
        }

        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
