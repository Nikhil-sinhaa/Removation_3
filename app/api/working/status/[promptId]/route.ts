// app/api/working/status/[promptId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(
  req: NextRequest,
  { params }: { params: { promptId: string } }
) {
  try {
    const { promptId } = params;

    // Check ComfyUI status
    const response = await axios.get(`http://127.0.0.1:8188/history/${promptId}`);
    const history = response.data;
    const promptHistory = history[promptId];

    if (!promptHistory) {
      return NextResponse.json({
        status: 'pending',
        message: 'Generation not started yet'
      });
    }

    if (promptHistory.status?.str === 'success') {
      // Find the output image
      const outputs = promptHistory.outputs;
      for (const nodeId in outputs) {
        const images = outputs[nodeId].images;
        if (images && images.length > 0) {
          const outputFilename = images[0].filename;
          
          // Copy to public folder
          const fs = require('fs');
          const path = require('path');
          
          const publicDir = path.join(process.cwd(), 'public', 'generated');
          const fsPromises = require('fs/promises');
          await fsPromises.mkdir(publicDir, { recursive: true });
          
          const sourcePath = path.join('/home/nikhil/Documents/Remo2/ComfyUI/output', outputFilename);
          const publicFilename = `working_${outputFilename}`;
          const destPath = path.join(publicDir, publicFilename);
          
          try {
            fs.copyFileSync(sourcePath, destPath);
            
            return NextResponse.json({
              status: 'completed',
              message: 'Generation completed successfully',
              generatedImage: `/generated/${publicFilename}`,
              processingTime: promptHistory.status?.completed ? 
                Date.now() - new Date(promptHistory.status?.completed).getTime() : 0
            });
          } catch (copyError) {
            return NextResponse.json({
              status: 'completed',
              message: 'Generation completed but failed to copy image',
              outputFilename: outputFilename
            });
          }
        }
      }
    } else if (promptHistory.status?.str === 'error') {
      return NextResponse.json({
        status: 'error',
        message: promptHistory.status?.msg || 'Generation failed'
      });
    }

    return NextResponse.json({
      status: 'processing',
      message: 'Generation in progress...'
    });

  } catch (error: any) {
    console.error("Status check error:", error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to check status'
    });
  }
}
