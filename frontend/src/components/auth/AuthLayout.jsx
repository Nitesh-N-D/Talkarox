import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../common/Logo';
import ConversationIllustration from '../illustrations/ConversationIllustration';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-paper">
      {/* Form side */}
      <div className="flex flex-col px-6 sm:px-10 py-8 md:py-12">
        <Link to="/">
          <Logo />
        </Link>

        <div className="flex-1 flex items-center justify-center py-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm"
          >
            <h1 className="text-2xl font-extrabold text-ink mb-1.5">{title}</h1>
            {subtitle && <p className="text-ink-mute text-sm mb-7">{subtitle}</p>}
            {children}
          </motion.div>
        </div>
      </div>

      {/* Illustration side */}
      <div className="hidden md:flex bg-gradient-to-br from-brand-50 via-paper to-grow-50 items-center justify-center p-12 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <ConversationIllustration className="w-full max-w-md drop-shadow-xl" />
        </motion.div>
        <div className="absolute bottom-12 left-12 right-12 text-center">
          <p className="text-ink-soft font-display font-semibold text-lg">
            "No more giving out my personal number. Parents reach me the right way now."
          </p>
          <p className="text-ink-faint text-sm mt-2">— A teacher, somewhere using Talkarox</p>
        </div>
      </div>
    </div>
  );
}
