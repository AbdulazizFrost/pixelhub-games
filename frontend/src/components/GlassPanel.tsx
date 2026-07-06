"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  animate?: boolean;
  hoverGlow?: boolean;
  onClick?: () => void;
}

export default function GlassPanel({
  children,
  className = '',
  glow = false,
  animate = true,
  hoverGlow = false,
  onClick
}: GlassPanelProps) {
  const baseClass = glow 
    ? 'glass-panel-glow rounded-xl p-6 overflow-hidden' 
    : 'glass-panel rounded-xl p-6 overflow-hidden';
  
  const hoverClass = hoverGlow 
    ? 'transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)]'
    : '';

  const Component = animate ? motion.div : 'div';
  const animationProps = animate 
    ? {
        initial: { opacity: 0, y: 15 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4 }
      }
    : {};

  return (
    // @ts-ignore
    <Component
      className={`${baseClass} ${hoverClass} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      {...animationProps}
    >
      {children}
    </Component>
  );
}
