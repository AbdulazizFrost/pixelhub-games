"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import Sidebar from '@/components/Sidebar';
import GameCard from '@/components/GameCard';
import GlassPanel from '@/components/GlassPanel';
import { Sparkles } from 'lucide-react';

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
  category?: { name: string; slug: string };
}

function BrowseContent() {
  const { apiUrl } = useAuth();
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') || 'all';

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGames() {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/games?status=APPROVED`);
        if (res.ok) {
          const data = await res.json();
          setGames(data.games);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadGames();
  }, [apiUrl]);

  const filteredGames = games.filter((game) => {
    return categoryParam === 'all' || game.category?.slug === categoryParam;
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 select-none">
      <Sidebar />
      <div className="xl:col-span-4 flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-primary text-glow-blue" />
            {t('browse')}
          </h1>
          <p className="text-xs text-mutedText mt-1.5">
            {categoryParam === 'all' 
              ? 'Просмотр всех доступных игр на платформе.' 
              : `Просмотр игр в категории: ${categoryParam.toUpperCase()}`}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredGames.length === 0 ? (
          <GlassPanel className="text-center py-24">
            <span className="text-sm text-mutedText block">В этой категории пока нет игр.</span>
          </GlassPanel>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGames.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-40">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <BrowseContent />
    </Suspense>
  );
}
