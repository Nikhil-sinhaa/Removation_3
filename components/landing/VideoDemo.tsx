// components/landing/VideoDemo.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  X,
  SkipBack,
  SkipForward,
  Settings,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface VideoDemoProps {
  className?: string;
  lang?: "en" | "hi";
}

interface VideoChapter {
  id: string;
  title: string;
  titleHi: string;
  time: number;
  duration: number;
  thumbnail: string;
}

const videoChapters: VideoChapter[] = [
  {
    id: "intro",
    title: "Introduction to Removation.ai",
    titleHi: "Removation.ai का परिचय",
    time: 0,
    duration: 15,
    thumbnail: "/images/video/chapter-1.jpg",
  },
  {
    id: "upload",
    title: "Upload Your Room Photo",
    titleHi: "अपने कमरे की फोटो अपलोड करें",
    time: 15,
    duration: 20,
    thumbnail: "/images/video/chapter-2.jpg",
  },
  {
    id: "style",
    title: "Choose Your Style",
    titleHi: "अपनी स्टाइल चुनें",
    time: 35,
    duration: 25,
    thumbnail: "/images/video/chapter-3.jpg",
  },
  {
    id: "generate",
    title: "AI Generation in Seconds",
    titleHi: "सेकंड्स में AI जनरेशन",
    time: 60,
    duration: 20,
    thumbnail: "/images/video/chapter-4.jpg",
  },
  {
    id: "vastu",
    title: "Vastu Score Analysis",
    titleHi: "वास्तु स्कोर विश्लेषण",
    time: 80,
    duration: 30,
    thumbnail: "/images/video/chapter-5.jpg",
  },
  {
    id: "cost",
    title: "Real-Time Cost Calculator",
    titleHi: "रियल-टाइम कॉस्ट कैलकुलेटर",
    time: 110,
    duration: 25,
    thumbnail: "/images/video/chapter-6.jpg",
  },
  {
    id: "export",
    title: "Export & Share Results",
    titleHi: "परिणाम एक्सपोर्ट और शेयर करें",
    time: 135,
    duration: 15,
    thumbnail: "/images/video/chapter-7.jpg",
  },
];

const playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
const qualityOptions = ["Auto", "1080p", "720p", "480p", "360p"];

export function VideoDemo({ className, lang = "en" }: VideoDemoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(150);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState("Auto");
  const [showChapters, setShowChapters] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  const content = {
    en: {
      title: "See Removation.ai in Action",
      subtitle: "Watch how easy it is to transform your space with AI",
      watchDemo: "Watch Demo",
      playingNow: "Playing Now",
      chapters: "Chapters",
      speed: "Speed",
      quality: "Quality",
      watchTime: "Watch Time",
      skipIntro: "Skip Intro",
    },
    hi: {
      title: "Removation.ai को एक्शन में देखें",
      subtitle: "देखें कि AI के साथ अपने स्पेस को बदलना कितना आसान है",
      watchDemo: "डेमो देखें",
      playingNow: "अभी चल रहा है",
      chapters: "अध्याय",
      speed: "स्पीड",
      quality: "क्वालिटी",
      watchTime: "देखने का समय",
      skipIntro: "इंट्रो स्किप करें",
    },
  };

  const t = content[lang];

  // Get current chapter
  const currentChapter =
    videoChapters.find(
      (chapter, index) =>
        currentTime >= chapter.time &&
        (index === videoChapters.length - 1 ||
          currentTime < videoChapters[index + 1].time)
    ) || videoChapters[0];

  // Format time
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Handle play/pause
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  // Handle mute/unmute
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  // Handle fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Handle progress click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Handle chapter click
  const handleChapterClick = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
      setShowChapters(false);
    }
  };

  // Handle skip
  const handleSkip = useCallback((seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(
        0,
        Math.min(duration, currentTime + seconds)
      );
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, [duration, currentTime]);

  // Handle playback speed
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Auto-hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "m":
          toggleMute();
          break;
        case "f":
          toggleFullscreen();
          break;
        case "ArrowLeft":
          handleSkip(-10);
          break;
        case "ArrowRight":
          handleSkip(10);
          break;
        case "Escape":
          if (isFullscreen) {
            toggleFullscreen();
          } else {
            setIsModalOpen(false);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, isPlaying, isMuted, isFullscreen, handleSkip, toggleFullscreen, toggleMute, togglePlay]);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered((bufferedEnd / video.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      video.currentTime = 0;
    };

    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("progress", handleProgress);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("progress", handleProgress);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
    };
  }, [isModalOpen]);

  return (
    <section
      ref={sectionRef}
      className={cn("py-24 lg:py-32 bg-gradient-to-b from-black to-zinc-900 relative overflow-hidden", className)}
    >
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-5" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm text-white/80 mb-6"
          >
            <Play className="w-4 h-4" />
            2 min demo
          </motion.span>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            {t.title}
          </h2>
          <p className="text-xl text-white/60">{t.subtitle}</p>
        </motion.div>

        {/* Video Preview Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative max-w-5xl mx-auto"
        >
          {/* Main video preview */}
          <div
            className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 shadow-2xl cursor-pointer group"
            onClick={() => setIsModalOpen(true)}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {/* Thumbnail */}
            <div className="absolute inset-0">
              <img
                src="/images/video/thumbnail.jpg"
                alt="Video thumbnail"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
            </div>

            {/* Animated play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: isHovering ? 1.1 : 1 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                {/* Pulse rings */}
                <motion.div
                  animate={{
                    scale: [1, 1.5, 1.5],
                    opacity: [0.5, 0, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                  className="absolute inset-0 bg-white rounded-full"
                />
                <motion.div
                  animate={{
                    scale: [1, 1.5, 1.5],
                    opacity: [0.3, 0, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 0.5,
                  }}
                  className="absolute inset-0 bg-white rounded-full"
                />

                {/* Play button */}
                <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                  <Play className="w-10 h-10 text-zinc-900 ml-1" fill="currentColor" />
                </div>
              </motion.div>
            </div>

            {/* Chapter indicators */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              {videoChapters.map((chapter, index) => (
                <div
                  key={chapter.id}
                  className="absolute top-0 h-full bg-gradient-to-r from-purple-500 to-orange-500 opacity-50"
                  style={{
                    left: `${(chapter.time / 150) * 100}%`,
                    width: `${(chapter.duration / 150) * 100}%`,
                  }}
                />
              ))}
            </div>

            {/* Watch demo badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-6 left-6 flex items-center gap-3"
            >
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                {t.watchDemo}
              </div>
            </motion.div>

            {/* Duration badge */}
            <div className="absolute bottom-6 right-6 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-white text-sm font-medium">
              2:30
            </div>
          </div>

          {/* Chapter preview cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4"
          >
            {videoChapters.map((chapter, index) => (
              <motion.button
                key={chapter.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                onClick={() => {
                  setIsModalOpen(true);
                  setTimeout(() => handleChapterClick(chapter.time), 500);
                }}
                className="group relative bg-zinc-800/50 rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-all"
              >
                {/* Thumbnail */}
                <div className="aspect-video relative">
                  <img
                    src={chapter.thumbnail}
                    alt={lang === "hi" ? chapter.titleHi : chapter.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-xs text-white font-medium">
                    {formatTime(chapter.time)}
                  </div>
                </div>
                {/* Title */}
                <div className="p-2">
                  <p className="text-xs text-white/80 line-clamp-2">
                    {lang === "hi" ? chapter.titleHi : chapter.title}
                  </p>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              ref={containerRef}
              className={cn(
                "relative w-full max-w-6xl mx-4",
                isFullscreen && "max-w-none mx-0 h-full"
              )}
              onClick={(e) => e.stopPropagation()}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => isPlaying && setShowControls(false)}
            >
              {/* Close button */}
              {!isFullscreen && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-12 right-0 text-white hover:bg-white/10"
                  onClick={() => setIsModalOpen(false)}
                >
                  <X className="w-6 h-6" />
                </Button>
              )}

              {/* Video container */}
              <div
                className={cn(
                  "relative aspect-video bg-black rounded-xl overflow-hidden",
                  isFullscreen && "rounded-none h-full"
                )}
              >
                {/* Video element */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  src="/videos/demo.mp4"
                  poster="/images/video/thumbnail.jpg"
                  playsInline
                  onClick={togglePlay}
                />

                {/* Loading spinner */}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                  </div>
                )}

                {/* Center play/pause indicator */}
                <AnimatePresence>
                  {!isPlaying && !isLoading && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0 flex items-center justify-center cursor-pointer"
                      onClick={togglePlay}
                    >
                      <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play
                          className="w-10 h-10 text-white ml-1"
                          fill="white"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Skip intro button */}
                {currentTime < 10 && currentTime > 0 && (
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="absolute bottom-24 right-4 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors"
                    onClick={() => handleChapterClick(15)}
                  >
                    {t.skipIntro}
                  </motion.button>
                )}

                {/* Controls overlay */}
                <AnimatePresence>
                  {showControls && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"
                    >
                      {/* Top bar */}
                      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
                        {/* Current chapter */}
                        <div className="flex items-center gap-2 text-white">
                          <span className="text-sm text-white/60">
                            {t.playingNow}:
                          </span>
                          <span className="text-sm font-medium">
                            {lang === "hi"
                              ? currentChapter.titleHi
                              : currentChapter.title}
                          </span>
                        </div>

                        {/* Right actions */}
                        {isFullscreen && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/10"
                            onClick={() => {
                              toggleFullscreen();
                              setIsModalOpen(false);
                            }}
                          >
                            <X className="w-5 h-5" />
                          </Button>
                        )}
                      </div>

                      {/* Bottom controls */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        {/* Progress bar */}
                        <div
                          ref={progressRef}
                          className="relative h-1 bg-white/20 rounded-full cursor-pointer mb-4 group/progress"
                          onClick={handleProgressClick}
                        >
                          {/* Buffered */}
                          <div
                            className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
                            style={{ width: `${buffered}%` }}
                          />
                          {/* Progress */}
                          <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-orange-500 rounded-full"
                            style={{ width: `${(currentTime / duration) * 100}%` }}
                          />
                          {/* Chapter markers */}
                          {videoChapters.map((chapter) => (
                            <div
                              key={chapter.id}
                              className="absolute top-1/2 -translate-y-1/2 w-1 h-3 bg-white/50 rounded-full"
                              style={{ left: `${(chapter.time / duration) * 100}%` }}
                            />
                          ))}
                          {/* Thumb */}
                          <div
                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity"
                            style={{ left: `${(currentTime / duration) * 100}%` }}
                          />
                        </div>

                        {/* Control buttons */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Play/Pause */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-white hover:bg-white/10"
                              onClick={togglePlay}
                            >
                              {isPlaying ? (
                                <Pause className="w-5 h-5" fill="white" />
                              ) : (
                                <Play className="w-5 h-5" fill="white" />
                              )}
                            </Button>

                            {/* Skip back */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-white hover:bg-white/10"
                              onClick={() => handleSkip(-10)}
                            >
                              <SkipBack className="w-5 h-5" />
                            </Button>

                            {/* Skip forward */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-white hover:bg-white/10"
                              onClick={() => handleSkip(10)}
                            >
                              <SkipForward className="w-5 h-5" />
                            </Button>

                            {/* Volume */}
                            <div className="flex items-center gap-2 group/volume">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/10"
                                onClick={toggleMute}
                              >
                                {isMuted || volume === 0 ? (
                                  <VolumeX className="w-5 h-5" />
                                ) : (
                                  <Volume2 className="w-5 h-5" />
                                )}
                              </Button>
                              <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all">
                                <Slider
                                  value={[isMuted ? 0 : volume]}
                                  max={1}
                                  step={0.1}
                                  onValueChange={handleVolumeChange}
                                  className="w-20"
                                />
                              </div>
                            </div>

                            {/* Time */}
                            <span className="text-sm text-white/80">
                              {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Chapters */}
                            <DropdownMenu
                              open={showChapters}
                              onOpenChange={setShowChapters}
                            >
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-white hover:bg-white/10"
                                >
                                  {t.chapters}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-72 bg-zinc-900 border-white/10"
                              >
                                {videoChapters.map((chapter) => (
                                  <DropdownMenuItem
                                    key={chapter.id}
                                    className="flex items-center gap-3 p-2 cursor-pointer hover:bg-white/5"
                                    onClick={() => handleChapterClick(chapter.time)}
                                  >
                                    <img
                                      src={chapter.thumbnail}
                                      alt=""
                                      className="w-16 h-10 object-cover rounded"
                                    />
                                    <div className="flex-1">
                                      <p className="text-sm text-white">
                                        {lang === "hi"
                                          ? chapter.titleHi
                                          : chapter.title}
                                      </p>
                                      <p className="text-xs text-white/50">
                                        {formatTime(chapter.time)}
                                      </p>
                                    </div>
                                    {currentChapter.id === chapter.id && (
                                      <Check className="w-4 h-4 text-green-500" />
                                    )}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Speed */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-white hover:bg-white/10"
                                >
                                  {playbackSpeed}x
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="bg-zinc-900 border-white/10"
                              >
                                {playbackSpeeds.map((speed) => (
                                  <DropdownMenuItem
                                    key={speed}
                                    className="flex items-center justify-between cursor-pointer hover:bg-white/5"
                                    onClick={() => handleSpeedChange(speed)}
                                  >
                                    <span className="text-white">{speed}x</span>
                                    {playbackSpeed === speed && (
                                      <Check className="w-4 h-4 text-green-500" />
                                    )}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Quality */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-white hover:bg-white/10"
                                >
                                  <Settings className="w-5 h-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="bg-zinc-900 border-white/10"
                              >
                                {qualityOptions.map((q) => (
                                  <DropdownMenuItem
                                    key={q}
                                    className="flex items-center justify-between cursor-pointer hover:bg-white/5"
                                    onClick={() => setQuality(q)}
                                  >
                                    <span className="text-white">{q}</span>
                                    {quality === q && (
                                      <Check className="w-4 h-4 text-green-500" />
                                    )}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Fullscreen */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-white hover:bg-white/10"
                              onClick={toggleFullscreen}
                            >
                              {isFullscreen ? (
                                <Minimize className="w-5 h-5" />
                              ) : (
                                <Maximize className="w-5 h-5" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Chapters sidebar (visible in modal) */}
              {!isFullscreen && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="hidden lg:block absolute top-0 -right-80 w-72 h-full overflow-y-auto"
                >
                  <h3 className="text-white font-semibold mb-4">{t.chapters}</h3>
                  <div className="space-y-2">
                    {videoChapters.map((chapter) => (
                      <button
                        key={chapter.id}
                        onClick={() => handleChapterClick(chapter.time)}
                        className={cn(
                          "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left",
                          currentChapter.id === chapter.id
                            ? "bg-white/10"
                            : "hover:bg-white/5"
                        )}
                      >
                        <div className="relative w-20 h-12 rounded overflow-hidden flex-shrink-0">
                          <img
                            src={chapter.thumbnail}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          {currentChapter.id === chapter.id && (
                            <div className="absolute inset-0 bg-purple-500/30 flex items-center justify-center">
                              <Play className="w-4 h-4 text-white" fill="white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">
                            {lang === "hi" ? chapter.titleHi : chapter.title}
                          </p>
                          <p className="text-xs text-white/50">
                            {formatTime(chapter.time)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default VideoDemo;