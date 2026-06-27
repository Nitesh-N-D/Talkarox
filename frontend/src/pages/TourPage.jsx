import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageCircle, CalendarClock, Languages } from 'lucide-react';
import Button from '../components/common/Button';
import Logo from '../components/common/Logo';

const SLIDES = [
  {
    icon: Sparkles,
    title: 'Watch for the breathing pulse',
    desc: 'A soft glow around an avatar means someone is online right now. No more guessing if a teacher is free.',
    color: 'grow',
  },
  {
    icon: MessageCircle,
    title: 'Messages sort themselves',
    desc: 'Academic questions, urgent notes, and homework help all get tagged automatically, so nothing gets lost.',
    color: 'brand',
  },
  {
    icon: CalendarClock,
    title: 'Office hours are visible to everyone',
    desc: 'See exactly when a teacher is reachable, and book a meeting in a couple of taps.',
    color: 'warmth',
  },
  {
    icon: Languages,
    title: 'Read in your language',
    desc: 'Tap "translate" on any message to read it the way you\u2019re most comfortable.',
    color: 'brand',
  },
];

export default function TourPage() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];

  const next = () => {
    if (index < SLIDES.length - 1) setIndex(index + 1);
    else navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-6">
      <div className="mb-10"><Logo /></div>

      <div className="w-full max-w-sm text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35 }}
          >
            <div className={`w-20 h-20 rounded-full bg-${slide.color}-50 flex items-center justify-center mx-auto mb-7`}>
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <slide.icon size={34} className={`text-${slide.color}-600`} />
              </motion.div>
            </div>
            <h2 className="text-2xl font-extrabold text-ink mb-3">{slide.title}</h2>
            <p className="text-ink-mute leading-relaxed">{slide.desc}</p>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-center gap-1.5 mt-8 mb-8">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-brand' : 'w-1.5 bg-gray-300'}`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} fullWidth>
            Skip
          </Button>
          <Button onClick={next} fullWidth>
            {index === SLIDES.length - 1 ? 'Go to dashboard' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
