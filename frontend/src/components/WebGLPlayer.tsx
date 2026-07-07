"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Maximize2, RotateCcw, Volume2, VolumeX, ShieldCheck, Cpu, Play, Gamepad2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WebGLPlayerProps {
  gameTitle: string;
  gameUrl: string;
}

export default function WebGLPlayer({ gameTitle, gameUrl }: WebGLPlayerProps) {
  // Game Boot stages: splash -> loading -> ready/playing
  const [hasStarted, setHasStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [fps, setFps] = useState(60);
  const [playTime, setPlayTime] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Play synthesized retro arcade chime sound
  const playBootSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
      
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * 0.1);
        
        gain.gain.setValueAtTime(0.12, now + index * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.35);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + index * 0.1);
        osc.stop(now + index * 0.1 + 0.35);
      });
    } catch (e) {
      console.error("Audio Context failed:", e);
    }
  };

  const handleStartGame = () => {
    playBootSound();
    setHasStarted(true);
  };

  // Simulated WebGL Asset Loader (Starts after player clicks "Press Start")
  useEffect(() => {
    if (!hasStarted) return;
    
    setProgress(0);
    setLoading(true);
    
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setLoading(false), 500); // fade loading screen
          return 100;
        }
        return prev + Math.floor(Math.random() * 12) + 6;
      });
    }, 120);

    return () => clearInterval(timer);
  }, [hasStarted]);

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

  // Session play time timer
  useEffect(() => {
    if (!hasStarted || loading) return;
    const timer = setInterval(() => {
      setPlayTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [hasStarted, loading]);

  const formatPlayTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
    playBootSound();
    setLoading(true);
    setProgress(0);
    setPlayTime(0);
    
    // Reload iframe
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }

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
      className="relative flex flex-col w-full h-[400px] md:h-[580px] bg-black border-2 border-primary/20 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,240,255,0.1)] transition-all"
    >
      
      {/* 1. Insert Coin / Press Start Arcade Cabinet Splash Screen */}
      {!hasStarted && (
        <div className="absolute inset-0 bg-[#070b13] z-30 flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
          
          {/* Cyber scanline overlay effects */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0),rgba(255,255,255,0.015)_50%,rgba(0,0,0,0.15)_50%,rgba(0,0,0,0.3))] bg-[length:100%_4px] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080b10] via-transparent to-[#080b10] opacity-80 pointer-events-none" />

          {/* Glowing logo / design box */}
          <div className="p-4 rounded-3xl bg-primary/5 border border-primary/25 shadow-neonBlue mb-6 animate-pulse">
            <Gamepad2 className="w-12 h-12 text-primary" />
          </div>

          <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/30 px-3 py-1 rounded-md mb-2">
            ARCADE CABINET EMULATOR
          </span>
          
          <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white mb-2 uppercase text-glow-blue max-w-lg">
            {gameTitle}
          </h2>
          
          <p className="text-xs text-mutedText max-w-md leading-relaxed mb-8">
            WebGL Game engine build will load securely inside sandboxed container frame. Supports keyboard and gamepad.
          </p>

          {/* Interactive neon blinking start button */}
          <button
            onClick={handleStartGame}
            className="group relative flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-primary via-accent to-secondary text-black font-black text-sm rounded-xl hover:scale-105 shadow-[0_0_25px_#00f0ff] hover:brightness-110 active:scale-95 transition-all duration-300"
          >
            <Play className="w-4 h-4 fill-black text-black group-hover:scale-110 transition-transform" />
            PRESS START TO PLAY
          </button>

          {/* Keybindings guide tray */}
          <div className="absolute bottom-6 flex gap-6 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><kbd className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white text-[9px]">WASD</kbd> Move</span>
            <span className="flex items-center gap-1.5"><kbd className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white text-[9px]">Space</kbd> Action</span>
            <span className="flex items-center gap-1.5"><kbd className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white text-[9px]">Esc</kbd> Pause</span>
          </div>

        </div>
      )}

      {/* 2. Loading Shader Overlay */}
      {hasStarted && loading && (
        <div className="absolute inset-0 bg-[#080b10] z-20 flex flex-col items-center justify-center p-6 text-center">
          <div className="relative w-24 h-24 mb-6">
            {/* Spinning Neon loaders */}
            <div className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
            <div className="absolute inset-2 border-4 border-b-secondary border-t-transparent border-r-transparent border-l-transparent rounded-full animate-spin duration-1000" />
            <div className="absolute inset-4 flex items-center justify-center">
              <Cpu className="w-8 h-8 text-primary/60" />
            </div>
          </div>

          <h3 className="text-lg font-black tracking-wider text-glow-blue uppercase">
            Compiling WebGL Shaders
          </h3>
          <p className="text-[10px] text-mutedText mt-1 uppercase tracking-wide">Initializing Canvas Engine & Assets</p>

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

      {/* 3. HTML5 Iframe Game Embed */}
      {hasStarted && (
        <iframe
          ref={iframeRef}
          src={gameUrl}
          className="w-full flex-grow border-0 bg-[#070b13]"
          allow="autoplay; fullscreen; keyboard; gamepad"
          sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"
          title={gameTitle}
        />
      )}

      {/* 4. Premium Console Controller Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-3 bg-[#0d111a] border-t border-white/5 z-10 select-none">
        
        {/* Play State Info */}
        <div className="flex items-center gap-5 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/40 border border-white/5 text-[10px] font-bold text-neonGreen text-glow-green">
            <span className="w-1.5 h-1.5 rounded-full bg-neonGreen animate-ping" />
            ONLINE
          </div>
          
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary">
            <Cpu className="w-4 h-4" />
            <span>FPS: {fps}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-bold text-mutedText border-l border-white/10 pl-4">
            <ClockIcon className="w-4 h-4 text-mutedText" />
            <span>{formatPlayTime(playTime)}</span>
          </div>
        </div>

        {/* Console Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
          
          {/* Sandboxed Container Security Label */}
          <div className="hidden lg:flex items-center gap-1.5 text-[9px] font-black text-neonGreen/80 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-neonGreen" />
            <span>Container Sandboxed</span>
          </div>

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

// Simple clock icon inline SVG to avoid dependencies
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}
