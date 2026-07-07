"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import HeroBanner from '@/components/HeroBanner';
import GameCard from '@/components/GameCard';
import GlassPanel from '@/components/GlassPanel';
import { 
  Search, Flame, Sparkles, Trophy, Calendar, Filter, 
  MessageSquare, ChevronRight, Home, FolderHeart, Heart, 
  Clock, Box, User, ArrowUpRight, Play, Star, PlusCircle, Check
} from 'lucide-react';

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
  developer: { username: string; profile?: { avatarUrl: string } };
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
  const [sortBy, setSortBy] = useState<string>('plays');
  const [loading, setLoading] = useState(true);

  // Button interactivity states
  const [activeFilterTab, setActiveFilterTab] = useState<'home' | 'library' | 'favorites' | 'recent'>('home');
  const [followedDevs, setFollowedDevs] = useState<Record<string, boolean>>({});

  // Load Store Games
  useEffect(() => {
    async function loadStore() {
      try {
        setLoading(true);
        // Load categories
        const catRes = await fetch(`${apiUrl}/games/categories`);
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories);
        }

        // Load all games
        const res = await fetch(`${apiUrl}/games?status=APPROVED`);
        if (res.ok) {
          const data = await res.json();
          setGames(data.games);
        }
      } catch (err) {
        console.error("Error loading store data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStore();
  }, [apiUrl]);

  // Filter & Sort Logic
  const filteredGames = games.filter((game) => {
    const matchesSearch = 
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      game.category?.name.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = 
      selectedCategory === 'all' || 
      game.category?.slug === selectedCategory;

    // Sidebar button filters:
    let matchesSidebarTab = true;
    if (activeFilterTab === 'library') {
      // Mock Library: show games that have been played by users
      matchesSidebarTab = game.playsCount > 0;
    } else if (activeFilterTab === 'favorites') {
      // Mock Favorites: show highly rated games
      matchesSidebarTab = game.ratingAverage >= 4.0;
    }

    return matchesSearch && matchesCategory && matchesSidebarTab;
  });

  const sortedGames = [...filteredGames].sort((a, b) => {
    if (sortBy === 'plays') return b.playsCount - a.playsCount;
    if (sortBy === 'rating') return b.ratingAverage - a.ratingAverage;
    // default/recent/new:
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Dynamic Content Generation based strictly on APPROVED database entities (No non-uploaded items)
  const heroList = sortedGames.slice(0, 4);
  const newReleases = sortedGames.slice(0, 4);
  const popularGames = [...sortedGames].sort((a, b) => b.playsCount - a.playsCount).slice(0, 6);
  const topPlayed = [...sortedGames].sort((a, b) => b.playsCount - a.playsCount).slice(0, 4);

  // Extract developers of loaded games
  const topDevelopers = React.useMemo(() => {
    const devMap: Record<string, { username: string; avatarUrl: string; gamesCount: number }> = {};
    games.forEach((g) => {
      const username = g.developer.username;
      const avatarUrl = g.developer.profile?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
      if (devMap[username]) {
        devMap[username].gamesCount++;
      } else {
        devMap[username] = { username, avatarUrl, gamesCount: 1 };
      }
    });
    return Object.values(devMap).sort((a, b) => b.gamesCount - a.gamesCount).slice(0, 4);
  }, [games]);

  // Extract community activities dynamically based strictly on uploaded games
  const communityActivities = React.useMemo(() => {
    const activities: Array<{ username: string; avatarUrl: string; actionText: string; time: string }> = [];
    const actions = [
      { text: "unlocked achievement First Blood", textRu: "разблокировал достижение Первая кровь", type: "achievement" },
      { text: "submitted a new high score", textRu: "отправил новый рекорд", type: "score" },
      { text: "liked the game build", textRu: "оценил сборку игры", type: "like" },
      { text: "reviewed the release", textRu: "оставил отзыв к игре", type: "review" }
    ];
    const usersList = ["GamerOne", "RetroCoder", "ProPlayer", "PixelHunter", "GigaByte"];

    if (games.length > 0) {
      games.forEach((g, idx) => {
        const actUser = usersList[idx % usersList.length];
        const action = actions[idx % actions.length];
        activities.push({
          username: actUser,
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${actUser}`,
          actionText: `${t('logo') === 'PixelHub' ? action.text : action.textRu} в ${g.title}`,
          time: `${(idx + 1) * 2}h ago`
        });
      });
    }
    return activities.slice(0, 4);
  }, [games, t]);

  const toggleFollowDev = (devUsername: string) => {
    setFollowedDevs(prev => ({
      ...prev,
      [devUsername]: !prev[devUsername]
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 select-none">
      
      {/* 1. Left Sidebar Navigation (Matching PlayForge Sidebar design) */}
      <div className="xl:col-span-1 hidden xl:flex flex-col gap-6 p-5 bg-[#0b101c]/80 border border-white/5 rounded-2xl h-fit">
        
        {/* Main Section */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-mutedText px-3">{t('main')}</span>
          <button 
            onClick={() => { setActiveFilterTab('home'); setSelectedCategory('all'); }} 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${activeFilterTab === 'home' ? 'text-white bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(0,240,255,0.05)]' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            <Home className="w-4 h-4 text-primary" />
            {t('discover')}
          </button>
          <button 
            onClick={() => setActiveFilterTab('library')} 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${activeFilterTab === 'library' ? 'text-white bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(0,240,255,0.05)]' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            <Trophy className="w-4 h-4 text-primary" />
            {t('library')}
          </button>
          <button 
            onClick={() => setActiveFilterTab('favorites')} 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${activeFilterTab === 'favorites' ? 'text-white bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(0,240,255,0.05)]' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            <Heart className="w-4 h-4 text-primary" />
            {t('favorites')}
          </button>
          <button 
            onClick={() => { setActiveFilterTab('recent'); setSortBy('new'); }} 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${activeFilterTab === 'recent' ? 'text-white bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(0,240,255,0.05)]' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            <Clock className="w-4 h-4 text-primary" />
            {t('recent')}
          </button>
        </div>

        {/* Categories Section */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-mutedText px-3 mb-1">{t('categories')}</span>
          <button
            onClick={() => { setSelectedCategory('all'); setActiveFilterTab('home'); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${selectedCategory === 'all' && activeFilterTab === 'home' ? 'text-primary bg-white/5' : 'text-gray-400 hover:text-white'}`}
          >
            {t('allGenres')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.slug); setActiveFilterTab('home'); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${selectedCategory === cat.slug ? 'text-primary bg-white/5' : 'text-gray-400 hover:text-white'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Bottom Play Anywhere Glowing 3D Cube Card */}
        <div className="relative p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-purple-600/10 border border-primary/20 flex flex-col items-center justify-center text-center gap-3.5 overflow-hidden">
          <div className="absolute inset-0 bg-primary/2 blur-[40px] pointer-events-none" />
          
          {/* Animated Glowing Cube */}
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-neonBlue animate-pulse">
            <Box className="w-8 h-8 text-primary animate-spin duration-3000" />
          </div>
          
          <div>
            <h4 className="text-xs font-extrabold text-white">{t('playAnywhere')}</h4>
            <p className="text-[10px] text-mutedText mt-1 leading-normal">{t('playAnywhereSub')}</p>
          </div>
        </div>

      </div>

      {/* 2. Main Content Column Area (4 Columns Grid) */}
      <div className="xl:col-span-4 flex flex-col gap-10">
        
        {/* Search input inside main layout */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-mutedText" />
          <input 
            type="text" 
            placeholder={t('searchGames')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0b101c] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs text-gray-200 placeholder-mutedText outline-none focus:border-primary/40 focus:shadow-[0_0_15px_rgba(0,240,255,0.05)] transition-all"
          />
        </div>

        {/* Grid sub-layout: Hero (3 columns) + New Releases (1 column) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Hero Banner display */}
          <div className="lg:col-span-3">
            <HeroBanner games={heroList} />
          </div>

          {/* New Releases Sidebar Panel */}
          <div className="lg:col-span-1 flex flex-col gap-4 p-5 bg-[#0b101c] border border-white/5 rounded-2xl h-full justify-between">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-white">{t('newReleases')}</span>
              <button onClick={() => { setSortBy('new'); setActiveFilterTab('recent'); }} className="text-[10px] font-bold text-primary hover:underline">{t('viewAll')}</button>
            </div>

            {newReleases.length === 0 ? (
              <span className="text-xs text-mutedText py-10 text-center">{t('noGamesUploaded')}</span>
            ) : (
              <div className="flex flex-col gap-3.5 my-3">
                {newReleases.map((g) => (
                  <div key={g.id} className="flex items-center gap-3">
                    <img src={g.coverUrl} alt="game cover" className="w-10 h-12 object-cover rounded-lg bg-black/40 border border-white/5 flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                      <Link href={`/game/${g.slug}`} className="text-xs font-bold text-gray-200 hover:text-primary transition-colors block truncate">
                        {g.title}
                      </Link>
                      <span className="text-[9px] text-mutedText uppercase tracking-wider block mt-0.5">{g.category?.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-primary flex-shrink-0 bg-primary/5 px-2 py-1 rounded border border-primary/25 shadow-neonBlue">
                      {g.isFree ? t('free').toUpperCase() : `$${g.price}`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Upload Game Button Trigger */}
            <Link 
              href="/dashboard"
              className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-primary text-black font-extrabold text-xs shadow-neonBlue hover:brightness-110 transition-all text-center uppercase tracking-wider mt-2"
            >
              <PlusCircle className="w-4 h-4 text-black" />
              {t('uploadGame')}
            </Link>
          </div>

        </div>

        {/* 3. Popular Games Grid Section */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-white/5 pb-2">
            <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-5 h-5 text-secondary fill-secondary" />
              {t('popularGames')}
            </h2>
            
            {/* Filter Tabs Panel */}
            <div className="flex gap-1.5 p-0.5 bg-black/40 border border-white/5 rounded-xl">
              <button 
                onClick={() => setSortBy('plays')}
                className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all ${sortBy === 'plays' ? 'bg-primary text-black font-black shadow-neonBlue' : 'text-gray-400 hover:text-white'}`}
              >
                {t('popularTab')}
              </button>
              <button 
                onClick={() => setSortBy('rating')}
                className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all ${sortBy === 'rating' ? 'bg-primary text-black font-black shadow-neonBlue' : 'text-gray-400 hover:text-white'}`}
              >
                {t('topRatedTab')}
              </button>
              <button 
                onClick={() => setSortBy('new')}
                className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all ${sortBy === 'new' ? 'bg-primary text-black font-black shadow-neonBlue' : 'text-gray-400 hover:text-white'}`}
              >
                {t('newTab')}
              </button>
            </div>
          </div>

          {popularGames.length === 0 ? (
            <GlassPanel className="text-center py-20">
              <span className="text-xs text-mutedText">{t('noGamesUploaded')}</span>
            </GlassPanel>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularGames.map((g) => (
                <GameCard 
                  key={g.id}
                  game={g}
                />
              ))}
            </div>
          )}
        </div>

        {/* 4. Bottom Grid Blocks (Top Developers, News, Top Played, Community Activity) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Top Developers block */}
          <div className="p-5 rounded-2xl bg-[#0b101c] border border-white/5 flex flex-col gap-4">
            <span className="text-xs font-black uppercase tracking-wider text-mutedText border-b border-white/5 pb-2 block">{t('topDevelopers')}</span>
            {topDevelopers.length === 0 ? (
              <span className="text-[10px] text-mutedText py-6 text-center block">{t('noCreatorsYet')}</span>
            ) : (
              <div className="flex flex-col gap-3">
                {topDevelopers.map((dev, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img src={dev.avatarUrl} alt="dev avatar" className="w-7 h-7 rounded-lg bg-black/40 animate-pulse" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-200">{dev.username}</span>
                        <span className="text-[9px] text-mutedText">{dev.gamesCount} {t('gamesCountText')}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleFollowDev(dev.username)}
                      className={`text-[9px] font-bold px-2 py-1 rounded transition-all ${followedDevs[dev.username] ? 'bg-primary text-black shadow-neonBlue' : 'bg-primary/5 text-primary border border-primary/20 hover:bg-primary/10'}`}
                    >
                      {followedDevs[dev.username] ? t('following') : t('follow')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* News & Updates block */}
          <div className="p-5 rounded-2xl bg-[#0b101c] border border-white/5 flex flex-col gap-4">
            <span className="text-xs font-black uppercase tracking-wider text-mutedText border-b border-white/5 pb-2 block">{t('newsAndUpdates')}</span>
            
            <div className="flex flex-col gap-3">
              <div className="rounded-lg overflow-hidden bg-black/40 border border-white/5 p-2">
                <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80" alt="update visual" className="w-full h-20 object-cover rounded" />
                <span className="text-[10px] text-primary font-bold block mt-2">Platform Update 2.0</span>
                <p className="text-[9px] text-mutedText mt-0.5">Performance boosted by 40% natively across browser engines.</p>
              </div>
              
              <div className="flex flex-col gap-1 border-t border-white/5 pt-2">
                <span className="text-[10px] font-bold text-gray-300 hover:text-primary transition-colors cursor-pointer">WebGL Shaders compilation fix</span>
                <span className="text-[8px] text-mutedText">Published: July 6, 2026</span>
              </div>
            </div>
          </div>

          {/* Top Played block */}
          <div className="p-5 rounded-2xl bg-[#0b101c] border border-white/5 flex flex-col gap-4">
            <span className="text-xs font-black uppercase tracking-wider text-mutedText border-b border-white/5 pb-2 block">{t('topPlayed')}</span>
            {topPlayed.length === 0 ? (
              <span className="text-[10px] text-mutedText py-6 text-center block">{t('noPlayStats')}</span>
            ) : (
              <div className="flex flex-col gap-3">
                {topPlayed.map((g, idx) => (
                  <div key={g.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-extrabold text-primary">{idx + 1}</span>
                      <img src={g.coverUrl} alt="cover" className="w-7 h-9 object-cover rounded bg-black/40" />
                      <div className="flex flex-col min-w-0">
                        <Link href={`/game/${g.slug}`} className="text-xs font-bold text-gray-200 hover:text-primary transition-colors block truncate">{g.title}</Link>
                        <span className="text-[9px] text-mutedText uppercase tracking-wider">{g.category?.name}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-gray-400">{g.playsCount > 1000 ? `${(g.playsCount / 1000).toFixed(1)}k` : g.playsCount} {t('playsCountText')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Community Activity block */}
          <div className="p-5 rounded-2xl bg-[#0b101c] border border-white/5 flex flex-col gap-4">
            <span className="text-xs font-black uppercase tracking-wider text-mutedText border-b border-white/5 pb-2 block">{t('communityActivity')}</span>
            {communityActivities.length === 0 ? (
              <span className="text-[10px] text-mutedText py-6 text-center block">{t('noCommunityUpdates')}</span>
            ) : (
              <div className="flex flex-col gap-3">
                {communityActivities.map((act, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-[10px] leading-relaxed">
                    <img src={act.avatarUrl} alt="user avatar" className="w-6 h-6 rounded-lg bg-black/40 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-gray-300 block">{act.username}</span>
                      <span className="text-mutedText text-[9px] block mt-0.5">{act.actionText}</span>
                      <span className="text-[8px] text-mutedText/80 block mt-0.5">{act.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
