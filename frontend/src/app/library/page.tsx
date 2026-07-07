"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import Sidebar from '@/components/Sidebar';
import GameCard from '@/components/GameCard';
import GlassPanel from '@/components/GlassPanel';
import { Trophy } from 'lucide-react';

interface Game {
  id: string;
  title: string;
  slug: string;
  coverUrl: string;
  tags: string[];
  isFree: boolean;
  price: number;
  playsCount: number;
  ratingAverage: number;
  developer?: { username: string };
  category?: { name: string };
}

export default function LibraryPage() {
  const { apiUrl } = useAuth();
  const { t } = useLocale();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGames() {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/games?status=APPROVED`);
        if (res.ok) {
          const data = await res.json();
          // Load played games from local storage
          const played = JSON.parse(localStorage.getItem('pixelhub_played') || '[]');
          const filtered = data.games.filter((g: Game) => played.includes(g.slug));
          setGames(filtered);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadGames();
  }, [apiUrl]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 select-none">
      <Sidebar />
      <div className="xl:col-span-4 flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-primary text-glow-blue" />
            {t('library')}
          </h1>
          <p className="text-xs text-mutedText mt-1.5">Все игры, которые вы когда-либо запускали на платформе.</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : games.length === 0 ? (
          <GlassPanel className="text-center py-24">
            <span className="text-sm text-mutedText block">У вас пока нет игр в библиотеке.</span>
            <p className="text-xs text-mutedText mt-1">Запустите любую игру из Обзора, чтобы она появилась здесь!</p>
          </GlassPanel>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
