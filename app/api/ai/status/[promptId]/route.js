import { connectDB } from '@/lib/db/mongodb';
import AIRun from '../../../../../src/models/AIRun.js';
import { getCurrentUser } from '@/lib/auth/jwt';
import { getActiveComfyBaseUrl } from '@/lib/ai/gpu-mode-router';

export async function GET(request, { params }) {
  await connectDB();
  try {
    const authUser = await getCurrentUser();
    if (!authUser || !authUser.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { promptId } = params;
    
    if (!promptId) {
      return Response.json({ 
        error: 'Prompt ID required' 
      }, { status: 400 });
    }

    // Find project by ID (using promptId as projectId) and verify ownership
    const project = await AIRun.findOne({ _id: promptId, userId: authUser.id });
    
    if (!project) {
      return Response.json({ 
        error: 'Project not found' 
      }, { status: 404 });
    }

    const comfyUrl = getActiveComfyBaseUrl();

    // Check ComfyUI queue for status
    let comfyStatus = 'unknown';
    try {
      const queueResponse = await fetch(`${comfyUrl}/queue`, {
        headers: { 'bypass-tunnel-reminder': 'true' },
      });
      if (queueResponse.ok) {
        const queueData = await queueResponse.json();
        
        // Check if project is in pending queue
        const pendingJob = queueData.queue_pending.find(job => 
          job[1]?.prompt_id === promptId
        );
        
        if (pendingJob) {
          comfyStatus = 'queued';
        } else {
          // Check if project is in running queue
          const runningJob = queueData.queue_running.find(job => 
            job[1]?.prompt_id === promptId
          );
          
          if (runningJob) {
            comfyStatus = 'processing';
          } else {
            comfyStatus = 'completed';
          }
        }
      }
    } catch (error) {
      console.error('Error checking ComfyUI queue:', error);
    }

    // Check for generated image in ComfyUI output
    let generatedImage = null;
    if (comfyStatus === 'completed') {
      try {
        const outputResponse = await fetch(`${comfyUrl}/history/${promptId}`, {
          headers: { 'bypass-tunnel-reminder': 'true' },
        });
        if (outputResponse.ok) {
          const historyData = await outputResponse.json();
          const jobHistory = historyData[promptId];
          
          if (jobHistory?.outputs) {
            // Find the first image output
            for (const node of Object.values(jobHistory.outputs)) {
              if (node.images?.length > 0) {
                generatedImage = `/api/ai/output/${node.images[0].filename}`;
                break;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking ComfyUI output:', error);
      }
    }

    // Update project status if needed
    if (project.status !== comfyStatus && ['queued', 'processing', 'completed'].includes(comfyStatus)) {
      project.status = comfyStatus;
      if (generatedImage) {
        project.outputImage = generatedImage;
      }
      await project.save();
    }

    return Response.json({
      status: comfyStatus,
      projectId: project._id,
      promptId: promptId,
      generatedImage: generatedImage || project.outputImage,
      outputImage: generatedImage || project.outputImage,
      processingTime: project.processingTime,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    });

  } catch (error) {
    console.error('❌ Status API error:', error);
    return Response.json({ 
      error: 'Status check failed', 
      message: error.message 
    }, { status: 500 });
  }
}
