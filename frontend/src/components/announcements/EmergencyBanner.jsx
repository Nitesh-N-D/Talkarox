import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { resolveEmergencyBroadcast } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function EmergencyBanner() {
  const { emergencyBroadcast, clearEmergencyBroadcast } = useUIStore();
  const user = useAuthStore((s) => s.user);

  if (!emergencyBroadcast) return null;

  const canResolve = user?.role === 'ADMIN';

  const handleResolve = async () => {
    try {
      await resolveEmergencyBroadcast(emergencyBroadcast.id);
      clearEmergencyBroadcast();
      toast.success('Emergency broadcast resolved.');
    } catch {
      toast.error('Could not resolve broadcast.');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="overflow-hidden"
      >
        <div className="bg-danger text-white px-4 sm:px-6 py-3 flex items-center gap-3">
          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
            <AlertTriangle size={20} />
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-tight truncate">{emergencyBroadcast.title}</p>
            <p className="text-sm text-white/90 truncate">{emergencyBroadcast.message}</p>
          </div>
          {canResolve && (
            <button
              onClick={handleResolve}
              className="flex-shrink-0 bg-white/15 hover:bg-white/25 text-xs font-semibold px-3 py-1.5 rounded-btn transition-colors"
            >
              Mark resolved
            </button>
          )}
          {!canResolve && (
            <button onClick={clearEmergencyBroadcast} className="flex-shrink-0 text-white/80 hover:text-white" aria-label="Dismiss">
              <X size={18} />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
