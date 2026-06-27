import { motion } from 'framer-motion';
import { ArrowUp, ArrowRight, Minus } from 'lucide-react';
import { Card } from '../common/Primitives';

export default function StatCard({ icon: Icon, label, value, trend, color = 'brand', delay = 0 }) {
  const TrendIcon = trend > 0 ? ArrowUp : trend < 0 ? ArrowRight : Minus;
  const trendColor = trend > 0 ? 'text-grow-700' : trend < 0 ? 'text-warmth-700' : 'text-ink-faint';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay }}>
      <Card hover>
        <div className="flex items-start justify-between">
          <div className={`w-10 h-10 rounded-card bg-${color}-50 flex items-center justify-center`}>
            <Icon size={18} className={`text-${color}-600`} />
          </div>
          {trend !== undefined && (
            <span className={`flex items-center gap-0.5 text-xs font-semibold ${trendColor}`}>
              <TrendIcon size={12} /> {Math.abs(trend)}%
            </span>
          )}
        </div>
        <p className="text-2xl font-extrabold text-ink font-display mt-3">{value}</p>
        <p className="text-sm text-ink-mute">{label}</p>
      </Card>
    </motion.div>
  );
}
