"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import Sidebar from '@/components/Sidebar';
import GlassPanel from '@/components/GlassPanel';
import { LayoutGrid } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function CategoriesPage() {
  const { apiUrl } = useAuth();
  const { t } = useLocale();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/games/categories`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, [apiUrl]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 select-none">
      <Sidebar />
      <div className="xl:col-span-4 flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2.5">
            <LayoutGrid className="w-6 h-6 text-primary text-glow-blue" />
            {t('categories')}
          </h1>
          <p className="text-xs text-mutedText mt-1.5">Выберите категорию, чтобы увидеть доступные игры.</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <GlassPanel className="text-center py-24">
            <span className="text-sm text-mutedText block">Категории не найдены.</span>
          </GlassPanel>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/browse?category=${cat.slug}`}>
                <GlassPanel className="p-6 flex flex-col gap-3 border border-white/5 hover:border-primary/30 hover:scale-[1.02] cursor-pointer transition-all duration-300">
                  <div className="text-2xl">🎮</div>
                  <div>
                    <h3 className="text-base font-extrabold text-white group-hover:text-primary transition-colors">{cat.name}</h3>
                    <p className="text-[10px] text-mutedText mt-1 uppercase tracking-wider">Категория: {cat.slug}</p>
                  </div>
                </GlassPanel>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
