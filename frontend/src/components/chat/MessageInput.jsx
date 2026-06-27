import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip, PenTool, Smile, Loader2 } from 'lucide-react';
import debounce from 'lodash/debounce';
import toast from 'react-hot-toast';
import Button from '../common/Button';
import { uploadAttachment } from '../../services/api';

const QUICK_EMOJIS = ['👍', '🙏', '✅', '❤️', '😊', '🎉'];

export default function MessageInput({ onSend, onTyping, onOpenWhiteboard, disabled, disabledReason }) {
  const [value, setValue] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const debouncedStopTyping = useCallback(debounce(() => onTyping?.(false), 1200), [onTyping]);

  const handleChange = (e) => {
    setValue(e.target.value);
    onTyping?.(true);
    debouncedStopTyping();
  };

  const handleSend = () => {
    if (!value.trim()) return;
    onSend(value.trim());
    setValue('');
    onTyping?.(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error('File must be under 15MB');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await uploadAttachment(formData);
      const isImage = data.mimeType?.startsWith('image/');
      onSend(`${isImage ? '🖼️' : '📎'} ${data.fileName}`, {
        messageType: isImage ? 'IMAGE' : 'FILE',
        fileUrl: data.fileUrl,
        fileName: data.fileName,
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not upload file — file storage may not be configured yet');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="border-t border-gray-100 bg-white p-3 sm:p-4">
      {disabled && (
        <div className="bg-warmth-50 text-warmth-700 text-xs font-medium rounded-card px-3 py-2 mb-2.5">
          {disabledReason || 'This teacher is currently outside office hours. Your message will be queued.'}
        </div>
      )}

      {showEmoji && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-1.5 mb-2 bg-paper-flat rounded-card p-2"
        >
          {QUICK_EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => { setValue((v) => v + e); setShowEmoji(false); }}
              className="text-lg hover:scale-125 transition-transform"
            >
              {e}
            </button>
          ))}
        </motion.div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2.5 text-ink-faint hover:text-brand hover:bg-brand-50 rounded-card transition-colors disabled:opacity-50"
            aria-label="Attach file"
          >
            {uploading ? <Loader2 size={19} className="animate-spin" /> : <Paperclip size={19} />}
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

          <button
            onClick={onOpenWhiteboard}
            className="p-2.5 text-ink-faint hover:text-brand hover:bg-brand-50 rounded-card transition-colors"
            aria-label="Open whiteboard"
          >
            <PenTool size={19} />
          </button>

          <button
            onClick={() => setShowEmoji((s) => !s)}
            className="p-2.5 text-ink-faint hover:text-brand hover:bg-brand-50 rounded-card transition-colors hidden sm:block"
            aria-label="Add emoji"
          >
            <Smile size={19} />
          </button>
        </div>

        <textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={1}
          className="flex-1 resize-none rounded-input border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand max-h-32"
          style={{ minHeight: '44px' }}
        />

        <Button onClick={handleSend} disabled={!value.trim()} className="!rounded-full !p-3" aria-label="Send message">
          <Send size={17} />
        </Button>
      </div>
    </div>
  );
}
