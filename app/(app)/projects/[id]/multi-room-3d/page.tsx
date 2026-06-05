'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ExternalLink, Box, ArrowLeft, Calendar, Palette, Home, ChevronRight, Eye, Download, Loader2 } from 'lucide-react';
import { downloadMultiRoomZip } from '@/lib/ai/download-multi-room';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

interface Photo {
  order: number;
  originalUrl: string;
  paintedUrl?: string;
  status: string;
}

interface MultiRoomProjectDetail {
  projectId: string;
  roomName: string;
  colorName: string;
  colorHex: string;
  marbleWorldUrl?: string;
  marbleThumbnail?: string;
  paintedCount: number;
  totalCount: number;
  createdAt: string;
  photos: Photo[];
}

export default function MultiRoom3DProjectPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<MultiRoomProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/multi-room/project-detail/${id}`)
      .then((r) => {
        if (!r.ok) {
          throw new Error('Project not found');
        }
        return r.json();
      })
      .then((data) => {
        setProject(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching project details:', err);
        setLoading(false);
      });
  }, [id]);

  const handleDownload = async () => {
    if (!project) return;
    setDownloading(true);
    try {
      await downloadMultiRoomZip(project.projectId, project.photos);
    } catch (err) {
      console.error('Failed to download multi-room photos:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100 px-4 py-8 md:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-28 rounded-xl bg-slate-800" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-16 w-1/3 rounded-xl bg-slate-800" />
            <Skeleton className="h-8 w-1/4 rounded-xl bg-slate-800" />
          </div>
          <Skeleton className="h-[300px] w-full rounded-2xl bg-slate-800" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="h-[400px] rounded-2xl bg-slate-800" />
            <Skeleton className="h-[400px] rounded-2xl bg-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center text-slate-100">
        <Box className="w-16 h-16 text-slate-500 animate-pulse" />
        <h2 className="text-2xl font-bold">Project Not Found</h2>
        <p className="text-slate-400 max-w-md">
          The 3D Room View project could not be found or has not completed processing.
        </p>
        <Button onClick={() => router.push('/projects')} className="bg-blue-600 hover:bg-blue-700">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100 pb-16">
      {/* Breadcrumb & Navigation */}
      <div className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 md:px-8 flex items-center justify-between">
          <nav className="flex items-center gap-2 text-sm text-slate-400">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              <Home className="w-4 h-4" />
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <Link href="/projects" className="hover:text-white transition-colors">
              Projects
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <span className="text-slate-200 font-medium truncate max-w-[200px]">
              {project.roomName}
            </span>
          </nav>
          
          <Button
            variant="ghost"
            onClick={() => router.push('/projects')}
            className="text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 md:px-8 space-y-8">
        {/* Header Block */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-slate-900/50 border border-slate-800/60 rounded-3xl p-6 md:p-8 backdrop-blur-sm shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-blue-600 hover:bg-blue-600 text-white border-none py-1 px-3 rounded-lg font-semibold text-xs uppercase tracking-wider">
                3D Room Project
              </Badge>
              <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(project.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
              {project.roomName}
            </h1>
            
            {/* Color Swatch Information */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/50 px-3 py-1.5 rounded-2xl shadow-inner">
                <div
                  className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: project.colorHex }}
                />
                <span className="font-semibold text-sm text-slate-200">{project.colorName}</span>
              </div>
              <span className="text-xs font-mono text-slate-500 uppercase tracking-widest bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-800/50">
                {project.colorHex}
              </span>
              <span className="text-xs font-medium text-slate-400 bg-slate-800/40 px-2.5 py-1.5 rounded-lg">
                {project.paintedCount} / {project.totalCount} Photos Painted
              </span>
            </div>
          </div>

          {/* Buttons Container */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            {project.marbleWorldUrl && (
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={project.marbleWorldUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-6 py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 w-full sm:w-auto"
              >
                <Box className="w-5 h-5 animate-pulse" />
                Explore 3D Room
                <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
              </motion.a>
            )}

            {/* Download button */}
            <a
              id="download-all-button"
              href={`/api/multi-room/download/${id}`}
              download
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold px-5 py-3 rounded-xl transition-colors"
            >
              <Download size={20} />
              Download All
            </a>
          </div>
        </motion.div>

        {/* 3D Virtual Tour Section */}
        {project.marbleWorldUrl && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Box className="w-5 h-5 text-blue-500" />
              3D Virtual Tour
            </h2>
            <div className="relative group rounded-3xl overflow-hidden border border-slate-800/80 bg-slate-900 shadow-2xl transition-all duration-300 hover:border-blue-500/40">
              {project.marbleThumbnail ? (
                <div className="relative aspect-[21/9] w-full min-h-[300px]">
                  <Image
                    src={project.marbleThumbnail}
                    alt={`${project.roomName} 3D Preview`}
                    fill
                    sizes="100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                  />
                  <div className="absolute inset-0 bg-slate-950/65 group-hover:bg-slate-950/50 transition-all duration-300 flex flex-col items-center justify-center gap-4 p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                      <Box className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-extrabold text-white mb-2">Explore the Room in 3D</h3>
                      <p className="text-slate-300 text-sm max-w-md">
                        Step inside the painted space to look around, walk between walls, and feel the color in fully interactive 3D virtual reality.
                      </p>
                    </div>
                    <a
                      href={project.marbleWorldUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 bg-white text-slate-950 font-bold px-5 py-2.5 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-2 shadow-md"
                    >
                      Enter 3D Space
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="aspect-[21/9] min-h-[260px] flex flex-col items-center justify-center gap-4 bg-gradient-to-r from-slate-900 to-blue-950 p-8 text-center">
                  <Box className="w-12 h-12 text-blue-500 animate-spin-slow" />
                  <div>
                    <h3 className="text-xl font-bold">Interactive 3D Walkthrough</h3>
                    <p className="text-slate-400 text-sm max-w-md mt-1">
                      Your 3D reconstructed room model is ready to explore in a new browser window.
                    </p>
                  </div>
                  <a
                    href={project.marbleWorldUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2"
                  >
                    Open Walkthrough
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Gallery Grids */}
        <div className="grid grid-cols-1 gap-12">
          {/* Painted Photos Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Palette className="w-5 h-5 text-indigo-400" />
                Painted Photos — {project.colorName}
              </h2>
              <Badge className="bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                After recopying
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {project.photos
                ?.filter((p: Photo) => p.paintedUrl)
                .map((photo: Photo, index: number) => (
                  <Card key={`painted-${photo.order}-${index}`} className="bg-slate-900/40 border-slate-850 overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-0">
                      <div className="relative aspect-[4/3] w-full overflow-hidden">
                        <Image
                          src={photo.paintedUrl!}
                          alt={`Painted room view ${photo.order + 1}`}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-black/75 text-white backdrop-blur-sm border-none font-medium px-2 py-0.5 text-[10px]">
                            Angle {photo.order + 1}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </motion.div>

          {/* Original Photos Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Eye className="w-5 h-5 text-teal-400" />
                Original Photos
              </h2>
              <Badge variant="outline" className="text-slate-400 border-slate-800">
                Before recopying
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {project.photos?.map((photo: Photo, index: number) => (
                <Card key={`original-${photo.order}-${index}`} className="bg-slate-900/20 border-slate-900 overflow-hidden group shadow-sm hover:shadow-md transition-all duration-300 opacity-80 hover:opacity-100">
                  <CardContent className="p-0">
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      <Image
                        src={photo.originalUrl}
                        alt={`Original room view ${photo.order + 1}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-102"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-black/60 text-slate-200 backdrop-blur-sm border-none font-medium px-2 py-0.5 text-[10px]">
                          Angle {photo.order + 1}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
