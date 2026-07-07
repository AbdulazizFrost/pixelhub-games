"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import WebGLPlayer from '@/components/WebGLPlayer';
import GlassPanel from '@/components/GlassPanel';
import { ArrowLeft, Play, AlertCircle, Award, Trophy } from 'lucide-react';

interface GamePlayInfo {
  id: string;
  title: string;
  slug: string;
  versions: Array<{ buildPath: string }>;
}

export default function PlayGamePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const { apiUrl, authFetch } = useAuth();
  const { t } = useLocale();
  
  const [game, setGame] = useState<GamePlayInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [playUrl, setPlayUrl] = useState('');
  
  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: 'achievement' | 'score' | null } | null>(null);

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

            // Save to local storage played list for library/recent filters
            try {
              const played = JSON.parse(localStorage.getItem('pixelhub_played') || '[]');
              const filtered = played.filter((s: string) => s !== data.game.slug);
              filtered.push(data.game.slug);
              localStorage.setItem('pixelhub_played', JSON.stringify(filtered));
            } catch (e) {
              console.error("Local storage played save failed:", e);
            }
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

  // Handle Event message updates from WebGL Iframe (postMessage API listener)
  useEffect(() => {
    if (!game) return;
    const gameId = game.id;

    function handleGameMessage(event: MessageEvent) {
      // Allow messages with event structure
      const { type, data } = event.data || {};

      if (type === 'UNLOCK_ACHIEVEMENT') {
        const achievementName = data?.name;
        if (!achievementName) return;

        authFetch(`/games/${gameId}/achievements/unlock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ achievementName })
        })
        .then(async (res) => {
          if (res.ok) {
            const result = await res.json();
            setToast({
              message: `Достижение: "${achievementName}" (+${result.xpAwarded} XP)`,
              type: 'achievement'
            });
            setTimeout(() => setToast(null), 5000);
          }
        })
        .catch((err) => console.error("Failed to unlock achievement:", err));
      }

      if (type === 'SUBMIT_SCORE') {
        const score = data?.score;
        if (score === undefined || score === null) return;

        authFetch(`/games/${gameId}/leaderboard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score })
        })
        .then(async (res) => {
          if (res.ok) {
            setToast({
              message: `Новый рекорд отправлен: ${score.toLocaleString()}`,
              type: 'score'
            });
            setTimeout(() => setToast(null), 5000);
          }
        })
        .catch((err) => console.error("Failed to submit score:", err));
      }
    }

    window.addEventListener('message', handleGameMessage);
    return () => window.removeEventListener('message', handleGameMessage);
  }, [game, authFetch]);

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
        <h2 className="text-xl font-bold text-red-400">Не удалось запустить движок</h2>
        <p className="text-mutedText mt-2">Путь к файлам игры отсутствует или недействителен.</p>
        <Link href={`/game/${slug}`} className="mt-6 inline-flex items-center gap-2 px-4 py-2 border border-white/5 bg-white/5 rounded-lg text-xs font-bold text-primary hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Назад к игре
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
            <p className="text-[10px] text-mutedText mt-0.5">Изолированный фрейм движка HTML5</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-mutedText bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 font-semibold">
          <Play className="w-3.5 h-3.5 text-neonGreen fill-neonGreen animate-pulse" />
          Игра в браузере
        </div>

      </div>

      {/* Play Canvas container */}
      <WebGLPlayer gameTitle={game.title} gameUrl={playUrl} />

      {/* Floating Toast Notification Overlay */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slideIn">
          <GlassPanel glow className={`flex items-center gap-3 p-4 border rounded-2xl shadow-2xl backdrop-blur-md max-w-sm ${toast.type === 'achievement' ? 'border-yellow-500/30 bg-[#161208]/95' : 'border-primary/30 bg-[#081216]/95'}`}>
            <div className={`p-2.5 rounded-xl ${toast.type === 'achievement' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-primary/20 text-primary'}`}>
              {toast.type === 'achievement' ? (
                <Award className="w-6 h-6 animate-bounce" />
              ) : (
                <Trophy className="w-6 h-6 animate-pulse" />
              )}
            </div>
            <div>
              <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-mutedText">
                {toast.type === 'achievement' ? 'Достижение разблокировано!' : 'Рекорд установлен!'}
              </h4>
              <p className="text-xs font-bold text-gray-200 mt-0.5">{toast.message}</p>
            </div>
          </GlassPanel>
        </div>
      )}

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
