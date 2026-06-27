import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Zap, Heart, MessageCircleQuestion } from 'lucide-react';
import { Card } from '../components/common/Primitives';
import PresenceAvatar from '../components/common/PresenceAvatar';
import { useAuthStore } from '../stores/authStore';
import { getLeaderboard } from '../services/api';

const BADGES = [
  { key: 'fastResponders', title: 'Quick responders', icon: Zap, color: 'grow', desc: 'Teachers who reply fastest' },
  { key: 'engagedParents', title: 'Most engaged parents', icon: Heart, color: 'warmth', desc: 'Parents staying closely connected' },
  { key: 'curiousStudents', title: 'Most questions answered', icon: MessageCircleQuestion, color: 'brand', desc: 'Students getting the most help' },
];

export default function LeaderboardPage() {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getLeaderboard(user.schoolId)
      .then(({ data }) => setData(data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Trophy className="text-warmth-600" size={26} />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">Spotlight</h1>
      </div>
      <p className="text-ink-mute mb-7">Friendly recognition, never shaming. Everyone here is doing something well.</p>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-64 rounded-card skeleton-shimmer animate-shimmer" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-5">
          {BADGES.map((badge, i) => (
            <motion.div key={badge.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card>
                <div className={`w-11 h-11 rounded-card bg-${badge.color}-50 flex items-center justify-center mb-3`}>
                  <badge.icon size={20} className={`text-${badge.color}-600`} />
                </div>
                <h3 className="font-display font-bold text-ink mb-1">{badge.title}</h3>
                <p className="text-xs text-ink-faint mb-4">{badge.desc}</p>
                <div className="space-y-2.5">
                  {(data?.[badge.key] || []).slice(0, 5).map((person, idx) => (
                    <div key={person.id} className="flex items-center gap-2.5">
                      <span className="text-xs font-mono text-ink-faint w-4">{idx + 1}</span>
                      <PresenceAvatar name={person.name} userId={person.id} status="OFFLINE" size="sm" />
                      <p className="text-sm text-ink-soft truncate flex-1">{person.name}</p>
                      <span className="text-xs font-semibold text-ink-faint">{person.metric}</span>
                    </div>
                  ))}
                  {(!data?.[badge.key] || data[badge.key].length === 0) && (
                    <p className="text-xs text-ink-faint text-center py-4">Not enough data yet this month.</p>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
