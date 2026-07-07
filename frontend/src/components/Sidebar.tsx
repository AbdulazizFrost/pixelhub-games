"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { Home, Trophy, Heart, Clock, Box } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function Sidebar() {
  const { apiUrl } = useAuth();
  const { t } = useLocale();
  const pathname = usePathname();
  
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch(`${apiUrl}/games/categories`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadCategories();
  }, [apiUrl]);

  return (
    <div className="xl:col-span-1 hidden xl:flex flex-col gap-6 p-5 bg-[#0b101c]/80 border border-white/5 rounded-2xl h-fit">
      
      {/* Main Section */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-mutedText px-3">{t('main')}</span>
        
        <Link 
          href="/" 
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left border ${pathname === '/' ? 'text-white bg-primary/10 border-primary/20 shadow-[0_0_15px_rgba(0,240,255,0.05)]' : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'}`}
        >
          <Home className="w-4 h-4 text-primary" />
          {t('discover')}
        </Link>
        
        <Link 
          href="/library" 
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left border ${pathname === '/library' ? 'text-white bg-primary/10 border-primary/20 shadow-[0_0_15px_rgba(0,240,255,0.05)]' : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'}`}
        >
          <Trophy className="w-4 h-4 text-primary" />
          {t('library')}
        </Link>
        
        <Link 
          href="/favorites" 
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left border ${pathname === '/favorites' ? 'text-white bg-primary/10 border-primary/20 shadow-[0_0_15px_rgba(0,240,255,0.05)]' : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'}`}
        >
          <Heart className="w-4 h-4 text-primary" />
          {t('favorites')}
        </Link>
        
        <Link 
          href="/recent" 
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left border ${pathname === '/recent' ? 'text-white bg-primary/10 border-primary/20 shadow-[0_0_15px_rgba(0,240,255,0.05)]' : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'}`}
        >
          <Clock className="w-4 h-4 text-primary" />
          {t('recent')}
        </Link>
      </div>

      {/* Categories Section */}
      <div id="categories" className="flex flex-col gap-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-mutedText px-3 mb-1">{t('categories')}</span>
        <Link
          href="/browse"
          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all block ${pathname === '/browse' ? 'text-primary bg-white/5' : 'text-gray-400 hover:text-white'}`}
        >
          {t('allGenres')}
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/browse?category=${cat.slug}`}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all block text-gray-400 hover:text-white"
          >
            {cat.name}
          </Link>
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
  );
}
