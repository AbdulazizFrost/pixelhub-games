"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import GlassPanel from '@/components/GlassPanel';
import GameCard from '@/components/GameCard';
import { Play, Star, Calendar, Download, ShieldCheck, Heart, User, CheckCircle2, ChevronRight, Lock, Unlock, Award, Trophy } from 'lucide-react';

interface GameMedia {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO';
}

interface GameVersion {
  id: string;
  version: string;
  changelog: string;
  createdAt: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  xpValue: number;
}

interface Review {
  id: string;
  rating: number;
  text: string;
  createdAt: string;
  user: {
    username: string;
    profile?: { avatarUrl: string };
  };
}

interface GameDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  coverUrl: string;
  bannerUrl: string;
  category?: { name: string; slug: string };
  tags: string[];
  ageRating: string;
  version: string;
  size: number;
  isFree: boolean;
  price: number;
  playsCount: number;
  likesCount: number;
  ratingAverage: number;
  ratingsCount: number;
  developer: {
    id: string;
    username: string;
    profile?: { bio: string; avatarUrl: string };
  };
  media: GameMedia[];
  versions: GameVersion[];
  achievements: Achievement[];
  reviews: Review[];
}

export default function GameDetailsPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { slug } = params;
  const { apiUrl, user, authFetch } = useAuth();
  const { t } = useLocale();
  
  const [game, setGame] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Review form states
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  // Gallery active index
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  // Roadmap States
  const [achievements, setAchievements] = useState<Array<Achievement & { unlocked: boolean }>>([]);
  const [leaderboard, setLeaderboard] = useState<Array<{ rank: number; username: string; score: number; level: number; avatarUrl: string }>>([]);
  const [activeTab, setActiveTab] = useState<'about' | 'achievements' | 'leaderboard'>('about');

  useEffect(() => {
    async function loadGameDetails() {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/games/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setGame(data.game);
          
          // Check if liked if logged in
          if (user && data.game) {
            const hasLiked = user.likes?.some((l: any) => l.gameId === data.game.id);
            setIsLiked(!!hasLiked);
          }
        } else {
          setGame(getFallbackGame(slug));
        }
      } catch (err) {
        console.error("Error loading game details from Express, loading static mock details:", err);
        setGame(getFallbackGame(slug));
      } finally {
        setLoading(false);
      }
    }
    loadGameDetails();
  }, [slug, apiUrl, user]);

  useEffect(() => {
    if (!game) return;
    const gameId = game.id;

    async function loadInteractions() {
      try {
        const achRes = user 
          ? await authFetch(`/games/${gameId}/achievements`)
          : await fetch(`${apiUrl}/games/${gameId}/achievements`);
        if (achRes.ok) {
          const data = await achRes.json();
          setAchievements(data.achievements);
        }

        const leadRes = await fetch(`${apiUrl}/games/${gameId}/leaderboard`);
        if (leadRes.ok) {
          const data = await leadRes.json();
          setLeaderboard(data.leaderboard);
        }
      } catch (err) {
        console.error("Failed to load achievements or leaderboard:", err);
      }
    }
    loadInteractions();
  }, [game, user, apiUrl]);

  const handleLike = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!game) return;

    try {
      const res = await authFetch(`/games/${game.id}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.liked);
        setGame(prev => prev ? {
          ...prev,
          likesCount: data.liked ? prev.likesCount + 1 : prev.likesCount - 1
        } : null);
      }
    } catch (err) {
      console.error(err);
      // Toggle locally for mockup responsiveness
      setIsLiked(prev => !prev);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess(false);

    if (!user) {
      router.push('/login');
      return;
    }
    if (!game) return;

    try {
      const res = await authFetch(`/games/${game.id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, text: reviewText })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setReviewSuccess(true);
      setReviewText('');
      
      // Update local state to include new review
      const newReview: Review = {
        id: data.review.id || Math.random().toString(),
        rating,
        text: reviewText,
        createdAt: new Date().toISOString(),
        user: {
          username: user.username,
          profile: { avatarUrl: user.profile?.avatarUrl || '' }
        }
      };

      setGame(prev => {
        if (!prev) return null;
        const filtered = prev.reviews.filter(r => r.user.username !== user.username);
        const updatedReviews = [newReview, ...filtered];
        const newAverage = updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length;
        
        return {
          ...prev,
          reviews: updatedReviews,
          ratingsCount: updatedReviews.length,
          ratingAverage: parseFloat(newAverage.toFixed(1))
        };
      });
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!game) {
    return (
      <GlassPanel className="text-center py-20">
        <h2 className="text-xl font-bold text-red-400">Game Not Found</h2>
        <p className="text-mutedText mt-2">The game you are looking for does not exist on this platform.</p>
        <Link href="/" className="mt-4 inline-block text-xs font-bold text-primary hover:underline">
          Return to Storefront
        </Link>
      </GlassPanel>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      
      {/* Banner Backdrop */}
      <div 
        className="w-full h-[220px] md:h-[350px] rounded-2xl overflow-hidden bg-cover bg-center border border-white/5 relative"
        style={{ backgroundImage: `linear-gradient(to top, #080b10 10%, rgba(8, 11, 16, 0.4) 60%, rgba(8, 11, 16, 0.8) 100%), url(${game.bannerUrl})` }}
      >
        <div className="absolute inset-0 flex items-end p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-end gap-6 w-full justify-between">
            <div className="flex items-center gap-4">
              <img src={game.coverUrl} alt="Cover" className="w-20 h-28 md:w-28 md:h-38 object-cover rounded-lg border-2 border-white/10 shadow-2xl bg-black" />
              <div>
                <span className="text-[9px] font-black bg-primary/20 text-primary border border-primary/20 px-2 py-0.5 rounded uppercase tracking-wider">
                  {game.category?.name || 'Sandbox'}
                </span>
                <h1 className="text-2xl md:text-4xl font-black text-white text-glow-blue mt-1.5">{game.title}</h1>
                <p className="text-xs text-mutedText mt-1">by <span className="text-gray-200 font-bold hover:text-primary cursor-pointer">{game.developer.username}</span></p>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="flex items-center gap-3">
              <button 
                onClick={handleLike}
                className={`p-3.5 rounded-xl border flex items-center justify-center transition-all ${isLiked ? 'border-secondary/40 bg-secondary/10 text-secondary' : 'border-white/5 bg-black/40 text-gray-300 hover:text-white'}`}
                title="Favorite Game"
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-secondary' : ''}`} />
              </button>

              <Link 
                href={`/game/${game.slug}/play`}
                className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary to-accent text-black font-extrabold text-sm rounded-xl hover:scale-105 shadow-neonBlue hover:brightness-110 transition-all"
              >
                <Play className="w-4 h-4 fill-black" />
                PLAY NOW
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid details layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: media gallery, details, reviews */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Gallery Carousel */}
          {game.media && game.media.length > 0 && (
            <GlassPanel className="flex flex-col gap-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-mutedText">Media Gallery</h3>
              
              <div className="w-full h-[240px] md:h-[360px] rounded-lg overflow-hidden bg-black border border-white/5 relative">
                <img 
                  src={game.media[activeMediaIndex]?.url || game.coverUrl} 
                  alt="active media" 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Thumbnails grid */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {game.media.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveMediaIndex(idx)}
                    className={`w-20 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${idx === activeMediaIndex ? 'border-primary shadow-neonBlue scale-95' : 'border-white/5 opacity-60 hover:opacity-100'}`}
                  >
                    <img src={item.url} alt="media thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </GlassPanel>
          )}

          {/* Interactive Tabs Menu */}
          <div className="flex gap-2 border-b border-white/5 pb-2 mb-2">
            <button 
              onClick={() => setActiveTab('about')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'about' ? 'bg-primary text-black shadow-neonBlue' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              {t('description')} & {t('reviews')}
            </button>
            <button 
              onClick={() => setActiveTab('achievements')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'achievements' ? 'bg-primary text-black shadow-neonBlue' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              {t('achievements')} ({achievements.length})
            </button>
            <button 
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'leaderboard' ? 'bg-primary text-black shadow-neonBlue' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              {t('leaderboard')} ({leaderboard.length})
            </button>
          </div>

          {/* Tab 1: About & Reviews */}
          {activeTab === 'about' && (
            <>
              {/* Description */}
              <GlassPanel className="flex flex-col gap-3">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-mutedText">About the Game</h3>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{game.description}</p>
              </GlassPanel>

              {/* Customer Reviews Section */}
              <div className="flex flex-col gap-4">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-mutedText">Player Feedback</h3>

                {/* Write feedback form */}
                {user ? (
                  <GlassPanel className="flex flex-col gap-4">
                    <h4 className="text-xs font-bold text-gray-300">Submit Your Review</h4>
                    
                    {reviewSuccess && (
                      <div className="p-3 rounded-lg border border-neonGreen/20 bg-neonGreen/10 text-xs text-neonGreen font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Review submitted successfully! XP awarded.
                      </div>
                    )}
                    
                    {reviewError && (
                      <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-xs text-red-400 font-semibold">
                        {reviewError}
                      </div>
                    )}

                    <form onSubmit={handleReviewSubmit} className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-300">Rating:</span>
                        <select 
                          value={rating} 
                          onChange={(e) => setRating(parseInt(e.target.value))}
                          className="bg-surface-light border border-white/5 rounded px-2.5 py-1 text-xs text-yellow-400 font-bold outline-none"
                        >
                          <option value="5">★★★★★ (5 - Masterpiece)</option>
                          <option value="4">★★★★☆ (4 - Great)</option>
                          <option value="3">★★★☆☆ (3 - Average)</option>
                          <option value="2">★★☆☆☆ (2 - Poor)</option>
                          <option value="1">★☆☆☆☆ (1 - Terrible)</option>
                        </select>
                      </div>

                      <textarea 
                        rows={4} 
                        required
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Provide detailed feedback on game mechanics, responsive controllers, graphics..."
                        className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-xs font-semibold text-gray-200 outline-none focus:border-primary/40"
                      />

                      <button 
                        type="submit" 
                        className="self-end px-5 py-2 bg-gradient-to-r from-primary to-accent text-black font-extrabold text-xs rounded-lg hover:brightness-110 shadow-neonBlue"
                      >
                        Submit Review
                      </button>
                    </form>
                  </GlassPanel>
                ) : (
                  <GlassPanel className="text-center py-4 bg-white/2">
                    <span className="text-xs text-mutedText">
                      You must <Link href="/login" className="text-primary font-bold hover:underline">Log In</Link> to write a customer review.
                    </span>
                  </GlassPanel>
                )}

                {/* List of Reviews */}
                <div className="flex flex-col gap-4">
                  {game.reviews.length === 0 ? (
                    <GlassPanel className="text-center py-10">
                      <span className="text-xs text-mutedText">No player reviews submitted yet. Be the first!</span>
                    </GlassPanel>
                  ) : (
                    game.reviews.map((rev) => (
                      <GlassPanel key={rev.id} className="flex gap-4 items-start bg-[#0e121a]/50">
                        <img 
                          src={rev.user.profile?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${rev.user.username}`} 
                          alt="avatar" 
                          className="w-8 h-8 rounded bg-black/40 border border-white/5"
                        />
                        <div className="flex-grow">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-200">{rev.user.username}</span>
                            <div className="flex gap-0.5 text-yellow-400 text-xs">
                              {Array.from({ length: rev.rating }).map((_, idx) => (
                                <Star key={idx} className="w-3.5 h-3.5 fill-yellow-400" />
                              ))}
                            </div>
                          </div>
                          
                          <span className="text-[10px] text-mutedText">
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </span>
                          
                          <p className="text-xs text-gray-300 mt-2 leading-relaxed whitespace-pre-wrap">{rev.text}</p>
                        </div>
                      </GlassPanel>
                    ))
                  )}
                </div>

              </div>
            </>
          )}

          {/* Tab 2: Achievements */}
          {activeTab === 'achievements' && (
            <GlassPanel className="flex flex-col gap-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                {t('achievements')} ({achievements.length})
              </h3>
              {achievements.length === 0 ? (
                <div className="text-center py-10 text-xs text-mutedText">
                  {t('noAchievements')}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((ach) => (
                    <div 
                      key={ach.id} 
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${ach.unlocked ? 'bg-primary/5 border-primary/20 shadow-[0_0_15px_rgba(0,240,255,0.05)]' : 'bg-black/40 border-white/5 opacity-50'}`}
                    >
                      <div className="relative">
                        <img src={ach.iconUrl} alt="ach icon" className="w-12 h-12 object-cover rounded-md border border-white/10" />
                        <div className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-[#080b10] border border-white/10">
                          {ach.unlocked ? (
                            <Unlock className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-mutedText" />
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-gray-200">{ach.name}</h4>
                        <p className="text-[10px] text-mutedText mt-0.5">{ach.description}</p>
                        <span className="text-[9px] font-bold text-primary mt-1 inline-block">+{ach.xpValue} XP</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassPanel>
          )}

          {/* Tab 3: Leaderboard */}
          {activeTab === 'leaderboard' && (
            <GlassPanel className="flex flex-col gap-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                {t('leaderboard')}
              </h3>
              {leaderboard.length === 0 ? (
                <div className="text-center py-10 text-xs text-mutedText">
                  {t('noScores')}
                </div>
              ) : (
                <div className="w-full overflow-hidden border border-white/5 rounded-xl bg-black/40">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/2 text-[10px] uppercase font-bold tracking-wider text-mutedText">
                        <th className="py-3 px-4">Rank</th>
                        <th className="py-3 px-4">Player</th>
                        <th className="py-3 px-4">Level</th>
                        <th className="py-3 px-4 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((scoreItem, idx) => {
                        let rankStyle = "text-gray-400";
                        let rankName = `${idx + 1}`;
                        if (idx === 0) {
                          rankStyle = "text-yellow-400 font-black shadow-glow";
                          rankName = "🥇 1st";
                        } else if (idx === 1) {
                          rankStyle = "text-gray-300 font-black";
                          rankName = "🥈 2nd";
                        } else if (idx === 2) {
                          rankStyle = "text-orange-400 font-black";
                          rankName = "🥉 3rd";
                        }
                        return (
                          <tr key={idx} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                            <td className="py-3 px-4 text-xs font-bold">
                              <span className={rankStyle}>{rankName}</span>
                            </td>
                            <td className="py-3 px-4 flex items-center gap-2">
                              <img 
                                src={scoreItem.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${scoreItem.username}`} 
                                alt="avatar" 
                                className="w-6 h-6 rounded bg-black/40"
                              />
                              <span className="text-xs font-bold text-gray-200">{scoreItem.username}</span>
                            </td>
                            <td className="py-3 px-4 text-xs text-mutedText">
                              {scoreItem.level}
                            </td>
                            <td className="py-3 px-4 text-xs font-extrabold text-primary text-right">
                              {scoreItem.score.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassPanel>
          )}

        </div>

        {/* Right column: specifications, versions, developers bio */}
        <div className="flex flex-col gap-8">
          
          {/* Game Stats Information Panel */}
          <GlassPanel className="flex flex-col gap-4">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-mutedText border-b border-white/5 pb-2">Technical Info</h3>
            
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between">
                <span className="text-mutedText">Price:</span>
                <span className={`font-bold ${game.isFree ? 'text-neonGreen' : 'text-white'}`}>{game.isFree ? 'FREE TO PLAY' : `$${game.price}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mutedText">Active version:</span>
                <span className="font-bold text-gray-200">{game.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mutedText">Size:</span>
                <span className="font-bold text-gray-200">{game.size} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mutedText">Age Rating:</span>
                <span className="font-bold text-primary">{game.ageRating}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mutedText">Plays:</span>
                <span className="font-bold text-gray-200">{game.playsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mutedText">Ratings count:</span>
                <span className="font-bold text-yellow-400">{game.ratingsCount} reviews</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 p-2.5 rounded bg-black/40 border border-white/5 text-[10px] text-mutedText">
              <ShieldCheck className="w-4 h-4 text-neonGreen flex-shrink-0" />
              <span>Tested. No browser plugin installations required. Sandbox active.</span>
            </div>
          </GlassPanel>

          {/* Version releases */}
          <GlassPanel className="flex flex-col gap-4">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-mutedText border-b border-white/5 pb-2">Release Log</h3>
            
            <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-1">
              {game.versions?.map((ver) => (
                <div key={ver.id} className="border-l-2 border-primary/20 pl-3 py-1 flex flex-col gap-0.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-primary">{ver.version}</span>
                    <span className="text-[9px] text-mutedText">{new Date(ver.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-normal">{ver.changelog || 'Standard optimizations.'}</p>
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* Developer Mini Bio */}
          <GlassPanel className="flex flex-col gap-4">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-mutedText border-b border-white/5 pb-2">Developer</h3>
            
            <div className="flex items-center gap-3">
              <img 
                src={game.developer.profile?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${game.developer.username}`} 
                alt="avatar" 
                className="w-10 h-10 rounded bg-black/40 border border-white/5"
              />
              <div>
                <h4 className="text-xs font-bold text-gray-200 hover:text-primary cursor-pointer transition-colors">
                  {game.developer.username}
                </h4>
                <span className="text-[10px] text-mutedText">Verified Game Studio</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-300 leading-relaxed italic">
              "{game.developer.profile?.bio || 'We make high performance HTML5 browser game architectures.'}"
            </p>
          </GlassPanel>

        </div>

      </div>

    </div>
  );
}

// Fallback Mock Details
function getFallbackGame(slug: string): GameDetail {
  return {
    id: '1',
    title: slug === 'quantum-maze' ? 'Quantum Maze' : slug === 'shadow-strike' ? 'Shadow Strike' : 'Neon Runner 2026',
    slug: slug,
    description: 'This is a premium high-performance WebGL game running natively in the browser, optimized using advanced compression and HTML5 Canvas layers. Experience lag-free input binding and real-time state calculation.',
    shortDescription: 'Cyberpunk infinite runner featuring neon graphics and fast-paced gameplay.',
    coverUrl: slug === 'quantum-maze' 
      ? 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=600&q=80'
      : slug === 'shadow-strike'
        ? 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&q=80'
        : 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80',
    bannerUrl: slug === 'quantum-maze' 
      ? 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=1200&q=80'
      : slug === 'shadow-strike'
        ? 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&q=80'
        : 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80',
    tags: ['Cyberpunk', 'WebGL', 'Runner', 'Retrowave', 'Singleplayer'],
    ageRating: '7+',
    version: '1.2.0',
    size: 45.5,
    isFree: slug !== 'shadow-strike',
    price: slug === 'shadow-strike' ? 4.99 : 0.0,
    playsCount: 2450,
    likesCount: 142,
    ratingAverage: 4.8,
    ratingsCount: 24,
    developer: {
      id: 'dev-1',
      username: 'neon_developer',
      profile: {
        bio: 'Indie WebGL developer. Coding games since 2018.',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=dev'
      }
    },
    media: [
      { id: 'm1', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80', type: 'IMAGE' },
      { id: 'm2', url: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80', type: 'IMAGE' }
    ],
    versions: [
      { id: 'v1', version: '1.2.0', changelog: 'Added new cyber-soundtrack tracks and minor layout bugfixes.', createdAt: '2026-07-04T12:00:00Z' },
      { id: 'v2', version: '1.0.0', changelog: 'Initial game upload.', createdAt: '2026-07-01T12:00:00Z' }
    ],
    achievements: [
      { id: 'a1', name: 'Grid Walker', description: 'Reach a score of 10,000 meters in a single run.', iconUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=128&q=80', xpValue: 100 },
      { id: 'a2', name: 'Battery Overcharged', description: 'Collect 50 energy cores in one attempt.', iconUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=128&q=80', xpValue: 150 }
    ],
    reviews: [
      {
        id: 'r1',
        rating: 5,
        text: 'Absolutely loving the flow state of this game! Controls are incredibly responsive for a WebGL build.',
        createdAt: '2026-07-05T12:00:00Z',
        user: { username: 'pro_gamer2026', profile: { avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=gamer' } }
      }
    ]
  };
}
