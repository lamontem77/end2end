/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0F0F0F',
        surface: '#1A1A1A',
        'surface-elevated': '#242424',
        border: '#2E2E2E',
        'text-primary': '#F0F0F0',
        'text-secondary': '#8A8A8A',
        'text-muted': '#4A4A4A',
        accent: '#6C63FF',
        'accent-hover': '#8B85FF',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        'tag-blue': '#3B82F6',
        'tag-purple': '#8B5CF6',
        'tag-gray': '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        caption: '12px',
        meta: '13px',
        body: '14px',
        label: '16px',
        subhead: '20px',
        heading: '28px',
      },
      borderRadius: {
        card: '8px',
        button: '6px',
        tag: '4px',
        modal: '12px',
      },
      transitionDuration: {
        micro: '150ms',
        panel: '250ms',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}
