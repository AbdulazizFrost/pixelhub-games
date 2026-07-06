"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Star, Eye } from 'lucide-react';

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
  developer?: {
    username: string;
  };
}

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  const formattedPlays = game.playsCount >= 1000 
    ? `${(game.playsCount / 1000).toFixed(1)}k` 
    : game.playsCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="group relative flex flex-col w-full h-[320px] rounded-xl border border-white/5 bg-surface overflow-hidden hover:border-primary/40 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] transition-all duration-300"
    >
      {/* Game Cover Image */}
      <div className="relative w-full h-[180px] overflow-hidden bg-black/40">
        <img 
          src={game.coverUrl} 
          alt={game.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Play Now Quick Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 z-10">
          <Link 
            href={`/game/${game.slug}/play`}
            className="p-4 rounded-full bg-gradient-to-r from-primary to-accent text-black font-extrabold shadow-neonBlue transform scale-75 group-hover:scale-100 transition-all duration-300 hover:scale-110"
          >
            <Play className="w-6 h-6 fill-black" />
          </Link>
        </div>

        {/* Rating tag top right */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded bg-black/75 border border-white/5 backdrop-blur text-[10px] font-bold text-yellow-400">
          <Star className="w-3 h-3 fill-yellow-400" />
          {game.ratingAverage > 0 ? game.ratingAverage.toFixed(1) : "N/A"}
        </div>
      </div>

      {/* Game Details */}
      <div className="flex flex-col justify-between flex-grow p-4">
        
        <div>
          {/* Tags */}
          <div className="flex gap-1.5 mb-1.5 overflow-hidden">
            {game.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[9px] font-bold tracking-wider text-mutedText border border-white/5 px-1.5 py-0.2 rounded bg-white/5">
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <Link href={`/game/${game.slug}`}>
            <h3 className="font-bold text-sm text-gray-100 hover:text-primary transition-colors line-clamp-1">
              {game.title}
            </h3>
          </Link>

          {/* Developer */}
          <span className="text-[10px] text-mutedText">
            by {game.developer?.username || 'Unknown'}
          </span>
        </div>

        {/* Plays count and pricing */}
        <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-3">
          <div className="flex items-center gap-1 text-[11px] text-mutedText">
            <Eye className="w-3.5 h-3.5" />
            {formattedPlays} plays
          </div>

          <span className={`text-xs font-black ${game.isFree ? 'text-neonGreen text-glow-green' : 'text-secondary text-glow-pink'}`}>
            {game.isFree ? 'FREE' : `$${game.price.toFixed(2)}`}
          </span>
        </div>

      </div>
    </motion.div>
  );
}
