/**
 * API Route for Individual Redesign Project — Next.js App Router
 * Handles GET/DELETE /api/ai/redesign/[projectId]
 *
 * Root-cause fix: removed import from deprecated Express controller
 * (src/controllers/redesign.js) which used multer (native binary) causing
 * Turbopack "Module not found" errors. Now uses native Next.js patterns
 * consistent with the parent route.js.
 */

import { connectDB } from '../../../../../lib/db/mongodb';
import Project from '../../../../../src/models/Project.js';
import { unlink } from 'fs/promises';
import path from 'path';

// ─── GET /api/ai/redesign/[projectId] ─────────────────────────────────────────

export async function GET(request, { params }) {
  await connectDB();

  const { projectId } = await params;

  if (!projectId) {
    return Response.json({ error: 'Project ID required' }, { status: 400 });
  }

  try {
    const project = await Project.findById(projectId);

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    return Response.json({
      projectId:     project._id,
      status:        project.status,
      originalImage: project.originalImage,
      generatedImage: project.resultImage || project.generatedImage,
      resultImage:   project.resultImage,
      processingStartedAt:       project.processingStartedAt,
      processingCompletedAt:     project.processingCompletedAt,
      processingDurationSeconds: project.processingDurationSeconds,
      errorMessage:  project.errorMessage,
      aiConfig:      project.aiConfig,
      name:          project.name,
    });
  } catch (error) {
    console.error('❌ Get project error:', error);
    return Response.json(
      { error: 'Server error', message: error.message },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/ai/redesign/[projectId] ──────────────────────────────────────

export async function DELETE(request, { params }) {
  await connectDB();

  const { projectId } = await params;

  if (!projectId) {
    return Response.json({ error: 'Project ID required' }, { status: 400 });
  }

  try {
    const project = await Project.findById(projectId);

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // Clean up associated image files
    try {
      if (project.originalImage) {
        await unlink(path.join(process.cwd(), 'public', project.originalImage)).catch(() => {});
      }
      if (project.resultImage && project.resultImage.startsWith('/uploads/')) {
        await unlink(path.join(process.cwd(), 'public', project.resultImage)).catch(() => {});
      }
    } catch (fileError) {
      console.warn('⚠️ Failed to delete files:', fileError.message);
    }

    await Project.findByIdAndDelete(projectId);

    return Response.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('❌ Delete project error:', error);
    return Response.json(
      { error: 'Server error', message: error.message },
      { status: 500 }
    );
  }
}
