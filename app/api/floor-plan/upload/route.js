import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import FloorPlanProject from '@/src/models/FloorPlanProject';
import { connectDB } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/auth/jwt';

const execAsync = promisify(exec);

export async function POST(req) {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = authUser.id;

  await connectDB();
  
  try {
    const formData = await req.formData();
    const photos = formData.getAll('photos');
    const roomName = formData.get('roomName') || 'My Room';
    
    if (!photos || photos.length < 3) {
      return NextResponse.json(
        { error: 'Please upload at least 3 photos' },
        { status: 400 }
      );
    }
    
    if (photos.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 photos allowed' },
        { status: 400 }
      );
    }
    
    const projectId = uuidv4();
    
    // Save photos to disk
    const photosDir = path.join(
      process.cwd(), 'public', 'floor-plan-photos', projectId
    );
    fs.mkdirSync(photosDir, { recursive: true });
    
    const savedPhotos = [];
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const buffer = Buffer.from(await photo.arrayBuffer());
      const ext = photo.name.split('.').pop() || 'jpg';
      const filename = `photo_${String(i).padStart(3, '0')}.${ext}`;
      const filepath = path.join(photosDir, filename);
      fs.writeFileSync(filepath, buffer);
      
      savedPhotos.push({
        originalUrl: `/floor-plan-photos/${projectId}/${filename}`,
        comfyFilename: filename,
        order: i,
      });
    }
    
    // Create MongoDB document
    const project = await FloorPlanProject.create({
      userId,
      roomName,
      photos: savedPhotos,
      status: 'photos_uploaded',
      processingLog: [`${photos.length} photos uploaded at ${new Date().toISOString()}`],
    });
    
    // Output directory for results
    const outputDir = path.join(
      process.cwd(), 'public', 'floor-plan-output', project._id.toString()
    );
    fs.mkdirSync(outputDir, { recursive: true });
    
    // Fire-and-forget reconstruction
    const scriptPath = path.join(process.cwd(), 'scripts', 'reconstruct_room.py');
    const cmd = [
      'python3', scriptPath,
      '--project_id', project._id.toString(),
      '--photos_dir', photosDir,
      '--output_dir', outputDir,
    ].join(' ');
    
    // Update status to processing
    await FloorPlanProject.findByIdAndUpdate(project._id, {
      status: 'processing',
      $push: { processingLog: 'Reconstruction started' }
    });
    
    // Run async
    execAsync(cmd, { timeout: 300000 }) // 5 min timeout
      .then(async ({ stdout, stderr }) => {
        // Parse result JSON from stdout
        const resultLine = stdout
          .split('\n')
          .find(l => l.startsWith('RESULT_JSON:'));
        
        if (!resultLine) {
          await FloorPlanProject.findByIdAndUpdate(project._id, {
            status: 'error',
            errorMessage: 'No result from reconstruction script',
          });
          return;
        }
        
        const metadata = JSON.parse(resultLine.replace('RESULT_JSON:', ''));
        
        await FloorPlanProject.findByIdAndUpdate(project._id, {
          status: 'point_cloud_ready',
          pointCloud: {
            plyFilePath: metadata.ply_file,
            pointCount: metadata.point_count,
            boundingBox: metadata.bounding_box,
            cameraPositions: metadata.camera_positions,
            generatedAt: new Date(),
          },
          $push: {
            processingLog: `Point cloud ready: ${metadata.point_count} points`
          }
        });
        
        console.log(`✅ Floor plan project ${project._id} reconstruction complete`);
      })
      .catch(async (err) => {
        console.error('Reconstruction error:', err.message);
        await FloorPlanProject.findByIdAndUpdate(project._id, {
          status: 'error',
          errorMessage: err.message,
          $push: { processingLog: `Error: ${err.message}` }
        });
      });
    
    return NextResponse.json({
      success: true,
      projectId: project._id.toString(),
      photoCount: savedPhotos.length,
      message: 'Photos uploaded. Reconstruction started.',
    });
    
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
