import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // BlackRent brand colors from Figma - presné hodnoty
        'blackrent': {
          'dark': '#05050A',
          'surface': '#0F0F14',
          'card': '#141419',
          'card-hover': '#1E1E23',
          'accent': '#F0FF98',
          'green': '#D7FF14',
          'green-dark': '#141900',
          'green-text': '#283002',
          'white-1000': '#FFFFFF',
          'white-800': '#FAFAFF',
          'text-primary': '#FAFAFF',
          'text-secondary': '#BEBEC3',
          'text-muted': '#646469',
          'text-dark': '#3C3C41',
          'white': '#FFFFFF',
          'gray': '#A0A0A5',
          'border': '#37373C',
          'yellow-light': '#FAFFDC',
          'yellow-bg': '#E4FF56',
          'success': '#3CEB82',
          'highlight': '#8CA40C',
          'bg-secondary': '#28282D',
          'text-light': '#55555A',
          'yellow-accent': '#F8FFC4',
        }
      },
      fontFamily: {
        'sf-pro': ['SF Pro', 'system-ui', 'sans-serif'],
        'poppins': ['Poppins', 'system-ui', 'sans-serif'],
        'sans': ['Poppins', 'SF Pro', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '24px' }],
        'sm': ['14px', { lineHeight: '24px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '18px' }],
        'xl': ['20px', { lineHeight: '24px' }],
        '2xl': ['24px', { lineHeight: '28px' }],
        '3xl': ['32px', { lineHeight: '24px' }],
        '4xl': ['40px', { lineHeight: '24px' }],
        '5xl': ['48px', { lineHeight: '52px' }],
        '6xl': ['56px', { lineHeight: '64px' }],
      },
      fontWeight: {
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '650',
        'extrabold': '870',
      },
      borderRadius: {
        '3xl': '24px',
      },
      spacing: {
        // custom pixel-precise tokens synced from Figma
        'px2': '2px',
        '14': '14px',
        '28': '112px',
        '31': '31px',
        '168': '168px',
        '200': '200px',
        '232': '232px',
        '304': '304px',
        '360': '360px',
        '422': '422px',
        '536': '536px',
        '1102': '1102px',
        '1328': '1328px',
        '1728': '1728px',
        '1760': '1760px',
      },
      width: {
        '104': '104px',
        '144': '144px',
        '184': '184px',
        '232': '232px',
        '308': '308px',
        '360': '360px',
        '422': '422px',
        '536': '536px',
        '1102': '1102px',
        '1328': '1328px',
        '1728': '1728px',
        '1760': '1760px',
      },
      maxWidth: {
        '1728': '1728px',
        '1760': '1760px',
      },
      height: {
        '104': '104px',
        '144': '144px',
        '184': '184px',
        '232': '232px',
        '384': '384px',
        '424': '424px',
        '536': '536px',
      },
      keyframes: {
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' }
        }
      },
      animation: {
        scroll: 'scroll 30s linear infinite'
      },
      boxShadow: {
        'review': '0px 32px 64px rgba(8,8,12,0.2), 0px 16px 32px rgba(8,8,12,0.1)',
        'bubble': '0px 4px 16px rgba(230,230,234,1)'
      }
    },
  },
  plugins: [],
}

export default config