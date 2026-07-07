"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import HeroBanner from '@/components/HeroBanner';
import GameCard from '@/components/GameCard';
import GlassPanel from '@/components/GlassPanel';
import { Search, Flame, Sparkles, Trophy, Calendar, Filter, MessageSquare, ChevronRight } from 'lucide-react';

interface Game {
  id: string;
  title: string;
  slug: string;
  coverUrl: string;
  bannerUrl?: string;
  shortDescription?: string;
  tags: string[];
  isFree: boolean;
  price: number;
  playsCount: number;
  ratingAverage: number;
  categoryId: string;
  createdAt: string;
  developer: { username: string };
  category: { name: string; slug: string };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function StoreFront() {
  const { apiUrl } = useAuth();
  const { t } = useLocale();
  const [games, setGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('new');
  const [loading, setLoading] = useState(true);

  // Load Store Games
  useEffect(() => {
    async function loadStore() {
      try {
        setLoading(true);
        // Load categories
        const catRes = await fetch(`${apiUrl}/games/categories`); // wait, we don't have separate route, we'll implement it or just search directly. Wait! Let's just fetch all games first.
        const res = await fetch(`${apiUrl}/games?status=APPROVED`);
        if (res.ok) {
          const data = await res.json();
          setGames(data.games);
        } else {
          // Fallback static games if API offline
          setGames(getFallbackGames());
        }
      } catch (err) {
        console.error("Failed to load backend store, loading static mock games:", err);
        setGames(getFallbackGames());
      } finally {
        setLoading(false);
      }
    }
    loadStore();
    
    // Set static categories
    setCategories([
      { id: '1', name: 'Action', slug: 'action' },
      { id: '2', name: 'Adventure', slug: 'adventure' },
      { id: '3', name: 'FPS', slug: 'fps' },
      { id: '4', name: 'Puzzle', slug: 'puzzle' },
      { id: '5', name: 'Horror', slug: 'horror' },
      { id: '6', name: 'Casual', slug: 'casual' }
    ]);
  }, [apiUrl]);

  // Filtering Logic
  const filteredGames = games.filter((game) => {
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          game.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || game.category?.slug === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Sorting Logic
  const sortedGames = [...filteredGames].sort((a, b) => {
    if (sortBy === 'plays') return b.playsCount - a.playsCount;
    if (sortBy === 'rating') return b.ratingAverage - a.ratingAverage;
    // default: new
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const featuredList = sortedGames.slice(0, 4);
  const popularList = sortedGames.filter(g => g.playsCount > 1000).slice(0, 4);
  const topWeekly = sortedGames.sort((a,b) => b.ratingAverage - a.ratingAverage).slice(0, 4);

  return (
    <div className="flex flex-col gap-10">
      
      {/* Hero Header Area */}
      <HeroBanner games={sortedGames.slice(0, 4)} />

      {/* Grid search and sort dashboard */}
      <GlassPanel glow className="flex flex-col md:flex-row gap-4 justify-between items-center py-4 px-6 mt-4">
        
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-mutedText" />
          <input 
            type="text" 
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-gray-200 outline-none focus:border-primary/40 focus:shadow-[0_0_10px_rgba(0,240,255,0.1)] transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          
          <div className="flex items-center gap-2 text-xs font-bold text-mutedText">
            <Filter className="w-4 h-4" />
            {t('sortBy')}
          </div>

          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-surface-light border border-white/5 text-xs text-gray-200 font-semibold px-3 py-2 rounded-xl outline-none cursor-pointer focus:border-primary/30"
          >
            <option value="new">{t('newReleases')}</option>
            <option value="plays">{t('popularity')}</option>
            <option value="rating">{t('topRated')}</option>
          </select>

        </div>

      </GlassPanel>

      {/* Main Store Layout (Store grid sidebar / categories) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Genre Categories Bar */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-mutedText">{t('genres')}</h3>
          
          <div id="categories" className="flex flex-wrap lg:flex-col gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedCategory === 'all' ? 'bg-primary text-black shadow-neonBlue' : 'bg-surface border border-white/5 text-gray-300 hover:bg-white/5 hover:text-white'}`}
            >
              {t('allGenres')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedCategory === cat.slug ? 'bg-primary text-black shadow-neonBlue' : 'bg-surface border border-white/5 text-gray-300 hover:bg-white/5 hover:text-white'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Social News platform block */}
          <GlassPanel className="mt-4 hidden lg:flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-gray-200">{t('communityNews')}</span>
            </div>
            
            <div className="flex flex-col gap-3">
              <div>
                <Link href="#" className="text-xs font-extrabold text-gray-300 hover:text-primary transition-colors">
                  WebGL 2.0 Update Rollout
                </Link>
                <p className="text-[10px] text-mutedText mt-0.5">Performance boosted by 40% across Chrome builds.</p>
              </div>
              <hr className="border-white/5" />
              <div>
                <Link href="#" className="text-xs font-extrabold text-gray-300 hover:text-primary transition-colors">
                  Summer Game Jam 2026
                </Link>
                <p className="text-[10px] text-mutedText mt-0.5">Submit your entry by August 15th to win $5,000.</p>
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* Store sections */}
        <div className="lg:col-span-3 flex flex-col gap-10">
          
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sortedGames.length === 0 ? (
            <GlassPanel className="text-center py-16">
              <p className="text-mutedText font-semibold">No games match your search filters.</p>
            </GlassPanel>
          ) : (
            <>
              {/* Hot Picks */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="w-5 h-5 text-secondary text-glow-pink" />
                  <h2 className="font-extrabold text-lg uppercase tracking-wider text-white">Popular Plays</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {popularList.map(game => (
                    <GameCard key={game.id} game={game} />
                  ))}
                </div>
              </div>

              {/* New Releases */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-primary text-glow-blue" />
                  <h2 className="font-extrabold text-lg uppercase tracking-wider text-white">New Releases</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {featuredList.map(game => (
                    <GameCard key={game.id} game={game} />
                  ))}
                </div>
              </div>

              {/* Top Rated */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <h2 className="font-extrabold text-lg uppercase tracking-wider text-white">Top Rated</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {topWeekly.map(game => (
                    <GameCard key={game.id} game={game} />
                  ))}
                </div>
              </div>
            </>
          )}

        </div>

      </div>

      {/* FAQ block */}
      <div id="faq" className="mt-10 border-t border-white/5 pt-10">
        <h2 className="text-2xl font-black text-white text-center mb-8 text-glow-blue">FAQ & PLATFORM DETAILS</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <GlassPanel>
            <h4 className="font-bold text-sm text-primary mb-2">How do I play games?</h4>
            <p className="text-xs text-mutedText leading-relaxed">
              No installs or downloads are required! Simply select any game and click "Play Now" to launch it instantly in our highly-optimized browser canvas container.
            </p>
          </GlassPanel>

          <GlassPanel>
            <h4 className="font-bold text-sm text-primary mb-2">Are WebGL builds secure?</h4>
            <p className="text-xs text-mutedText leading-relaxed">
              Absolutely. All uploaded HTML5/WebGL game archives are sandboxed using browser-level iframe policies and validated for security anomalies before moderation approval.
            </p>
          </GlassPanel>

          <GlassPanel>
            <h4 className="font-bold text-sm text-primary mb-2">Can I publish my own games?</h4>
            <p className="text-xs text-mutedText leading-relaxed">
              Yes! Register as a DEVELOPER, navigate to the Dev Hub dashboard, and upload your zip build containing your index.html. Once approved by our team, it goes live immediately.
            </p>
          </GlassPanel>

          <GlassPanel>
            <h4 className="font-bold text-sm text-primary mb-2">What is the Level/XP system?</h4>
            <p className="text-xs text-mutedText leading-relaxed">
              You earn XP by playing games, submitting constructive feedback, locking likes, and unlocking game achievements. Leveling up grants points which can be redeemed in the future.
            </p>
          </GlassPanel>
        </div>
      </div>

    </div>
  );
}

// Fallback Mock Games data
function getFallbackGames(): Game[] {
  return [];
}
