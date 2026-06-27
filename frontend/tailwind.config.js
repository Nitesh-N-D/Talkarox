/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0F172A',
          soft: '#1F2937',
          mute: '#6B7280',
          faint: '#9CA3AF',
        },
        paper: {
          DEFAULT: '#FCFBF8',
          flat: '#F9FAFB',
          card: '#FFFFFF',
        },
        brand: {
          DEFAULT: '#2563EB',
          50: '#EFF4FF',
          100: '#DBE8FE',
          200: '#BFD7FE',
          400: '#5587F5',
          600: '#2563EB',
          700: '#1D4ED8',
          900: '#1E3A8A',
        },
        grow: {
          DEFAULT: '#10B981',
          50: '#ECFDF5',
          100: '#D1FAE5',
          400: '#34D399',
          600: '#10B981',
          700: '#047857',
        },
        warmth: {
          DEFAULT: '#F59E0B',
          50: '#FFFBEB',
          100: '#FEF3C7',
          400: '#FBBF24',
          600: '#F59E0B',
          700: '#B45309',
        },
        danger: {
          DEFAULT: '#EF4444',
          50: '#FEF2F2',
          100: '#FEE2E2',
          600: '#EF4444',
          700: '#991B1B',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
        input: '4px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(15,23,42,0.06)',
        card: '0 1px 3px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.05)',
        lifted: '0 12px 24px rgba(15,23,42,0.10)',
        glowBrand: '0 0 0 4px rgba(37,99,235,0.12)',
        glowGrow: '0 0 0 4px rgba(16,185,129,0.14)',
      },
      spacing: {
        18: '4.5rem',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.35)', opacity: '0.35' },
        },
        breatheSlow: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.15)', opacity: '0.45' },
        },
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        breathe: 'breathe 2.5s ease-in-out infinite',
        breatheSlow: 'breatheSlow 3.4s ease-in-out infinite',
        riseIn: 'riseIn 0.4s cubic-bezier(0.16,1,0.3,1) both',
        slideInRight: 'slideInRight 0.35s cubic-bezier(0.16,1,0.3,1) both',
        shimmer: 'shimmer 1.6s linear infinite',
        popIn: 'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
      },
    },
  },
  plugins: [],
}
