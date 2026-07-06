"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import GlassPanel from '@/components/GlassPanel';
import { Upload, Gamepad2, Eye, BarChart3, Edit, Trash2, Plus, CheckCircle, AlertTriangle, Layers, Calendar } from 'lucide-react';

interface Game {
  id: string;
  title: string;
  slug: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  playsCount: number;
  likesCount: number;
  ratingAverage: number;
  version: string;
  size: number;
  createdAt: string;
}

export default function DevDashboard() {
  const router = useRouter();
  const { user, apiUrl, authFetch } = useAuth();
  const { t } = useLocale();
  
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [formAchievements, setFormAchievements] = useState<Array<{ name: string; description: string; xpValue: number; iconUrl: string }>>([
    { name: 'First Play', description: 'Unlock this by launching the game for the first time.', xpValue: 50, iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&q=80' }
  ]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [categoryId, setCategoryId] = useState('1'); // seed Action defaults
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [tags, setTags] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [ageRating, setAgeRating] = useState('3+');
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState('0.00');

  // File states
  const [cover, setCover] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [screenshots, setScreenshots] = useState<FileList | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);

  // Status indicators
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'games' | 'upload'>('games');

  useEffect(() => {
    if (!user || (user.role !== 'DEVELOPER' && user.role !== 'ADMIN')) {
      router.push('/');
      return;
    }

    async function loadDeveloperGames() {
      try {
        setLoading(true);
        const res = await authFetch(`/games?developerId=${user?.id}&status=PENDING`);
        const res2 = await authFetch(`/games?developerId=${user?.id}&status=APPROVED`);
        
        let allGames: Game[] = [];
        if (res.ok) {
          const data = await res.json();
          allGames = [...allGames, ...data.games];
        }
        if (res2.ok) {
          const data2 = await res2.json();
          allGames = [...allGames, ...data2.games];
        }

        if (res.ok || res2.ok) {
          setGames(allGames);
        } else {
          setGames(getFallbackDeveloperGames());
        }
      } catch (err) {
        console.error("Express dashboard endpoint down, loading static developer list:", err);
        setGames(getFallbackDeveloperGames());
      } finally {
        setLoading(false);
      }
    }
    
    async function loadCategories() {
      try {
        const res = await fetch(`${apiUrl}/games/categories`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories);
          if (data.categories && data.categories.length > 0) {
            setCategoryId(data.categories[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    }

    loadDeveloperGames();
    loadCategories();
  }, [user, apiUrl]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    if (!cover || !zipFile) {
      setErrorMsg('Cover Image and Game ZIP Build are mandatory files.');
      setSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('shortDescription', shortDescription);
      formData.append('categoryId', categoryId);
      formData.append('tags', tags);
      formData.append('version', version);
      formData.append('ageRating', ageRating);
      formData.append('isFree', String(isFree));
      formData.append('price', price);
      formData.append('achievements', JSON.stringify(formAchievements));
      
      formData.append('cover', cover);
      if (banner) formData.append('banner', banner);
      if (zipFile) formData.append('zipFile', zipFile);
      
      if (screenshots) {
        for (let i = 0; i < screenshots.length; i++) {
          formData.append('screenshots', screenshots[i]);
        }
      }

      const res = await authFetch('/games', {
        method: 'POST',
        // Note: Do not set Content-Type header when sending FormData! Fetch will auto-configure boundary tags.
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to upload game.');
      }

      setSuccessMsg('Game uploaded successfully and submitted for admin review!');
      setActiveTab('games');
      
      // Append game locally
      const newGame: Game = {
        id: data.game?.id || Math.random().toString(),
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        status: 'PENDING',
        playsCount: 0,
        likesCount: 0,
        ratingAverage: 0,
        version,
        size: parseFloat((zipFile.size / (1024 * 1024)).toFixed(2)),
        createdAt: new Date().toISOString()
      };
      setGames([newGame, ...games]);

      // Reset Form fields
      setTitle('');
      setDescription('');
      setShortDescription('');
      setTags('');
      setVersion('1.0.0');
      setAgeRating('3+');
      setIsFree(true);
      setPrice('0.00');
      setCover(null);
      setBanner(null);
      setScreenshots(null);
      setZipFile(null);
      setFormAchievements([
        { name: 'First Play', description: 'Unlock this by launching the game for the first time.', xpValue: 50, iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&q=80' }
      ]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete game release.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (gameId: string) => {
    if (!confirm('Are you sure you want to delete this game build permanent?')) return;
    try {
      const res = await authFetch(`/games/${gameId}`, { method: 'DELETE' });
      if (res.ok) {
        setGames(games.filter((g) => g.id !== gameId));
      }
    } catch (err) {
      console.error(err);
      // Remove locally for UI responsiveness in fallback
      setGames(games.filter((g) => g.id !== gameId));
    }
  };

  // Metrics details
  const totalPlays = games.reduce((sum, g) => sum + g.playsCount, 0);
  const totalLikes = games.reduce((sum, g) => sum + g.likesCount, 0);
  const averageRating = games.length > 0 ? games.reduce((sum, g) => sum + g.ratingAverage, 0) / games.length : 0;

  return (
    <div className="flex flex-col gap-8">
      
      {/* Dev Hub Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white text-glow-blue uppercase">Developer Hub</h1>
          <p className="text-xs text-mutedText mt-0.5">Manage game compilations, uploads, and storefront listings.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('games')}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${activeTab === 'games' ? 'border-primary bg-primary/10 text-primary shadow-[0_0_10px_rgba(0,240,255,0.1)]' : 'border-white/5 bg-black/40 text-gray-300 hover:text-white'}`}
          >
            My Games
          </button>
          
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg border transition-all ${activeTab === 'upload' ? 'border-primary bg-primary/10 text-primary shadow-[0_0_10px_rgba(0,240,255,0.1)]' : 'border-white/5 bg-black/40 text-gray-300 hover:text-white'}`}
          >
            <Plus className="w-4 h-4" />
            Upload Game
          </button>
        </div>
      </div>

      {/* Analytics stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <GlassPanel className="flex items-center gap-4 p-5 bg-[#0e121a]">
          <div className="p-3.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-mutedText uppercase font-bold tracking-wider">Total Plays</span>
            <h3 className="text-xl font-black text-white mt-0.5">{totalPlays}</h3>
          </div>
        </GlassPanel>

        <GlassPanel className="flex items-center gap-4 p-5 bg-[#0e121a]">
          <div className="p-3.5 rounded-xl bg-secondary/10 text-secondary border border-secondary/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-mutedText uppercase font-bold tracking-wider">Avg Rating</span>
            <h3 className="text-xl font-black text-white mt-0.5">{averageRating.toFixed(1)} / 5.0</h3>
          </div>
        </GlassPanel>

        <GlassPanel className="flex items-center gap-4 p-5 bg-[#0e121a]">
          <div className="p-3.5 rounded-xl bg-neonGreen/10 text-neonGreen border border-neonGreen/20">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-mutedText uppercase font-bold tracking-wider">Total Games</span>
            <h3 className="text-xl font-black text-white mt-0.5">{games.length} builds</h3>
          </div>
        </GlassPanel>
      </div>

      {activeTab === 'games' ? (
        <GlassPanel className="flex flex-col gap-4">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-mutedText">Published Builds</h3>
          
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : games.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-mutedText font-semibold text-xs mb-3">No game projects found in your hub.</p>
              <button 
                onClick={() => setActiveTab('upload')} 
                className="text-xs font-bold px-4 py-2 bg-gradient-to-r from-primary to-accent text-black rounded-lg"
              >
                Upload Your First Game
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-mutedText uppercase tracking-wider text-[10px] font-bold">
                    <th className="pb-3">Title</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Plays</th>
                    <th className="pb-3">Version</th>
                    <th className="pb-3">Size</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-semibold">
                  {games.map((g) => (
                    <tr key={g.id} className="hover:bg-white/2 transition-colors">
                      <td className="py-4 text-gray-200">
                        <Link href={`/game/${g.slug}`} className="hover:text-primary transition-colors">
                          {g.title}
                        </Link>
                      </td>
                      <td className="py-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${g.status === 'APPROVED' ? 'border-neonGreen/30 bg-neonGreen/5 text-neonGreen' : g.status === 'PENDING' ? 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400' : 'border-red-500/30 bg-red-500/5 text-red-400'}`}>
                          {g.status}
                        </span>
                      </td>
                      <td className="py-4 text-gray-300">{g.playsCount}</td>
                      <td className="py-4 text-gray-400">{g.version}</td>
                      <td className="py-4 text-gray-400">{g.size} MB</td>
                      <td className="py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => handleDelete(g.id)}
                            className="p-2 rounded border border-white/5 hover:border-red-500/30 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete build"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassPanel>
      ) : (
        /* Game upload Form */
        <GlassPanel glow className="flex flex-col gap-6">
          
          <div className="border-b border-white/5 pb-3">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">Create Store Listing</h3>
            <p className="text-[11px] text-mutedText">Submit files for dynamic execution sandbox compilation.</p>
          </div>

          {successMsg && (
            <div className="p-3 rounded-lg border border-neonGreen/20 bg-neonGreen/10 text-xs text-neonGreen font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-xs text-red-400 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Inputs */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-300">Game Title</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Neon Runner Extreme"
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-4 text-xs font-semibold text-gray-200 outline-none focus:border-primary/40"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-300">Short Pitch Description</label>
                <input 
                  type="text" 
                  required
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Fast-paced HTML5 arcade shooter..."
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-4 text-xs font-semibold text-gray-200 outline-none focus:border-primary/40"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-300">Detailed Description</label>
                <textarea 
                  rows={6}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write a comprehensive guide of controls, gameplay loop, graphics engines used, credits..."
                  className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-xs font-semibold text-gray-200 outline-none focus:border-primary/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-300">Category Genre</label>
                  <select 
                    value={categoryId} 
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="bg-black/40 border border-white/5 rounded-xl py-2.5 px-3 text-xs text-gray-200 font-semibold outline-none cursor-pointer focus:border-primary/40"
                  >
                    {categories.length > 0 ? (
                      categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="1">Action</option>
                        <option value="2">Adventure</option>
                        <option value="3">FPS</option>
                        <option value="4">Puzzle</option>
                        <option value="5">Horror</option>
                        <option value="6">Casual</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-300">Release Version</label>
                  <input 
                    type="text" 
                    required
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="1.0.0"
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-4 text-xs font-semibold text-gray-200 outline-none focus:border-primary/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-300">Age Rating</label>
                  <input 
                    type="text" 
                    value={ageRating}
                    onChange={(e) => setAgeRating(e.target.value)}
                    placeholder="7+"
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-4 text-xs font-semibold text-gray-200 outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-300">Tags (comma separated)</label>
                  <input 
                    type="text" 
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Cyberpunk, Runner, 3D"
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-4 text-xs font-semibold text-gray-200 outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 p-3 bg-black/45 border border-white/5 rounded-xl mt-2">
                <label className="text-xs font-bold text-gray-300">Pricing Model</label>
                <div className="flex gap-4 text-xs font-semibold">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="radio" 
                      name="pricing" 
                      checked={isFree} 
                      onChange={() => { setIsFree(true); setPrice('0.00'); }} 
                      className="accent-primary"
                    />
                    Free to Play
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="radio" 
                      name="pricing" 
                      checked={!isFree} 
                      onChange={() => setIsFree(false)} 
                      className="accent-primary"
                    />
                    Paid Build
                  </label>
                </div>
                
                {!isFree && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-xs text-mutedText">$</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="bg-black/40 border border-white/5 rounded-lg py-1 px-3 text-xs w-24 text-gray-200 outline-none focus:border-primary"
                    />
                  </div>
                )}
              </div>

              {/* Achievements Creation System */}
              <div className="flex flex-col gap-2 p-4 bg-black/45 border border-white/5 rounded-xl mt-3">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <label className="text-xs font-black text-primary uppercase tracking-wider">Game Achievements</label>
                  <button 
                    type="button"
                    onClick={() => setFormAchievements([...formAchievements, { name: '', description: '', xpValue: 50, iconUrl: '' }])}
                    className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary border border-primary/20 rounded px-2 py-0.5 font-bold hover:bg-primary/20 transition-all"
                  >
                    <Plus className="w-3 h-3" /> Add Achievement
                  </button>
                </div>
                
                {formAchievements.length === 0 ? (
                  <span className="text-[10px] text-mutedText py-2">No achievements added yet. Players love achievements!</span>
                ) : (
                  <div className="flex flex-col gap-3 mt-1 max-h-48 overflow-y-auto pr-1">
                    {formAchievements.map((ach, idx) => (
                      <div key={idx} className="flex flex-col gap-2 p-2.5 rounded-lg bg-white/2 border border-white/5 relative">
                        <button
                          type="button"
                          onClick={() => setFormAchievements(formAchievements.filter((_, i) => i !== idx))}
                          className="absolute top-1.5 right-1.5 text-mutedText hover:text-secondary"
                          title="Remove Achievement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="text" 
                            placeholder="Title (e.g. Speedrunner)"
                            value={ach.name}
                            required
                            onChange={(e) => {
                              const updated = [...formAchievements];
                              updated[idx].name = e.target.value;
                              setFormAchievements(updated);
                            }}
                            className="bg-black/30 border border-white/5 rounded py-1.5 px-2 text-[10px] text-gray-200 outline-none focus:border-primary/45"
                          />
                          <input 
                            type="number" 
                            placeholder="XP Value (e.g. 50)"
                            value={ach.xpValue}
                            required
                            onChange={(e) => {
                              const updated = [...formAchievements];
                              updated[idx].xpValue = parseInt(e.target.value) || 0;
                              setFormAchievements(updated);
                            }}
                            className="bg-black/30 border border-white/5 rounded py-1.5 px-2 text-[10px] text-gray-200 outline-none focus:border-primary/45"
                          />
                        </div>
                        
                        <input 
                          type="text" 
                          placeholder="Description (e.g. Complete level 1 under 30s)"
                          value={ach.description}
                          required
                          onChange={(e) => {
                            const updated = [...formAchievements];
                            updated[idx].description = e.target.value;
                            setFormAchievements(updated);
                          }}
                          className="bg-black/30 border border-white/5 rounded py-1.5 px-2 text-[10px] text-gray-200 outline-none focus:border-primary/45"
                        />

                        <input 
                          type="text" 
                          placeholder="Icon Image URL (e.g. Unsplash URL)"
                          value={ach.iconUrl}
                          onChange={(e) => {
                            const updated = [...formAchievements];
                            updated[idx].iconUrl = e.target.value;
                            setFormAchievements(updated);
                          }}
                          className="bg-black/30 border border-white/5 rounded py-1.5 px-2 text-[10px] text-gray-200 outline-none focus:border-primary/45"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Upload Drag files panel */}
            <div className="flex flex-col gap-5">
              
              <div className="p-5 border border-dashed border-white/10 hover:border-primary/40 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-black/30">
                <Upload className="w-10 h-10 text-primary/60 mb-2.5" />
                <span className="text-xs font-extrabold text-gray-200 uppercase tracking-wider">Upload Game Build (.ZIP)</span>
                <p className="text-[10px] text-mutedText mt-1 max-w-[240px]">Zip structure must contain root index.html. Multi-file folders supported.</p>
                <input 
                  type="file" 
                  accept=".zip"
                  required
                  onChange={(e) => setZipFile(e.target.files ? e.target.files[0] : null)}
                  className="mt-3 text-[10px] text-gray-400 font-semibold"
                />
                {zipFile && <span className="text-[10px] text-neonGreen font-bold mt-2">Selected: {zipFile.name} ({(zipFile.size / (1024*1024)).toFixed(1)} MB)</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-300">Cover Thumbnail (600x800 recommended)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  required
                  onChange={(e) => setCover(e.target.files ? e.target.files[0] : null)}
                  className="bg-black/40 border border-white/5 rounded-xl p-2 text-xs font-semibold text-mutedText outline-none"
                />
                {cover && <span className="text-[10px] text-primary mt-1">Cover: {cover.name}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-300">Banner Cover (1200x500 optional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setBanner(e.target.files ? e.target.files[0] : null)}
                  className="bg-black/40 border border-white/5 rounded-xl p-2 text-xs font-semibold text-mutedText outline-none"
                />
                {banner && <span className="text-[10px] text-primary mt-1">Banner: {banner.name}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-300">Media Screenshots (Max 6)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  multiple
                  onChange={(e) => setScreenshots(e.target.files)}
                  className="bg-black/40 border border-white/5 rounded-xl p-2 text-xs font-semibold text-mutedText outline-none"
                />
                {screenshots && <span className="text-[10px] text-primary mt-1">{screenshots.length} images selected</span>}
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-3.5 bg-gradient-to-r from-primary to-accent text-black font-extrabold text-sm rounded-xl hover:scale-[1.01] hover:brightness-110 transition-all shadow-neonBlue mt-4"
              >
                {submitting ? 'COMPILING & UPLOADING BUILD...' : 'PUBLISH BUILD'}
              </button>

            </div>

          </form>

        </GlassPanel>
      )}

    </div>
  );
}

// Fallback developers list
function getFallbackDeveloperGames(): Game[] {
  return [];
}
