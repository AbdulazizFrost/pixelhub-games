"use client";

import React from 'react';
import Sidebar from '@/components/Sidebar';
import GlassPanel from '@/components/GlassPanel';
import { Newspaper } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';

export default function NewsPage() {
  const { t } = useLocale();

  const newsItems = [
    {
      title: "Platform Update 2.0: Performance Boosted",
      titleRu: "Обновление платформы 2.0: Производительность увеличена",
      date: "July 7, 2026",
      dateRu: "7 июля 2026 г.",
      desc: "Performance boosted by 40% natively across all browser rendering engines. WebGL compilation optimization is now active.",
      descRu: "Производительность увеличена на 40% во всех браузерных движках. Добавлена оптимизация компиляции шейдеров WebGL.",
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80"
    },
    {
      title: "Shader Compilation Fix for Unity Builds",
      titleRu: "Исправление компиляции шейдеров для сборок Unity",
      date: "July 6, 2026",
      dateRu: "6 июля 2026 г.",
      desc: "Fixed custom content header compression mappings for Build.wasm.gz files. Startup load times will now be extremely fast.",
      descRu: "Исправлены сжатые типы заголовков для файлов Build.wasm.gz. Время загрузки игр теперь станет сверхбыстрым.",
      image: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=800&q=80"
    },
    {
      title: "PixelHub Creator Hub Dashboard Launch",
      titleRu: "Запуск личного кабинета разработчика PixelHub",
      date: "July 5, 2026",
      dateRu: "5 июля 2026 г.",
      desc: "Developers can now track active subscriber counts, upload custom zip builds, update categories, and check achievements.",
      descRu: "Разработчики теперь могут отслеживать число подписчиков, загружать zip-сборки игр и настраивать достижения.",
      image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80"
    }
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 select-none">
      <Sidebar />
      <div className="xl:col-span-4 flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2.5">
            <Newspaper className="w-6 h-6 text-primary text-glow-blue" />
            {t('news')}
          </h1>
          <p className="text-xs text-mutedText mt-1.5">Последние обновления, патч-ноуты и новости платформы.</p>
        </div>

        <div className="flex flex-col gap-6">
          {newsItems.map((item, idx) => (
            <GlassPanel key={idx} className="p-6 flex flex-col md:flex-row gap-6 border border-white/5 hover:border-primary/20 transition-all duration-300">
              <img src={item.image} alt="news art" className="w-full md:w-56 h-36 object-cover rounded-xl bg-black/40 border border-white/5" />
              <div className="flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-wider">{t('logo') === 'PixelHub' ? item.date : item.dateRu}</span>
                  <h3 className="text-lg font-extrabold text-white mt-1">{t('logo') === 'PixelHub' ? item.title : item.titleRu}</h3>
                  <p className="text-xs text-mutedText mt-2 leading-relaxed">{t('logo') === 'PixelHub' ? item.desc : item.descRu}</p>
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>
      </div>
    </div>
  );
}
