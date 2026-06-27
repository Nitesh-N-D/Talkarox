import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/common/Button';
import Logo from '../components/common/Logo';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-paper text-center">
      <Logo className="mb-10" />
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-display text-7xl font-extrabold text-brand-100 mb-2">404</p>
        <h1 className="text-2xl font-extrabold text-ink mb-2">This page wandered off</h1>
        <p className="text-ink-mute mb-7 max-w-sm mx-auto">
          The page you're looking for doesn't exist, or may have moved.
        </p>
        <Link to="/dashboard"><Button>Back to dashboard</Button></Link>
      </motion.div>
    </div>
  );
}
