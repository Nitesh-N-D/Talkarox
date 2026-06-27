import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageCircle, Shield, Languages, CalendarClock, Sparkles,
  Users, Megaphone, TrendingUp, PenTool, Award, ArrowRight, Check,
} from 'lucide-react';
import Logo from '../components/common/Logo';
import Button from '../components/common/Button';
import { Card } from '../components/common/Primitives';
import ConversationIllustration from '../components/illustrations/ConversationIllustration';
import PresenceAvatar from '../components/common/PresenceAvatar';

const FEATURES = [
  { icon: Sparkles, title: 'Breathing presence', desc: 'See who\u2019s online at a glance with our signature pulse animation \u2014 no guessing if a teacher is free.', color: 'grow' },
  { icon: MessageCircle, title: 'AI message sorting', desc: 'Every message is tagged Academic, Urgent, Admin, or Homework Help automatically.', color: 'brand' },
  { icon: CalendarClock, title: 'Office hours, visualized', desc: 'Teachers set their windows once. Parents see exactly when it\u2019s a good time to write in.', color: 'warmth' },
  { icon: Users, title: 'Threaded by student', desc: 'Every message about one child lives in one place \u2014 no more digging through old emails.', color: 'brand' },
  { icon: PenTool, title: 'Quick whiteboard', desc: 'Sketch out a math problem or a diagram right inside the chat. Saves automatically.', color: 'grow' },
  { icon: Languages, title: 'Auto-translation', desc: 'Teachers write in English; parents read in Tamil, Hindi, or whatever they\u2019re comfortable in.', color: 'warmth' },
  { icon: TrendingUp, title: 'Response transparency', desc: '\u201cTypically replies in 2 hours\u201d \u2014 set expectations, build trust, no shaming.', color: 'brand' },
  { icon: Megaphone, title: 'Emergency broadcast', desc: 'One click reaches every parent and teacher in the school, instantly.', color: 'grow' },
  { icon: Award, title: 'Weekly digest', desc: 'Every Friday: what got asked, what got answered, who\u2019s been most responsive.', color: 'warmth' },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-paper">
      <SEOHead />

      {/* Nav */}
      <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur-md border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-ink-mute">
            <a href="#features" className="hover:text-ink transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-ink transition-colors">How it works</a>
            <a href="#faq" className="hover:text-ink transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-ink-soft hover:text-brand transition-colors px-2">
              Sign in
            </Link>
            <Link to="/register">
              <Button size="sm">Get started free</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pt-16 pb-20 md:pt-24 md:pb-28 grid md:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <Sparkles size={14} /> Built for schools, free to start
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.1] text-ink mb-5">
            Teachers and parents, talking safely <span className="text-brand">without sharing numbers.</span>
          </h1>
          <p className="text-lg text-ink-mute mb-8 max-w-md">
            Talkarox replaces personal phone numbers with a professional, AI-organized messaging
            platform built specifically for schools. Private, structured, and genuinely pleasant to use.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/register">
              <Button size="lg" icon={ArrowRight} iconPosition="right">Start free for your school</Button>
            </Link>
            <a href="#how-it-works" className="text-sm font-semibold text-ink-soft hover:text-brand transition-colors">
              See how it works
            </a>
          </div>
          <div className="flex items-center gap-3 mt-8 text-sm text-ink-faint">
            <div className="flex -space-x-2">
              <PresenceAvatar name="Anita Sharma" userId="demo1" status="ONLINE" size="sm" />
              <PresenceAvatar name="Ravi Kumar" userId="demo2" status="TEACHING" size="sm" />
              <PresenceAvatar name="Meera Joseph" userId="demo3" status="OFFICE_HOURS" size="sm" />
            </div>
            <span>Trusted by teachers who used to share their personal numbers</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative"
        >
          <ConversationIllustration className="w-full max-w-lg mx-auto drop-shadow-xl" />
        </motion.div>
      </section>

      {/* Logos / trust strip */}
      <section className="border-y border-gray-100 bg-white py-6">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-ink-faint font-medium">
          <span>Zero cost to schools</span>
          <span className="hidden sm:inline">\u00b7</span>
          <span>No personal numbers shared, ever</span>
          <span className="hidden sm:inline">\u00b7</span>
          <span>Works in 10+ languages</span>
          <span className="hidden sm:inline">\u00b7</span>
          <span>Set up in under 10 minutes</span>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="max-w-7xl mx-auto px-5 sm:px-8 py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold text-ink mb-4">Everything a school communication tool should have, finally</h2>
          <p className="text-ink-mute text-lg">No paid add-ons. No enterprise sales calls. Just the features schools actually asked for.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
            >
              <Card hover className="h-full">
                <div className={`w-11 h-11 rounded-card flex items-center justify-center mb-4 bg-${f.color}-50`}>
                  <f.icon size={20} className={`text-${f.color}-600`} strokeWidth={2.2} />
                </div>
                <h3 className="font-display font-bold text-ink mb-1.5">{f.title}</h3>
                <p className="text-sm text-ink-mute leading-relaxed">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white border-y border-gray-100 py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-ink mb-4">Up and running before lunch</h2>
            <p className="text-ink-mute text-lg">No IT department required.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Create your school', desc: 'Add your school name, upload a logo, and invite teachers by email.' },
              { step: '2', title: 'Teachers set office hours', desc: 'Each teacher defines when they\u2019re reachable. Parents see this instantly.' },
              { step: '3', title: 'Parents start messaging', desc: 'Parents find their child\u2019s teacher and start a private, professional thread.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand to-grow text-white font-display font-bold flex items-center justify-center mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-display font-bold text-ink mb-2">{s.title}</h3>
                <p className="text-sm text-ink-mute">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-5 sm:px-8 py-20 md:py-28">
        <h2 className="text-3xl font-extrabold text-ink mb-10 text-center">Questions, answered</h2>
        <div className="space-y-3">
          {[
            { q: 'Is Talkarox really free?', a: 'Yes. Every core feature \u2014 messaging, office hours, AI categorization, translation \u2014 is free for schools. We may introduce an optional paid tier for very large schools later, but the free tier stays free.' },
            { q: 'Do teachers ever have to share their personal number?', a: 'No. That\u2019s the entire premise. All communication happens inside Talkarox, and personal contact details are never stored or exposed.' },
            { q: 'What languages does translation support?', a: 'Messages can be translated between English and most major Indian and global languages, including Tamil, Hindi, Telugu, and Spanish.' },
            { q: 'How is student data kept private?', a: 'Conversations are only visible to the people directly involved \u2014 the relevant teacher, parent, and student. Admins can see school-wide announcements but not private message content.' },
          ].map((item) => (
            <Card key={item.q} className="cursor-pointer" onClick={() => setOpenFaq(openFaq === item.q ? null : item.q)}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-ink">{item.q}</h3>
                <motion.span animate={{ rotate: openFaq === item.q ? 45 : 0 }} className="text-2xl text-ink-faint leading-none">+</motion.span>
              </div>
              <motion.div
                initial={false}
                animate={{ height: openFaq === item.q ? 'auto' : 0, opacity: openFaq === item.q ? 1 : 0 }}
                className="overflow-hidden"
              >
                <p className="text-sm text-ink-mute pt-3">{item.a}</p>
              </motion.div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-24">
        <div className="bg-gradient-to-br from-brand to-grow rounded-card p-10 md:p-14 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Give your teachers their privacy back</h2>
          <p className="text-white/85 text-lg mb-8 max-w-xl mx-auto">Set up your school in minutes. No credit card, no IT ticket, no catch.</p>
          <Link to="/register">
            <Button size="lg" variant="outline" className="!bg-white !text-brand !border-white hover:!bg-paper-flat">
              <Check size={18} /> Create your school for free
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-sm text-ink-faint">© {new Date().getFullYear()} Talkarox. Built for schools, not boardrooms.</p>
        </div>
      </footer>
    </div>
  );
}

function SEOHead() {
  return null; // Meta tags are set in index.html + react-helmet alternative below if needed
}
