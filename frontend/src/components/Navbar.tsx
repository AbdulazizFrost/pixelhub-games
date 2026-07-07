"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { Gamepad2, LogOut, User, LayoutDashboard, Shield, ChevronDown, Menu, X, PlusCircle, Globe, Bell, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLocale();
  
  // Menu dropdowns states
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Notifications and messages dropdown states
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [unreadMessages, setUnreadMessages] = useState(2);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
    setNotificationsOpen(false);
    setMessagesOpen(false);
  };

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    setDropdownOpen(false);
    setMessagesOpen(false);
    if (!notificationsOpen) {
      setUnreadNotifications(0);
    }
  };

  const toggleMessages = () => {
    setMessagesOpen(!messagesOpen);
    setDropdownOpen(false);
    setNotificationsOpen(false);
    if (!messagesOpen) {
      setUnreadMessages(0);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0a0f19] px-4 md:px-8 py-3.5 select-none">
      <div className="container mx-auto flex items-center justify-between">
        
        {/* Left: Logo & Nav Links */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-gradient-to-r from-primary to-accent shadow-neonBlue transition-all duration-300 group-hover:scale-105">
              <Gamepad2 className="w-5 h-5 text-black" />
            </div>
            <span className="font-black tracking-widest text-lg text-white uppercase font-sans">
              PixelHub
            </span>
          </Link>

          {/* Desktop Main Links */}
          <div className="hidden lg:flex items-center gap-6 text-xs uppercase font-extrabold tracking-wider text-gray-400">
            <Link href="/" className="text-white border-b-2 border-primary pb-1 transition-all">
              {t('discover')}
            </Link>
            <Link href="/#categories" className="hover:text-white transition-colors">
              {t('browse')}
            </Link>
            <Link href="/#categories" className="hover:text-white transition-colors">
              {t('categories')}
            </Link>
            {(user?.role === 'DEVELOPER' || user?.role === 'ADMIN') && (
              <Link href="/dashboard" className="hover:text-white transition-colors">
                {t('developerHub')}
              </Link>
            )}
            <Link href="/" className="hover:text-white transition-colors">
              {t('news')}
            </Link>
            <Link href="/" className="hover:text-white transition-colors">
              {t('community')}
            </Link>
          </div>
        </div>

        {/* Right: Controls & Profile */}
        <div className="hidden md:flex items-center gap-5">
          
          {/* Language Switcher */}
          <div className="flex items-center bg-black/40 border border-white/5 rounded-xl p-0.5 gap-0.5">
            <button 
              onClick={() => setLang('ru')}
              className={`px-2 py-1 rounded-lg text-[9px] font-black transition-all ${lang === 'ru' ? 'bg-primary text-black shadow-neonBlue' : 'text-gray-400 hover:text-white'}`}
            >
              RU
            </button>
            <button 
              onClick={() => setLang('en')}
              className={`px-2 py-1 rounded-lg text-[9px] font-black transition-all ${lang === 'en' ? 'bg-primary text-black shadow-neonBlue' : 'text-gray-400 hover:text-white'}`}
            >
              EN
            </button>
          </div>

          {/* Notification & Message Icons with dropdowns */}
          {user && (
            <div className="flex items-center gap-3.5 text-gray-400">
              
              {/* Notification icon */}
              <div className="relative">
                <button 
                  onClick={toggleNotifications}
                  className={`hover:text-white transition-colors relative p-1.5 rounded-lg ${notificationsOpen ? 'text-white bg-white/5' : 'text-gray-400'}`} 
                  title="Notifications"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full animate-pulse" />
                  )}
                </button>

                <AnimatePresence>
                  {notificationsOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setNotificationsOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-3 w-80 rounded-xl border border-white/5 bg-[#0b101c] p-4 shadow-2xl z-20 backdrop-blur-lg flex flex-col gap-3"
                      >
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-white">
                            {t('notifications')}
                          </span>
                          <button 
                            onClick={() => setUnreadNotifications(0)}
                            className="text-[9px] font-bold text-primary hover:underline"
                          >
                            {t('clearAll')}
                          </button>
                        </div>

                        <div className="flex flex-col gap-3 max-h-60 overflow-y-auto">
                          {/* Item 1 */}
                          <div className="flex items-start gap-2.5 text-[10px] leading-relaxed p-1.5 rounded-lg hover:bg-white/2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                            <div>
                              <span className="font-bold text-gray-200 block">
                                {lang === 'ru' ? 'Повышение уровня!' : 'Level Up!'}
                              </span>
                              <span className="text-mutedText">
                                {lang === 'ru' ? 'Вы достигли 2 уровня (+50 XP)' : 'You reached Level 2 (+50 XP)'}
                              </span>
                              <span className="text-[8px] text-mutedText/80 block mt-0.5">2h ago</span>
                            </div>
                          </div>

                          {/* Item 2 */}
                          <div className="flex items-start gap-2.5 text-[10px] leading-relaxed p-1.5 rounded-lg hover:bg-white/2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                            <div>
                              <span className="font-bold text-gray-200 block">
                                {lang === 'ru' ? 'Одобрена новая игра' : 'New Game Approved'}
                              </span>
                              <span className="text-mutedText">
                                {lang === 'ru' ? 'Сборка Canvas Dodger проверена и опубликована.' : 'Canvas Dodger build was verified and published.'}
                              </span>
                              <span className="text-[8px] text-mutedText/80 block mt-0.5">5h ago</span>
                            </div>
                          </div>

                          {/* Item 3 */}
                          <div className="flex items-start gap-2.5 text-[10px] leading-relaxed p-1.5 rounded-lg hover:bg-white/2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                            <div>
                              <span className="font-bold text-gray-200 block">
                                {lang === 'ru' ? 'Верификация аккаунта' : 'Account Verified'}
                              </span>
                              <span className="text-mutedText">
                                {lang === 'ru' ? 'Роль разработчика успешно активирована.' : 'Developer publishing role is now active.'}
                              </span>
                              <span className="text-[8px] text-mutedText/80 block mt-0.5">1d ago</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Messages icon */}
              <div className="relative">
                <button 
                  onClick={toggleMessages}
                  className={`hover:text-white transition-colors relative p-1.5 rounded-lg ${messagesOpen ? 'text-white bg-white/5' : 'text-gray-400'}`} 
                  title="Messages"
                >
                  <Mail className="w-4.5 h-4.5" />
                  {unreadMessages > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
                  )}
                </button>

                <AnimatePresence>
                  {messagesOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMessagesOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-3 w-80 rounded-xl border border-white/5 bg-[#0b101c] p-4 shadow-2xl z-20 backdrop-blur-lg flex flex-col gap-3"
                      >
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-white">
                            {t('messages')}
                          </span>
                        </div>

                        <div className="flex flex-col gap-3 max-h-60 overflow-y-auto">
                          {/* Message 1 */}
                          <div className="flex items-start gap-3 p-1.5 rounded-lg hover:bg-white/2">
                            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=PixelMaster" alt="avatar" className="w-8 h-8 rounded-lg bg-black/40" />
                            <div className="min-w-0 flex-grow">
                              <span className="text-xs font-bold text-gray-200 block truncate">PixelMaster</span>
                              <p className="text-[10px] text-mutedText truncate mt-0.5">
                                {lang === 'ru' ? 'Привет, я загрузил новую сборку. Напиши, если найдешь баги!' : 'Hi, I just uploaded the latest build. Let me know if you run into any bugs!'}
                              </p>
                              <span className="text-[8px] text-mutedText/80 block mt-0.5">3h ago</span>
                            </div>
                          </div>

                          {/* Message 2 */}
                          <div className="flex items-start gap-3 p-1.5 rounded-lg hover:bg-white/2">
                            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=GamerOne" alt="avatar" className="w-8 h-8 rounded-lg bg-black/40" />
                            <div className="min-w-0 flex-grow">
                              <span className="text-xs font-bold text-gray-200 block truncate">GamerOne</span>
                              <p className="text-[10px] text-mutedText truncate mt-0.5">
                                {lang === 'ru' ? 'Будешь участвовать в турнире по CSS Dodger сегодня вечером?' : 'Are you playing in the CSS Dodger tournament tonight?'}
                              </p>
                              <span className="text-[8px] text-mutedText/80 block mt-0.5">6h ago</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

            </div>
          )}

          {user ? (
            <div className="flex items-center gap-3.5 pl-2 border-l border-white/10">
              
              {/* Profile Card */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-gray-200">{user.username}</span>
                  <span className="text-[10px] text-mutedText">Level {user.level}</span>
                </div>
                
                {/* User Dropdown */}
                <div className="relative">
                  <button 
                    onClick={toggleDropdown}
                    className="flex items-center gap-1 p-0.5 rounded-xl border border-white/10 hover:border-primary/40 transition-all bg-surface"
                  >
                    <img 
                      src={user.profile?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`} 
                      alt="avatar" 
                      className="w-7 h-7 rounded-lg bg-black/40"
                    />
                    <ChevronDown className="w-3.5 h-3.5 text-mutedText" />
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 mt-2.5 w-48 rounded-xl border border-white/5 bg-[#0b101c] p-2 shadow-2xl z-20 backdrop-blur-lg"
                        >
                          <Link 
                            href={`/profile/${user.username}`}
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 w-full p-2.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-primary hover:bg-white/5 transition-all"
                          >
                            <User className="w-4 h-4" />
                            {t('myProfile')}
                          </Link>
                          
                          {(user.role === 'DEVELOPER' || user.role === 'ADMIN') && (
                            <Link 
                              href="/dashboard"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-2.5 w-full p-2.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-primary hover:bg-white/5 transition-all"
                            >
                              <PlusCircle className="w-4 h-4" />
                              {t('publishBuild')}
                            </Link>
                          )}

                          {user.role === 'ADMIN' && (
                            <Link 
                              href="/admin"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-2.5 w-full p-2.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-secondary hover:bg-white/5 transition-all"
                            >
                              <Shield className="w-4 h-4" />
                              {t('adminPanel')}
                            </Link>
                          )}

                          <hr className="border-white/5 my-1" />

                          <button 
                            onClick={() => { setDropdownOpen(false); logout(); }}
                            className="flex items-center gap-2.5 w-full p-2.5 rounded-lg text-xs font-semibold text-secondary hover:bg-secondary/10 transition-all text-left"
                          >
                            <LogOut className="w-4 h-4" />
                            {t('signOut')}
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link 
                href="/login" 
                className="text-xs font-bold text-gray-300 hover:text-primary transition-colors px-4 py-2"
              >
                {t('logIn')}
              </Link>
              <Link 
                href="/register" 
                className="text-xs font-bold text-black bg-gradient-to-r from-primary to-accent rounded-lg px-4 py-2 shadow-neonBlue hover:brightness-110 hover:scale-[1.02] transition-all"
              >
                {t('signUp')}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button 
          className="flex lg:hidden text-gray-300"
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
            className="lg:hidden w-full border-t border-white/5 bg-[#0a0f19] flex flex-col gap-4 py-4 px-2 mt-2"
          >
            {/* Language Switcher in Mobile Drawer */}
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold text-mutedText flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Language
              </span>
              <div className="flex items-center bg-black/40 border border-white/5 rounded-xl p-0.5 gap-0.5">
                <button 
                  onClick={() => setLang('ru')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${lang === 'ru' ? 'bg-primary text-black shadow-neonBlue' : 'text-gray-400'}`}
                >
                  RU
                </button>
                <button 
                  onClick={() => setLang('en')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${lang === 'en' ? 'bg-primary text-black shadow-neonBlue' : 'text-gray-400'}`}
                >
                  EN
                </button>
              </div>
            </div>

            <hr className="border-white/5 my-0.5" />

            <Link 
              href="/" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm py-1.5 text-gray-300 hover:text-primary transition-colors"
            >
              {t('discover')}
            </Link>
            <Link 
              href="/#categories" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm py-1.5 text-gray-300 hover:text-primary transition-colors"
            >
              {t('categories')}
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
                    <span className="text-xs text-primary">{t('level')} {user.level}</span>
                  </div>
                </div>

                <Link 
                  href={`/profile/${user.username}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm py-1 text-gray-300 hover:text-primary"
                >
                  {t('myProfile')}
                </Link>

                {(user.role === 'DEVELOPER' || user.role === 'ADMIN') && (
                  <Link 
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm py-1 text-gray-300 hover:text-primary"
                  >
                    {t('developerHub')}
                  </Link>
                )}

                {user.role === 'ADMIN' && (
                  <Link 
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm py-1 text-gray-300 hover:text-secondary"
                  >
                    {t('adminPanel')}
                  </Link>
                )}

                <button 
                  onClick={() => { setMobileMenuOpen(false); logout(); }}
                  className="flex items-center gap-2 text-sm py-2 text-secondary font-bold text-left"
                >
                  <LogOut className="w-4 h-4" />
                  {t('signOut')}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 border-t border-white/5 pt-3">
                <Link 
                  href="/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-sm font-bold text-gray-300 rounded-lg hover:bg-white/5 transition-all"
                >
                  {t('logIn')}
                </Link>
                <Link 
                  href="/register" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-sm font-bold text-black bg-gradient-to-r from-primary to-accent rounded-lg shadow-neonBlue hover:brightness-110"
                >
                  {t('signUp')}
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
