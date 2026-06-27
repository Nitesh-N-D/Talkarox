import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Send, PlayCircle, BookMarked, MessageSquarePlus, Loader2 } from 'lucide-react';
import { getHomeworkHelp } from '../../services/api';
import Button from '../common/Button';
import { Card } from '../common/Primitives';

export default function HomeworkHelperPanel({ onAskTeacher }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const { data } = await getHomeworkHelp(question);
      setResult(data);
    } catch {
      setResult({ error: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-card bg-warmth-50 flex items-center justify-center">
          <Lightbulb size={16} className="text-warmth-600" />
        </div>
        <div>
          <h3 className="font-display font-bold text-ink text-sm">Homework helper</h3>
          <p className="text-[11px] text-ink-faint">Suggests resources, not answers</p>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Describe the problem you're stuck on…"
          rows={2}
          className="flex-1 resize-none rounded-input border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </div>
      <Button size="sm" fullWidth onClick={handleAsk} loading={loading} icon={Send}>
        Get help
      </Button>

      <AnimatePresence>
        {result && !result.error && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3">
            <Card padding="p-3" className="bg-paper-flat border-0">
              <p className="text-xs text-ink-soft leading-relaxed">{result.summary}</p>
            </Card>

            {result.resources?.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-ink-mute mb-1.5 flex items-center gap-1">
                  <PlayCircle size={12} /> Tutorials worth watching
                </p>
                <ul className="space-y-1">
                  {result.resources.map((r, i) => (
                    <li key={i}>
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand hover:underline line-clamp-1">
                        {r.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.practiceProblems?.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-ink-mute mb-1.5 flex items-center gap-1">
                  <BookMarked size={12} /> Try these
                </p>
                <ul className="space-y-1 list-disc list-inside">
                  {result.practiceProblems.map((p, i) => (
                    <li key={i} className="text-xs text-ink-soft">{p}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => onAskTeacher?.(question)}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-brand border border-brand-200 rounded-card py-2 hover:bg-brand-50 transition-colors"
            >
              <MessageSquarePlus size={13} /> Ask my teacher to explain this tomorrow
            </button>
          </motion.div>
        )}
        {result?.error && (
          <p className="text-xs text-danger mt-3">Couldn't fetch help right now — try again in a moment.</p>
        )}
      </AnimatePresence>
    </div>
  );
}
