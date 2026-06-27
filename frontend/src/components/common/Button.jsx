import { motion } from 'framer-motion';
import clsx from 'clsx';

const VARIANTS = {
  primary: 'bg-brand text-white hover:bg-brand-700 shadow-sm',
  secondary: 'bg-grow text-white hover:bg-grow-700 shadow-sm',
  outline: 'bg-transparent border border-gray-300 text-ink hover:border-brand hover:text-brand',
  ghost: 'bg-transparent text-ink-mute hover:bg-paper-flat hover:text-ink',
  danger: 'bg-danger text-white hover:bg-danger-700 shadow-sm',
  gradient: 'text-white bg-gradient-to-r from-brand to-grow hover:brightness-110 shadow-card',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm rounded-btn',
  md: 'px-4 py-2.5 text-sm rounded-btn',
  lg: 'px-6 py-3 text-base rounded-btn',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <motion.button
      type={type}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <motion.span
          className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
        />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={17} strokeWidth={2.25} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon size={17} strokeWidth={2.25} />}
        </>
      )}
    </motion.button>
  );
}
