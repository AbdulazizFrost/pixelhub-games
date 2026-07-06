"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import GlassPanel from '@/components/GlassPanel';
import { Shield, Users, Gamepad2, TrendingUp, Check, X, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface AdminStats {
  totalUsers: number;
  totalDevelopers: number;
  totalGames: number;
  pendingGames: number;
  totalPlays: number;
  totalLikes: number;
  estimatedRevenue: number;
}

interface PendingGame {
  id: string;
  title: string;
  slug: string;
  category: { name: string };
  developer: { username: string };
  createdAt: string;
}

interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: 'USER' | 'DEVELOPER' | 'ADMIN';
  level: number;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, apiUrl, authFetch } = useAuth();
  const { t } = useLocale();
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingGames, setPendingGames] = useState<PendingGame[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'moderation' | 'users'>('moderation');

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    async function loadAdminData() {
      try {
        setLoading(true);
        const statsRes = await authFetch('/admin/stats');
        const pendingRes = await authFetch('/admin/pending');
        const usersRes = await authFetch('/admin/users');

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.stats);
        } else {
          setStats(getFallbackStats());
        }

        if (pendingRes.ok) {
          const pendingData = await pendingRes.json();
          setPendingGames(pendingData.games);
        } else {
          setPendingGames(getFallbackPendingGames());
        }

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData.users);
        } else {
          setUsers(getFallbackUsers());
        }

      } catch (err) {
        console.error("Admin dashboard endpoint error, loading mock state:", err);
        setStats(getFallbackStats());
        setPendingGames(getFallbackPendingGames());
        setUsers(getFallbackUsers());
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, [user, apiUrl]);

  const handleModerate = async (gameId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await authFetch(`/admin/games/${gameId}/moderate`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setPendingGames(pendingGames.filter((g) => g.id !== gameId));
        if (stats) {
          setStats({
            ...stats,
            pendingGames: stats.pendingGames - 1,
            totalGames: status === 'APPROVED' ? stats.totalGames + 1 : stats.totalGames
          });
        }
      }
    } catch (err) {
      console.error(err);
      // Remove locally for mockup responsiveness
      setPendingGames(pendingGames.filter((g) => g.id !== gameId));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user account permanently?')) return;
    try {
      const res = await authFetch(`/admin/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(users.filter((u) => u.id !== userId));
        if (stats) {
          setStats({
            ...stats,
            totalUsers: stats.totalUsers - 1
          });
        }
      }
    } catch (err) {
      console.error(err);
      // Filter locally for mockup responsiveness
      setUsers(users.filter((u) => u.id !== userId));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      
      {/* Admin Panel Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white text-glow-blue uppercase flex items-center gap-2">
            <Shield className="w-7 h-7 text-primary" />
            Admin Command Console
          </h1>
          <p className="text-xs text-mutedText mt-0.5">Control center for user compliance, monetization, and game reviews.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('moderation')}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${activeView === 'moderation' ? 'border-primary bg-primary/10 text-primary shadow-[0_0_10px_rgba(0,240,255,0.1)]' : 'border-white/5 bg-black/40 text-gray-300 hover:text-white'}`}
          >
            Pending Reviews ({pendingGames.length})
          </button>
          
          <button
            onClick={() => setActiveView('users')}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${activeView === 'users' ? 'border-primary bg-primary/10 text-primary shadow-[0_0_10px_rgba(0,240,255,0.1)]' : 'border-white/5 bg-black/40 text-gray-300 hover:text-white'}`}
          >
            User List ({users.length})
          </button>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <GlassPanel className="p-4 bg-[#0e121a] flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            <div>
              <span className="text-[10px] text-mutedText uppercase font-bold block">Total Gamers</span>
              <h3 className="text-lg font-black text-white">{stats.totalUsers}</h3>
            </div>
          </GlassPanel>

          <GlassPanel className="p-4 bg-[#0e121a] flex items-center gap-3">
            <Gamepad2 className="w-6 h-6 text-secondary" />
            <div>
              <span className="text-[10px] text-mutedText uppercase font-bold block">Active Games</span>
              <h3 className="text-lg font-black text-white">{stats.totalGames}</h3>
            </div>
          </GlassPanel>

          <GlassPanel className="p-4 bg-[#0e121a] flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-neonGreen" />
            <div>
              <span className="text-[10px] text-mutedText uppercase font-bold block">Plays Count</span>
              <h3 className="text-lg font-black text-white">{stats.totalPlays}</h3>
            </div>
          </GlassPanel>

          <GlassPanel className="p-4 bg-[#0e121a] flex items-center gap-3">
            <span className="text-xl font-black text-glow-green">$</span>
            <div>
              <span className="text-[10px] text-mutedText uppercase font-bold block">G-Store Revenue</span>
              <h3 className="text-lg font-black text-white">${stats.estimatedRevenue}</h3>
            </div>
          </GlassPanel>
        </div>
      )}

      {activeView === 'moderation' ? (
        /* Moderation list */
        <GlassPanel glow className="flex flex-col gap-4">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">Pending Sandbox Moderation Queue</h3>
          
          {pendingGames.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center justify-center gap-2">
              <ShieldCheck className="w-10 h-10 text-neonGreen animate-pulse" />
              <p className="text-mutedText font-semibold text-xs">All uploaded game builds have been processed!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-mutedText uppercase tracking-wider text-[10px] font-bold">
                    <th className="pb-3">Title</th>
                    <th className="pb-3">Developer</th>
                    <th className="pb-3">Genre</th>
                    <th className="pb-3">Uploaded On</th>
                    <th className="pb-3 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-semibold">
                  {pendingGames.map((g) => (
                    <tr key={g.id} className="hover:bg-white/2 transition-colors">
                      <td className="py-4 text-gray-200">
                        <Link href={`/game/${g.slug}`} className="hover:text-primary transition-colors">
                          {g.title}
                        </Link>
                      </td>
                      <td className="py-4 text-gray-300">@{g.developer.username}</td>
                      <td className="py-4 text-gray-400">{g.category?.name || 'Sandbox'}</td>
                      <td className="py-4 text-gray-400">{new Date(g.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => handleModerate(g.id, 'APPROVED')}
                            className="p-1.5 rounded border border-neonGreen/20 bg-neonGreen/5 hover:bg-neonGreen/25 text-neonGreen transition-all flex items-center gap-1"
                            title="Approve & Deploy Game"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          
                          <button 
                            onClick={() => handleModerate(g.id, 'REJECTED')}
                            className="p-1.5 rounded border border-red-500/20 bg-red-500/5 hover:bg-red-500/25 text-red-400 transition-all flex items-center gap-1"
                            title="Reject build"
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject
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
        /* Users List View */
        <GlassPanel glow className="flex flex-col gap-4">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">Registered Users Command Deck</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 text-mutedText uppercase tracking-wider text-[10px] font-bold">
                  <th className="pb-3">Username</th>
                  <th className="pb-3">Email Address</th>
                  <th className="pb-3">Access Role</th>
                  <th className="pb-3">LVL</th>
                  <th className="pb-3">Registered Date</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-semibold">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/2 transition-colors">
                    <td className="py-4 text-gray-200">
                      <Link href={`/profile/${u.username}`} className="hover:text-primary transition-colors font-bold">
                        @{u.username}
                      </Link>
                    </td>
                    <td className="py-4 text-gray-300">{u.email}</td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${u.role === 'ADMIN' ? 'border-secondary bg-secondary/5 text-secondary' : u.role === 'DEVELOPER' ? 'border-primary bg-primary/5 text-primary' : 'border-white/10 bg-white/5 text-gray-300'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 text-gray-400">{u.level}</td>
                    <td className="py-4 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 text-right">
                      <button 
                        onClick={() => handleDeleteUser(u.id)}
                        disabled={u.role === 'ADMIN'}
                        className={`p-2 rounded border border-white/5 hover:border-red-500/30 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors ${u.role === 'ADMIN' ? 'opacity-40 cursor-not-allowed' : ''}`}
                        title="Delete User permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      )}

    </div>
  );
}

// Fallback values for layout testing
function getFallbackStats(): AdminStats {
  return {
    totalUsers: 1450,
    totalDevelopers: 84,
    totalGames: 120,
    pendingGames: 2,
    totalPlays: 12450,
    totalLikes: 1402,
    estimatedRevenue: 1420.50
  };
}

function getFallbackPendingGames(): PendingGame[] {
  return [
    {
      id: 'pending-1',
      title: 'Neon Dodger 2.0',
      slug: 'neon-dodger-2',
      category: { name: 'Action' },
      developer: { username: 'dev_guy' },
      createdAt: '2026-07-06T12:00:00Z'
    }
  ];
}

function getFallbackUsers(): AdminUser[] {
  return [
    { id: '1', email: 'admin@steam.com', username: 'admin', role: 'ADMIN', level: 15, createdAt: '2026-07-01' },
    { id: '2', email: 'dev@steam.com', username: 'neon_developer', role: 'DEVELOPER', level: 8, createdAt: '2026-07-02' },
    { id: '3', email: 'gamer@steam.com', username: 'pro_gamer2026', role: 'USER', level: 4, createdAt: '2026-07-03' }
  ];
}
