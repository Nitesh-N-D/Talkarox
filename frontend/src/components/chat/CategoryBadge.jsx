import { motion } from 'framer-motion';
import { BookOpen, Briefcase, AlertCircle, PenLine, Heart } from 'lucide-react';

export const CATEGORY_CONFIG = {
  ACADEMIC: { bg: 'bg-brand-50', text: 'text-brand-700', icon: BookOpen, label: 'Academic' },
  ADMINISTRATIVE: { bg: 'bg-grow-50', text: 'text-grow-700', icon: Briefcase, label: 'Administrative' },
  URGENT: { bg: 'bg-danger-50', text: 'text-danger-700', icon: AlertCircle, label: 'Urgent' },
  HOMEWORK_HELP: { bg: 'bg-warmth-50', text: 'text-warmth-700', icon: PenLine, label: 'Homework Help' },
  PARENT_CONCERN: { bg: 'bg-purple-50', text: 'text-purple-700', icon: Heart, label: 'Parent Concern' },
};

export default function CategoryBadge({ category, size = 'sm' }) {
  const cfg = CATEGORY_CONFIG[category];
  if (!cfg) return null;

  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <motion.span
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`inline-flex items-center font-semibold rounded-full ${cfg.bg} ${cfg.text} ${sizeClasses}`}
    >
      <cfg.icon size={size === 'sm' ? 11 : 13} />
      {cfg.label}
    </motion.span>
  );
}
