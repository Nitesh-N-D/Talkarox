import { motion } from 'framer-motion';
import { formatDistanceToNowStrict } from 'date-fns';
import clsx from 'clsx';
import PresenceAvatar from '../common/PresenceAvatar';
import CategoryBadge from './CategoryBadge';

export default function ChatListItem({ chat, active, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={clsx(
        'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-gray-50',
        active ? 'bg-brand-50' : 'hover:bg-paper-flat'
      )}
    >
      <PresenceAvatar name={chat.name} userId={chat.userId} status={chat.status} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={clsx('text-sm truncate', chat.unreadCount > 0 ? 'font-bold text-ink' : 'font-medium text-ink-soft')}>
            {chat.name}
          </p>
          <span className="text-[11px] text-ink-faint flex-shrink-0 font-mono">
            {chat.lastMessageTime ? formatDistanceToNowStrict(new Date(chat.lastMessageTime), { addSuffix: false }) : ''}
          </span>
        </div>
        {chat.studentContext && (
          <p className="text-[11px] text-ink-faint mb-0.5">re: {chat.studentContext}</p>
        )}
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={clsx('text-xs truncate', chat.unreadCount > 0 ? 'text-ink-soft font-medium' : 'text-ink-faint')}>
            {chat.lastMessage || 'No messages yet'}
          </p>
          {chat.unreadCount > 0 && (
            <span className="bg-danger text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center flex-shrink-0">
              {chat.unreadCount}
            </span>
          )}
        </div>
        {chat.lastCategory && (
          <div className="mt-1.5">
            <CategoryBadge category={chat.lastCategory} size="sm" />
          </div>
        )}
      </div>
    </motion.button>
  );
}
