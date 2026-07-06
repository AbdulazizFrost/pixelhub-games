"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface FeaturedGame {
  title: string;
  slug: string;
  shortDescription: string;
  bannerUrl: string;
  tags: string[];
  isFree: boolean;
  price?: number;
}

const mockFeatured: FeaturedGame[] = [
  {
    title: "Neon Runner 2026",
    slug: "neon-runner",
    shortDescription: "Dash through futuristic cyber landscapes in this fast-paced neon infinite runner. Dodge gridwalls, jump across hover-ramps, and collect power-cores.",
    bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80",
    tags: ["Cyberpunk", "WebGL", "Runner", "Retrowave"],
    isFree: true
  },
  {
    title: "Quantum Maze",
    slug: "quantum-maze",
    shortDescription: "Manipulate dimensions and shift space to navigate complex architectural labyrinths. Inspired by classic optical illusions.",
    bannerUrl: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=1200&q=80",
    tags: ["Puzzle", "WebGL", "Minimalist", "3D"],
    isFree: true
  },
  {
    title: "Shadow Strike: Tactical Combat",
    slug: "shadow-strike",
    shortDescription: "Experience tactical first-person combat in this high-intensity multiplayer shooting simulator, running natively in browser.",
    bannerUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&q=80",
    tags: ["Shooter", "FPS", "Tactical", "Multiplayer"],
    isFree: false,
    price: 4.99
  }
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % mockFeatured.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % mockFeatured.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + mockFeatured.length) % mockFeatured.length);

  const game = mockFeatured[current];

  return (
    <div className="relative w-full h-[320px] md:h-[450px] rounded-2xl overflow-hidden border border-white/5 shadow-2xl bg-black">
      
      {/* Background Image Carousel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `linear-gradient(to top, #080b10 10%, rgba(8, 11, 16, 0.4) 60%, rgba(8, 11, 16, 0.8) 100%), url(${game.bannerUrl})` }}
        />
      </AnimatePresence>

      {/* Cyber Overlay Line */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary via-accent to-secondary" />

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 z-10">
        <div className="max-w-2xl">
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {game.tags.map((tag) => (
              <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20 px-2 py-0.5 rounded bg-primary/5">
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-3 text-glow-blue">
            {game.title}
          </h1>

          {/* Short Description */}
          <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-6 line-clamp-3">
            {game.shortDescription}
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <Link 
              href={`/game/${game.slug}/play`}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-black font-extrabold text-sm rounded-xl hover:scale-105 shadow-neonBlue hover:brightness-110 transition-all"
            >
              <Play className="w-4 h-4 fill-black" />
              PLAY NOW
            </Link>
            
            <Link 
              href={`/game/${game.slug}`}
              className="flex items-center gap-2 px-6 py-3 border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-sm rounded-xl hover:border-primary/30 hover:shadow-glass transition-all"
            >
              <Info className="w-4 h-4" />
              VIEW DETAILS
            </Link>

            <span className="text-lg font-black text-white ml-2">
              {game.isFree ? "FREE TO PLAY" : `$${game.price}`}
            </span>
          </div>

        </div>
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full border border-white/5 bg-black/40 hover:bg-primary/20 hover:text-primary transition-all z-20"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full border border-white/5 bg-black/40 hover:bg-primary/20 hover:text-primary transition-all z-20"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-4 right-12 flex gap-2 z-20">
        {mockFeatured.map((_, idx) => (
          <button 
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${idx === current ? 'bg-primary w-6 shadow-[0_0_10px_#00f0ff]' : 'bg-white/20'}`}
          />
        ))}
      </div>

    </div>
  );
}
