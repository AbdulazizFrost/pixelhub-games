"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import WebGLPlayer from '@/components/WebGLPlayer';
import GlassPanel from '@/components/GlassPanel';
import { ArrowLeft, Play, AlertCircle } from 'lucide-react';

interface GamePlayInfo {
  id: string;
  title: string;
  slug: string;
  versions: Array<{ buildPath: string }>;
}

export default function PlayGamePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const { apiUrl, authFetch } = useAuth();
  
  const [game, setGame] = useState<GamePlayInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [playUrl, setPlayUrl] = useState('');

  useEffect(() => {
    async function loadGame() {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/games/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setGame(data.game);
          
          if (data.game && data.game.versions && data.game.versions.length > 0) {
            const relativePath = data.game.versions[0].buildPath;
            // Build full URL to Express static server
            const expressHost = apiUrl.replace('/api', ''); // e.g. http://localhost:5000
            setPlayUrl(`${expressHost}${relativePath}`);
            
            // Record game launch play count
            authFetch(`/games/${data.game.id}/play`, { method: 'POST' }).catch((err) => {
              console.error("Failed to increment plays count:", err);
            });
          }
        } else {
          // Mock fallback URL
          const mockGame = getMockGameInfo(slug);
          setGame(mockGame);
          setPlayUrl(`http://localhost:5000${mockGame.versions[0].buildPath}`);
        }
      } catch (err) {
        console.error("Failed to load play data, running in mockup mode:", err);
        const mockGame = getMockGameInfo(slug);
        setGame(mockGame);
        setPlayUrl(`http://localhost:5000${mockGame.versions[0].buildPath}`);
      } finally {
        setLoading(false);
      }
    }
    loadGame();
  }, [slug, apiUrl]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!game || !playUrl) {
    return (
      <GlassPanel className="text-center py-20 max-w-xl mx-auto">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-red-400">Unable to Start Engine</h2>
        <p className="text-mutedText mt-2">The WebGL build index path is missing or invalid for this game.</p>
        <Link href={`/game/${slug}`} className="mt-6 inline-flex items-center gap-2 px-4 py-2 border border-white/5 bg-white/5 rounded-lg text-xs font-bold text-primary hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Details
        </Link>
      </GlassPanel>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      
      {/* Header controls bar */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        
        <div className="flex items-center gap-4">
          <Link 
            href={`/game/${game.slug}`}
            className="p-2.5 rounded-xl border border-white/5 bg-surface hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-white text-glow-blue">{game.title}</h1>
            <p className="text-[10px] text-mutedText mt-0.5">Sandboxed HTML5 Engine Frame</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-mutedText bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 font-semibold">
          <Play className="w-3.5 h-3.5 text-neonGreen fill-neonGreen" />
          Playing Browser Build
        </div>

      </div>

      {/* Play Canvas container */}
      <WebGLPlayer gameTitle={game.title} gameUrl={playUrl} />

    </div>
  );
}

function getMockGameInfo(slug: string): GamePlayInfo {
  return {
    id: '1',
    title: slug === 'quantum-maze' ? 'Quantum Maze' : slug === 'shadow-strike' ? 'Shadow Strike' : 'Neon Runner 2026',
    slug: slug,
    versions: [
      { buildPath: '/uploads/games/demo/index.html' }
    ]
  };
}
