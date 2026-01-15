/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './js/**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        monitor: {
          bg: '#181818',
          panel: '#1a1a1a',
          card: '#222222',
          border: '#333333',
          accent: '#00ff00',
          text: '#ffffff'
        },
        wave: {
          ecg: '#00FF00',
          abp: '#FF0000',
          pleth: '#82CEFC',
          cvp: '#FAA804',
          eeg: '#DAA2DC',
          resp: '#FFFF00',
          co2: '#00FFFF',
          agent: '#FF69B4',
          bis: '#FFA500',
          entropy: '#9370DB',
          temp: '#FFD700',
          nibp: '#FF6347'
        }
      },
      fontFamily: {
        mono: ['Consolas', 'Monaco', 'Courier New', 'monospace']
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.3s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        }
      }
    }
  },
  plugins: []
};
