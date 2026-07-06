"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Gamepad2, LogOut, User, LayoutDashboard, Shield, ChevronDown, Menu, X, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#080b10]/80 backdrop-blur-md px-4 md:px-8 py-3">
      <div className="container mx-auto flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-accent shadow-neonBlue transition-all duration-300 group-hover:scale-105">
            <Gamepad2 className="w-6 h-6 text-black" />
          </div>
          <span className="font-extrabold tracking-widest text-lg text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-secondary text-glow-blue">
            PixelHub
          </span>
        </Link>

        {/* Desktop Main Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-semibold text-gray-300 hover:text-primary transition-colors">
            Store
          </Link>
          <Link href="/#categories" className="text-sm font-semibold text-gray-300 hover:text-primary transition-colors">
            Categories
          </Link>
          <Link href="/#faq" className="text-sm font-semibold text-gray-300 hover:text-primary transition-colors">
            FAQ
          </Link>
        </div>

        {/* Desktop Auth Controls */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              
              {/* User Levels System Display */}
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-mutedText">Level</span>
                  <span className="text-xs font-black text-primary border border-primary/40 rounded px-1.5 py-0.2 shadow-neonBlue bg-primary/5">
                    {user.level}
                  </span>
                </div>
                {/* Micro XP Progress Bar */}
                <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-accent" 
                    style={{ width: `${(user.xp % 500) / 5}%` }} 
                  />
                </div>
              </div>

              {/* Developer Actions */}
              {(user.role === 'DEVELOPER' || user.role === 'ADMIN') && (
                <Link 
                  href="/dashboard" 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-primary font-bold hover:bg-primary/20 transition-all hover:shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dev Hub
                </Link>
              )}

              {/* Admin Actions */}
              {user.role === 'ADMIN' && (
                <Link 
                  href="/admin" 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-secondary/20 bg-secondary/5 text-xs text-secondary font-bold hover:bg-secondary/20 transition-all hover:shadow-[0_0_15px_rgba(255,0,127,0.2)]"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </Link>
              )}

              {/* User Dropdown */}
              <div className="relative">
                <button 
                  onClick={toggleDropdown}
                  className="flex items-center gap-2 p-1.5 rounded-lg bg-surface-light border border-white/5 hover:border-primary/30 transition-all"
                >
                  <img 
                    src={user.profile?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`} 
                    alt="avatar" 
                    className="w-7 h-7 rounded-md bg-black/40"
                  />
                  <span className="text-xs font-semibold text-gray-200">{user.username}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-48 rounded-xl border border-white/5 bg-surface p-2 shadow-2xl z-20 backdrop-blur-lg"
                      >
                        <Link 
                          href={`/profile/${user.username}`}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 w-full p-2.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-primary hover:bg-white/5 transition-all"
                        >
                          <User className="w-4 h-4" />
                          My Profile
                        </Link>
                        
                        {(user.role === 'DEVELOPER' || user.role === 'ADMIN') && (
                          <Link 
                            href="/dashboard"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 w-full p-2.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-primary hover:bg-white/5 transition-all"
                          >
                            <PlusCircle className="w-4 h-4" />
                            Upload Game
                          </Link>
                        )}

                        <hr className="border-white/5 my-1" />

                        <button 
                          onClick={() => { setDropdownOpen(false); logout(); }}
                          className="flex items-center gap-2 w-full p-2.5 rounded-lg text-xs font-semibold text-secondary hover:bg-secondary/10 transition-all text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link 
                href="/login" 
                className="text-xs font-bold text-gray-300 hover:text-primary transition-colors px-4 py-2"
              >
                Log In
              </Link>
              <Link 
                href="/register" 
                className="text-xs font-bold text-black bg-gradient-to-r from-primary to-accent rounded-lg px-4 py-2 shadow-neonBlue hover:brightness-110 hover:scale-[1.02] transition-all"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button 
          className="flex md:hidden text-gray-300"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

      </div>

      {/* Mobile Drawer menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-3 border-t border-white/5 pt-3 flex flex-col gap-3"
          >
            <Link 
              href="/" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm py-1.5 text-gray-300 hover:text-primary transition-colors"
            >
              Store
            </Link>
            <Link 
              href="/#categories" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm py-1.5 text-gray-300 hover:text-primary transition-colors"
            >
              Categories
            </Link>
            
            {user ? (
              <div className="flex flex-col gap-3 border-t border-white/5 pt-3">
                <div className="flex items-center gap-3">
                  <img 
                    src={user.profile?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`} 
                    alt="avatar" 
                    className="w-8 h-8 rounded-md bg-black/40"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-200">{user.username}</span>
                    <span className="text-xs text-primary">Level {user.level}</span>
                  </div>
                </div>

                <Link 
                  href={`/profile/${user.username}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm py-1 text-gray-300 hover:text-primary"
                >
                  My Profile
                </Link>

                {(user.role === 'DEVELOPER' || user.role === 'ADMIN') && (
                  <Link 
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm py-1 text-gray-300 hover:text-primary"
                  >
                    Developer Hub
                  </Link>
                )}

                {user.role === 'ADMIN' && (
                  <Link 
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm py-1 text-gray-300 hover:text-secondary"
                  >
                    Admin Panel
                  </Link>
                )}

                <button 
                  onClick={() => { setMobileMenuOpen(false); logout(); }}
                  className="flex items-center gap-2 text-sm py-2 text-secondary font-bold text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 border-t border-white/5 pt-3">
                <Link 
                  href="/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-sm font-bold text-gray-300 rounded-lg hover:bg-white/5 transition-all"
                >
                  Log In
                </Link>
                <Link 
                  href="/register" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-sm font-bold text-black bg-gradient-to-r from-primary to-accent rounded-lg shadow-neonBlue hover:brightness-110"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
