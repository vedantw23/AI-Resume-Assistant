import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
        },
        background: '#F8FAFC',
        card: '#FFFFFF',
        text: {
          primary: '#111827',
          secondary: '#6B7280',
        },
        border: '#E5E7EB',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      boxShadow: {
        soft: '0 20px 60px rgba(15, 23, 42, 0.08)',
      },
      borderRadius: {
        xl2: '1.125rem',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.45s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
