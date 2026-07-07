"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import GlassPanel from '@/components/GlassPanel';
import { Trophy, Calendar, Gamepad2, Eye, Award, Users, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface PlayHistory {
  id: string;
  playTimeSeconds: number;
  lastPlayedAt: string;
  game: { title: string; slug: string; coverUrl: string };
}

interface AchievementUnlock {
  id: string;
  unlockedAt: string;
  achievement: { name: string; description: string; iconUrl: string; game: { title: string } };
}

interface ProfileUser {
  id: string;
  username: string;
  role: 'USER' | 'DEVELOPER' | 'ADMIN';
  level: number;
  xp: number;
  points: number;
  createdAt: string;
  profile: {
    avatarUrl: string;
    bannerUrl: string;
    bio: string;
    favoriteGames: string[];
  };
  playHistory: PlayHistory[];
  achievements: AchievementUnlock[];
  subscribers: Array<{ id: string; user: { username: string; profile?: { avatarUrl: string } } }>;
  subscriptions: Array<{ id: string; developer: { username: string; profile?: { avatarUrl: string } } }>;
}

export default function ProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;
  const { apiUrl, user: currentUser, authFetch, refreshUser } = useAuth();
  const { t, lang } = useLocale();
  
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Edit Profile States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editBannerUrl, setEditBannerUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [updateError, setUpdateError] = useState('');

  // Sync edit states when profile loads
  useEffect(() => {
    if (profile) {
      setEditBio(profile.profile.bio || '');
      setEditAvatarUrl(profile.profile.avatarUrl || '');
      setEditBannerUrl(profile.profile.bannerUrl || '');
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setUpdateError('');
      
      const res = await authFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          bio: editBio,
          avatarUrl: editAvatarUrl,
          bannerUrl: editBannerUrl
        })
      });

      if (res.ok) {
        // Update page profile state
        setProfile(prev => prev ? {
          ...prev,
          profile: {
            ...prev.profile,
            bio: editBio,
            avatarUrl: editAvatarUrl,
            bannerUrl: editBannerUrl
          }
        } : null);
        
        // Refresh Auth Context user credentials for navigation
        await refreshUser();
        setEditModalOpen(false);
      } else {
        const errorData = await res.json();
        setUpdateError(errorData.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error(err);
      setUpdateError('Network error occurred');
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/auth/profile/${username}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
          
          if (currentUser && data.profile) {
            const hasSub = data.profile.subscribers?.some((s: any) => s.user.id === currentUser.id);
            setIsSubscribed(!!hasSub);
          }
        } else {
          setProfile(getFallbackProfile(username));
        }
      } catch (err) {
        console.error("Error loading profile from Express, loading static mock profile:", err);
        setProfile(getFallbackProfile(username));
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [username, apiUrl, currentUser]);

  const handleSubscribe = async () => {
    if (!currentUser) return;
    if (!profile) return;

    try {
      const res = await authFetch('/auth/subscribe', {
        method: 'POST',
        body: JSON.stringify({ developerId: profile.id })
      });
      if (res.ok) {
        const data = await res.json();
        setIsSubscribed(data.subscribed);
        setProfile(prev => prev ? {
          ...prev,
          subscribers: data.subscribed 
            ? [...prev.subscribers, { id: 'new', user: { username: currentUser.username, profile: { avatarUrl: currentUser.profile?.avatarUrl || '' } } }]
            : prev.subscribers.filter(s => s.user.username !== currentUser.username)
        } : null);
      }
    } catch (err) {
      console.error(err);
      setIsSubscribed(!isSubscribed);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <GlassPanel className="text-center py-20">
        <h2 className="text-xl font-bold text-red-400">Profile Not Found</h2>
        <p className="text-mutedText mt-2">The user you are looking for does not exist on this platform.</p>
        <Link href="/" className="mt-4 inline-block text-xs font-bold text-primary hover:underline">
          Return to Storefront
        </Link>
      </GlassPanel>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      
      {/* Banner & Bio Header */}
      <div 
        className="w-full h-[220px] rounded-2xl overflow-hidden bg-cover bg-center border border-white/5 relative"
        style={{ backgroundImage: `linear-gradient(to top, #080b10 10%, rgba(8, 11, 16, 0.4) 80%), url(${profile.profile.bannerUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80'})` }}
      >
        <div className="absolute inset-0 flex items-end p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-end gap-6 w-full justify-between">
            <div className="flex items-center gap-4">
              <img 
                src={profile.profile.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username}`} 
                alt="avatar" 
                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-black border-2 border-primary/50 shadow-neonBlue"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-black text-white text-glow-blue">{profile.username}</h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-primary/20 bg-primary/5 text-primary">
                    {profile.role}
                  </span>
                </div>
                
                <p className="text-xs text-mutedText mt-1.5 leading-relaxed max-w-md line-clamp-2">
                  {profile.profile.bio}
                </p>
              </div>
            </div>

            {/* Actions / Subscriptions */}
            {currentUser && currentUser.id !== profile.id && profile.role === 'DEVELOPER' && (
              <button 
                onClick={handleSubscribe}
                className={`px-6 py-2.5 rounded-xl border text-xs font-bold transition-all ${isSubscribed ? 'border-primary/40 bg-primary/10 text-primary shadow-[0_0_10px_rgba(0,240,255,0.15)]' : 'border-white/5 bg-white/5 hover:bg-white/10 text-gray-200'}`}
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe to Dev'}
              </button>
            )}

            {currentUser && profile && (currentUser.id === profile.id || currentUser.username.trim().toLowerCase() === decodeURIComponent(username).trim().toLowerCase()) && (
              <button 
                onClick={() => setEditModalOpen(true)}
                className="px-6 py-2.5 rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-[0_0_10px_rgba(0,240,255,0.15)] hover:bg-primary/20 transition-all text-xs font-bold"
              >
                {lang === 'ru' ? 'Редактировать профиль' : 'Edit Profile'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (Library, Achievements) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Played Games History */}
          <GlassPanel className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Gamepad2 className="w-5 h-5 text-primary text-glow-blue" />
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">{t('store')} & {t('recentActivity')}</h3>
            </div>

            {profile.playHistory.length === 0 ? (
              <div className="text-center py-8 text-xs text-mutedText">
                Нет недавней игровой активности.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {profile.playHistory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5 hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3">
                      <img src={item.game.coverUrl} alt="game cover" className="w-10 h-14 object-cover rounded bg-black" />
                      <div>
                        <Link href={`/game/${item.game.slug}`} className="text-xs font-extrabold text-gray-200 hover:text-primary transition-colors">
                          {item.game.title}
                        </Link>
                        <p className="text-[10px] text-mutedText mt-0.5">Сыграно: {new Date(item.lastPlayedAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-extrabold text-primary">{(item.playTimeSeconds / 60).toFixed(0)} {t('minutes')}</span>
                      <p className="text-[9px] text-mutedText mt-0.5">{t('playedTime')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>

          {/* Achievements Unlocked */}
          <GlassPanel className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">{t('unlockedAchievements')} ({profile.achievements.length})</h3>
            </div>

            {profile.achievements.length === 0 ? (
              <div className="text-center py-8 text-xs text-mutedText">
                {t('noAchievements')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.achievements.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-white/5">
                    <img src={item.achievement.iconUrl} alt="achievement icon" className="w-10 h-10 object-cover rounded border border-white/5" />
                    <div>
                      <h4 className="text-xs font-bold text-gray-200">{item.achievement.name}</h4>
                      <span className="text-[9px] text-mutedText block">Игра: {item.achievement.game.title}</span>
                      <span className="text-[9px] text-primary/80 font-bold block mt-0.5">{t('unlocked')} {new Date(item.unlockedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>

        </div>

        {/* Right Column (Progression stats / Leveling) */}
        <div className="flex flex-col gap-8">
          
          {/* Level Progress Panel */}
          <GlassPanel glow className="flex flex-col gap-4">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-mutedText border-b border-white/5 pb-2">Прогресс</h3>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-mutedText">{t('level')}:</span>
              <span className="text-lg font-black text-primary text-glow-blue border border-primary/30 rounded px-2.5 py-0.5 bg-primary/5">
                {profile.level}
              </span>
            </div>

            <div className="flex flex-col gap-1.5 mt-2">
              <div className="flex justify-between text-[11px] font-bold text-gray-400">
                <span>XP</span>
                <span>{profile.xp % 500} / 500 XP</span>
              </div>
              <div className="w-full h-2.5 bg-black border border-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary via-blue-500 to-accent transition-all duration-500 shadow-neonBlue"
                  style={{ width: `${((profile.xp % 500) / 500) * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 border-t border-white/5 pt-4 text-center">
              <div className="p-2 rounded bg-black/40 border border-white/5">
                <span className="text-sm font-black text-white">{profile.points}</span>
                <span className="text-[9px] text-mutedText block uppercase mt-0.5">G-Points</span>
              </div>
              <div className="p-2 rounded bg-black/40 border border-white/5">
                <span className="text-sm font-black text-white">{profile.xp}</span>
                <span className="text-[9px] text-mutedText block uppercase mt-0.5">Total XP</span>
              </div>
            </div>
          </GlassPanel>

          {/* Badges system */}
          <GlassPanel className="flex flex-col gap-4">
            <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Award className="w-4.5 h-4.5 text-accent" />
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-mutedText">Earned Badges</h3>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex flex-col items-center gap-1 px-3 py-2 rounded bg-black/40 border border-white/5 text-center w-20">
                <span className="text-xl" title="Completed signup">🚀</span>
                <span className="text-[8px] font-black text-gray-300">Pioneer</span>
              </div>
              
              {profile.level >= 10 && (
                <div className="flex flex-col items-center gap-1 px-3 py-2 rounded bg-black/40 border border-white/5 text-center w-20">
                  <span className="text-xl" title="Level 10 reached">👑</span>
                  <span className="text-[8px] font-black text-primary">Veteran</span>
                </div>
              )}
              
              {profile.playHistory.length >= 3 && (
                <div className="flex flex-col items-center gap-1 px-3 py-2 rounded bg-black/40 border border-white/5 text-center w-20">
                  <span className="text-xl" title="Played 3 different games">🎮</span>
                  <span className="text-[8px] font-black text-neonGreen">Collector</span>
                </div>
              )}
            </div>
          </GlassPanel>

          {/* Subscriptions / Subscribed Users */}
          {profile.role === 'DEVELOPER' && (
            <GlassPanel className="flex flex-col gap-4">
              <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                <Users className="w-4.5 h-4.5 text-primary" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-mutedText">Subscribers ({profile.subscribers.length})</h3>
              </div>

              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                {profile.subscribers.length === 0 ? (
                  <span className="text-[10px] text-mutedText">No subscribers yet.</span>
                ) : (
                  profile.subscribers.map((sub, idx) => (
                    <div key={idx} className="flex items-center gap-1 px-2.5 py-1 rounded bg-black/40 border border-white/5 text-[10px] font-bold text-gray-300">
                      <img src={sub.user.profile?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${sub.user.username}`} alt="avatar" className="w-4 h-4 rounded-full bg-black/40" />
                      {sub.user.username}
                    </div>
                  ))
                )}
              </div>
            </GlassPanel>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div 
            className="w-full max-w-md rounded-2xl border border-white/5 bg-[#0b101c] p-6 shadow-2xl flex flex-col gap-4 relative animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-white/5 pb-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                {lang === 'ru' ? 'Редактирование профиля' : 'Edit Profile'}
              </h3>
            </div>

            {updateError && (
              <span className="text-[10px] font-bold text-secondary">{updateError}</span>
            )}

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              
              {/* Avatar Url */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-mutedText">
                  {lang === 'ru' ? 'Ссылка на аватар' : 'Avatar Image URL'}
                </label>
                <input 
                  type="text" 
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="e.g. https://unsplash.com/... or SVG link"
                  className="bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-xs text-gray-200 outline-none focus:border-primary/45 w-full"
                />
              </div>

              {/* Banner Url */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-mutedText">
                  {lang === 'ru' ? 'Ссылка на баннер' : 'Banner Image URL'}
                </label>
                <input 
                  type="text" 
                  value={editBannerUrl}
                  onChange={(e) => setEditBannerUrl(e.target.value)}
                  placeholder="e.g. https://images.unsplash.com/..."
                  className="bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-xs text-gray-200 outline-none focus:border-primary/45 w-full"
                />
              </div>

              {/* Bio */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-mutedText">
                  {lang === 'ru' ? 'О себе' : 'Bio'}
                </label>
                <textarea 
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder={lang === 'ru' ? 'Расскажите немного о себе...' : 'Write something about yourself...'}
                  className="bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-xs text-gray-200 outline-none focus:border-primary/45 w-full resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 border-t border-white/5 pt-4 mt-2">
                <button 
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/5 hover:bg-white/5 text-xs text-gray-400 font-bold"
                >
                  {lang === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
                <button 
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-black font-extrabold text-xs shadow-neonBlue hover:brightness-110 disabled:opacity-50"
                >
                  {savingProfile ? (lang === 'ru' ? 'Сохранение...' : 'Saving...') : (lang === 'ru' ? 'Сохранить' : 'Save')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Fallback Mock profile
function getFallbackProfile(username: string): ProfileUser {
  return {
    id: 'user-123',
    username: username,
    role: username === 'neon_developer' ? 'DEVELOPER' : username === 'admin' ? 'ADMIN' : 'USER',
    level: 4,
    xp: 1800,
    points: 210,
    createdAt: '2026-07-01T12:00:00Z',
    profile: {
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80',
      bio: username === 'neon_developer' ? 'Indie WebGL developer. Coding games since 2018.' : 'Hardcore browser games enthusiast. Seeking high scores.',
      favoriteGames: ['neon-runner', 'quantum-maze']
    },
    playHistory: [
      {
        id: 'p1',
        playTimeSeconds: 5400,
        lastPlayedAt: '2026-07-05T12:00:00Z',
        game: { title: 'Neon Runner 2026', slug: 'neon-runner', coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80' }
      },
      {
        id: 'p2',
        playTimeSeconds: 1200,
        lastPlayedAt: '2026-07-04T12:00:00Z',
        game: { title: 'Quantum Maze', slug: 'quantum-maze', coverUrl: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=600&q=80' }
      }
    ],
    achievements: [
      {
        id: 'u1',
        unlockedAt: '2026-07-05T12:00:00Z',
        achievement: {
          name: 'Grid Walker',
          description: 'Reach a score of 10,000 meters in a single run.',
          iconUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=128&q=80',
          game: { title: 'Neon Runner 2026' }
        }
      }
    ],
    subscribers: [],
    subscriptions: []
  };
}
