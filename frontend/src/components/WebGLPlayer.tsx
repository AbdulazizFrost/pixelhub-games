"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Maximize2, RotateCcw, Volume2, VolumeX, ShieldAlert, Cpu } from 'lucide-react';

interface WebGLPlayerProps {
  gameTitle: string;
  gameUrl: string; // resolved static path e.g. http://localhost:5000/uploads/games/extracted/neon-runner/index.html
}

export default function WebGLPlayer({ gameTitle, gameUrl }: WebGLPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [fps, setFps] = useState(60);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Simulated WebGL Asset Loader
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setLoading(false), 500); // fade loading screen
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 150);

    return () => clearInterval(timer);
  }, []);

  // Real Frame Rate Tracker (Tracks the browser render loop frames)
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const calculateFps = () => {
      const now = performance.now();
      frameCount++;

      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }

      animationFrameId = requestAnimationFrame(calculateFps);
    };

    animationFrameId = requestAnimationFrame(calculateFps);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Fullscreen request failed: ${err.message}`);
      });
    }
  };

  const handleReload = () => {
    setLoading(true);
    setProgress(0);
    
    // Reload iframe
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }

    // Restart load progress
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setLoading(false), 300);
          return 100;
        }
        return prev + 15;
      });
    }, 100);
  };

  return (
    <div 
      ref={containerRef}
      className="relative flex flex-col w-full h-[400px] md:h-[550px] bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
    >
      
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-[#080b10] z-20 flex flex-col items-center justify-center p-6 text-center">
          <div className="relative w-24 h-24 mb-6">
            {/* Spinning Neon loaders */}
            <div className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
            <div className="absolute inset-2 border-4 border-b-secondary border-t-transparent border-r-transparent border-l-transparent rounded-full animate-spin duration-1000" />
            <div className="absolute inset-4 flex items-center justify-center">
              <Cpu className="w-8 h-8 text-primary/60" />
            </div>
          </div>

          <h3 className="text-xl font-bold tracking-wider text-glow-blue uppercase">
            Compiling WebGL Shaders
          </h3>
          <p className="text-xs text-mutedText mt-1">Initializing Canvas Engine & Assets</p>

          {/* Progress Bar Container */}
          <div className="w-64 h-2 bg-white/5 border border-white/10 rounded-full overflow-hidden mt-6">
            <div 
              className="h-full bg-gradient-to-r from-primary via-blue-500 to-secondary transition-all duration-300 shadow-[0_0_10px_#00f0ff]" 
              style={{ width: `${progress}%` }} 
            />
          </div>
          <span className="text-xs font-semibold text-primary mt-2">{progress}%</span>
        </div>
      )}

      {/* HTML5 Iframe Game Embed */}
      <iframe
        ref={iframeRef}
        src={gameUrl}
        className="w-full flex-grow border-0 bg-transparent"
        allow="autoplay; fullscreen; keyboard; gamepad"
        sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"
        title={gameTitle}
      />

      {/* Premium Dashboard Overlay Controller */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#0d111a] border-t border-white/5 z-10 select-none">
        
        {/* Play State Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/40 border border-white/5 text-[11px] font-bold text-neonGreen text-glow-green">
            <span className="w-1.5 h-1.5 rounded-full bg-neonGreen animate-ping" />
            ONLINE
          </div>
          
          <div className="flex items-center gap-1 text-[11px] font-bold text-primary">
            <Cpu className="w-3.5 h-3.5" />
            <span>FPS: {fps}</span>
          </div>
        </div>

        {/* Console Controls */}
        <div className="flex items-center gap-6">
          
          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMuted(!isMuted)} 
              className="text-gray-300 hover:text-primary transition-colors"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                if(isMuted) setIsMuted(false);
              }}
              className="w-16 md:w-24 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Reload Build */}
          <button 
            onClick={handleReload}
            className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-primary transition-colors font-bold"
            title="Reload Game Build"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">RELOAD</span>
          </button>

          {/* Toggle Fullscreen */}
          <button 
            onClick={handleFullscreen}
            className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-primary transition-colors font-bold"
            title="Go Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="hidden sm:inline">FULLSCREEN</span>
          </button>

        </div>

      </div>

    </div>
  );
}
