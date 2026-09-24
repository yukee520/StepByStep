/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Neon palette — cyan primary
        primary: '#00E5FF',
        'primary-dark': '#00B8CC',
        'primary-glow': '#7DF9FF',

        // Secondary/accent colors used by arrows
        neon: {
          cyan: '#00E5FF',
          pink: '#FF3366',
          green: '#00FF88',
          yellow: '#FFD500',
          purple: '#A855F7',
          magenta: '#FF10F0',
        },

        // Screen backgrounds
        background: '#0A0118',
        surface: '#150829',
        'surface-elevated': '#1F0F3A',
        card: '#1A0B2E',
        border: '#2D1B4E',
        'border-bright': '#4A2C7A',

        // Text
        text: '#F5F0FF',
        'text-dim': '#B8A9D4',
        muted: '#7B6BA0',
        subtle: '#4A3D68',

        // Status colors
        danger: '#FF3B5C',
        warning: '#FFB020',
        success: '#22DD88',
        perfect: '#FFD500',
        great: '#22DD88',
        good: '#00E5FF',
        miss: '#FF3B5C',

        // Dark-variant aliases (kept so existing className references work)
        dark: {
          background: '#0A0118',
          card: '#1A0B2E',
          text: '#F5F0FF',
          muted: '#7B6BA0',
          border: '#2D1B4E',
        },
      },
      fontFamily: {
        // Left as system default; can be swapped for a custom font later
        sans: ['System'],
      },
    },
  },
  plugins: [],
};