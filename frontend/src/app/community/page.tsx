"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import Sidebar from '@/components/Sidebar';
import GlassPanel from '@/components/GlassPanel';
import { MessageSquare, Award, Trophy, ThumbsUp } from 'lucide-react';

interface Activity {
  username: string;
  avatarUrl: string;
  actionText: string;
  time: string;
}

export default function CommunityPage() {
  const { apiUrl } = useAuth();
  const { t } = useLocale();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCommunity() {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/games?status=APPROVED`);
        if (res.ok) {
          const data = await res.json();
          const actions = [
            { text: "unlocked achievement First Blood", textRu: "разблокировал достижение Первая кровь", type: "achievement" },
            { text: "submitted a new high score", textRu: "отправил новый рекорд", type: "score" },
            { text: "liked the game build", textRu: "оценил сборку игры", type: "like" },
            { text: "reviewed the release", textRu: "оставил отзыв к игре", type: "review" }
          ];
          const usersList = ["GamerOne", "RetroCoder", "ProPlayer", "PixelHunter", "GigaByte", "Shadow", "NeonCoder"];
          const generated: Activity[] = [];

          if (data.games && data.games.length > 0) {
            // Generate multiple mock events based on real games
            for (let i = 0; i < 8; i++) {
              const game = data.games[i % data.games.length];
              const user = usersList[i % usersList.length];
              const action = actions[i % actions.length];
              generated.push({
                username: user,
                avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${user}`,
                actionText: `${t('logo') === 'PixelHub' ? action.text : action.textRu} в "${game.title}"`,
                time: `${i + 1}h ago`
              });
            }
          }
          setActivities(generated);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCommunity();
  }, [apiUrl, t]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 select-none">
      <Sidebar />
      <div className="xl:col-span-4 flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-primary text-glow-blue" />
            {t('community')}
          </h1>
          <p className="text-xs text-mutedText mt-1.5">Активность сообщества, рекорды и отзывы в реальном времени.</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <GlassPanel className="text-center py-24">
            <span className="text-sm text-mutedText block">Активность в сообществе пока отсутствует.</span>
          </GlassPanel>
        ) : (
          <div className="flex flex-col gap-4">
            {activities.map((act, idx) => (
              <GlassPanel key={idx} className="p-4 flex items-center gap-4 border border-white/5 hover:border-primary/20 transition-all duration-300">
                <img src={act.avatarUrl} alt="user avatar" className="w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex-shrink-0" />
                <div className="flex-grow min-w-0">
                  <span className="text-xs font-black text-white block">{act.username}</span>
                  <p className="text-xs text-mutedText mt-0.5">{act.actionText}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">{act.time}</span>
                  <div className="flex items-center gap-1 text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/20">
                    {idx % 3 === 0 ? <Award className="w-3.5 h-3.5" /> : idx % 3 === 1 ? <Trophy className="w-3.5 h-3.5" /> : <ThumbsUp className="w-3.5 h-3.5" />}
                    <span className="text-[9px] font-black uppercase">{idx % 3 === 0 ? 'XP' : idx % 3 === 1 ? 'Score' : 'Like'}</span>
                  </div>
                </div>
              </GlassPanel>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
