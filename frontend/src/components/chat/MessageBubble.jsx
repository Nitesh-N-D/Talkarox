import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Check, CheckCheck, Languages, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { translateMessage } from '../../services/api';
import CategoryBadge from './CategoryBadge';

export default function MessageBubble({ message, isOwn, preferredLanguage }) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [translated, setTranslated] = useState(null);
  const [translating, setTranslating] = useState(false);

  const handleTranslate = async () => {
    if (translated) { setShowTranslation((s) => !s); return; }
    setTranslating(true);
    try {
      const { data } = await translateMessage(message.content, preferredLanguage || 'ta');
      setTranslated(data.translatedText);
      setShowTranslation(true);
    } catch {
      // silently fail
    } finally {
      setTranslating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'flex flex-col max-w-[78%] sm:max-w-[65%]',
        isOwn ? 'self-end items-end' : 'self-start items-start'
      )}
    >
      {/* Category badge (incoming only) */}
      {message.category && !isOwn && (
        <div className="mb-1">
          <CategoryBadge category={message.category} />
        </div>
      )}

      {/* Bubble */}
      <div
        className={clsx(
          'rounded-card px-4 py-2.5 text-sm leading-relaxed',
          isOwn
            ? 'bg-brand text-white rounded-br-sm'
            : 'bg-white border border-gray-100 text-ink rounded-bl-sm shadow-sm',
          message.failed && 'border-2 border-danger'
        )}
      >
        {message.messageType === 'IMAGE' && message.fileUrl ? (
          <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={message.fileUrl}
              alt="Shared image"
              className="rounded-card max-w-full max-h-64 object-contain mb-1.5"
              loading="lazy"
            />
          </a>
        ) : message.messageType === 'FILE' && message.fileUrl ? (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx('underline', isOwn ? 'text-white' : 'text-brand')}
          >
            {showTranslation && translated ? translated : message.content}
          </a>
        ) : (
          showTranslation && translated ? translated : message.content
        )}
      </div>

      {/* Timestamp + status row */}
      <div className="flex items-center gap-2 mt-1 px-1">
        {!isOwn && (
          <button
            onClick={handleTranslate}
            className="text-[11px] font-medium text-brand flex items-center gap-1 hover:underline"
          >
            {translating
              ? <Loader2 size={11} className="animate-spin" />
              : <Languages size={11} />
            }
            {showTranslation ? 'Show original' : 'Translate'}
          </button>
        )}

        <span className="text-[11px] text-ink-faint font-mono">
          {format(new Date(message.createdAt), 'h:mm a')}
        </span>

        {/* Tick indicator — only on own messages */}
        {isOwn && (
          <AnimatePresence mode="wait">
            {message.pending ? (
              <motion.span
                key="pending"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Loader2 size={11} className="animate-spin text-ink-faint" />
              </motion.span>
            ) : message.readAt ? (
              /* Double blue tick — recipient has seen it */
              <motion.span
                key="read"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                title={`Seen at ${format(new Date(message.readAt), 'h:mm a')}`}
              >
                <CheckCheck size={14} className="text-brand-400" />
              </motion.span>
            ) : (
              /* Single grey tick — delivered, not yet seen */
              <motion.span
                key="delivered"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Check size={13} className="text-ink-faint" />
              </motion.span>
            )}
          </AnimatePresence>
        )}
      </div>

      {message.failed && (
        <p className="text-[11px] text-danger mt-0.5">Failed to send — tap to retry</p>
      )}
    </motion.div>
  );
}