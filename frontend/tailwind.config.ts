import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        // Enhanced color system using CSS variables with oklch() already defined
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)'
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)'
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)'
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)'
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)'
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)'
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)'
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        chart: {
          '1': 'var(--chart-1)',
          '2': 'var(--chart-2)',
          '3': 'var(--chart-3)',
          '4': 'var(--chart-4)',
          '5': 'var(--chart-5)'
        },
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
          primary: 'var(--sidebar-primary)',
          'primary-foreground': 'var(--sidebar-primary-foreground)',
          accent: 'var(--sidebar-accent)',
          'accent-foreground': 'var(--sidebar-accent-foreground)',
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
        '3xl': 'calc(var(--radius) + 12px)'
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem'
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '3.5rem' }],
        '6xl': ['3.75rem', { lineHeight: '4rem' }],
        '7xl': ['4.5rem', { lineHeight: '5rem' }],
        '8xl': ['6rem', { lineHeight: '6.5rem' }],
        '9xl': ['8rem', { lineHeight: '8.5rem' }]
      },
      screens: {
        'xs': '475px',
        '3xl': '1600px',
        '4xl': '1920px'
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100'
      },
      backdropBlur: {
        xs: '2px',
        '3xl': '64px'
      },
      keyframes: {
        // Existing accordion animations
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        
        // Enhanced animation library
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 20px oklch(0.4 0.25 280 / 0.3)' },
          '50%': { boxShadow: '0 0 30px oklch(0.4 0.25 280 / 0.6)' }
        },
        'slideIn': {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'fadeIn': {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        'slideUp': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'slideDown': {
          from: { opacity: '0', transform: 'translateY(-20px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'slideLeft': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' }
        },
        'slideRight': {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' }
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        'bounce-gentle': {
          '0%, 20%, 53%, 80%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '40%, 43%': { transform: 'translate3d(0, -8px, 0)' },
          '70%': { transform: 'translate3d(0, -4px, 0)' },
          '90%': { transform: 'translate3d(0, -2px, 0)' }
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to: { opacity: '1', transform: 'scale(1)' }
        },
        'scale-out': {
          from: { opacity: '1', transform: 'scale(1)' },
          to: { opacity: '0', transform: 'scale(0.9)' }
        },
        // Additional animations from hackx-platform
        'navGlow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)' }
        },
        'morphBorder': {
          '0%, 100%': { borderRadius: '2rem' },
          '50%': { borderRadius: '1rem' }
        },
        'fadeInBlur': {
          '0%': { opacity: '0', filter: 'blur(4px)' },
          '100%': { opacity: '1', filter: 'blur(0)' }
        },
        'fade-in-blur': {
          from: { opacity: '0', filter: 'blur(10px)' },
          to: { opacity: '1', filter: 'blur(0px)' }
        }
      },
      animation: {
        // Existing animations
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        
        // Enhanced animation system
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'slide-down': 'slideDown 0.6s ease-out',
        'slide-left': 'slideLeft 0.6s ease-out',
        'slide-right': 'slideRight 0.6s ease-out',
        'pulse-slow': 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
        'shimmer': 'shimmer 2s infinite',
        'bounce-gentle': 'bounce-gentle 1s infinite',
        'scale-in': 'scale-in 0.3s ease-out',
        'scale-out': 'scale-out 0.3s ease-in',
        
        // Staggered animations (delays can be applied via style)
        'slide-up-delay-100': 'slideUp 0.6s ease-out 0.1s both',
        'slide-up-delay-200': 'slideUp 0.6s ease-out 0.2s both',
        'slide-up-delay-300': 'slideUp 0.6s ease-out 0.3s both',
        'slide-up-delay-500': 'slideUp 0.6s ease-out 0.5s both',
        
        // Additional animations from hackx-platform
        'nav-glow': 'navGlow 3s ease-in-out infinite',
        'morph-border': 'morphBorder 4s ease-in-out infinite',
        'fade-in-blur': 'fadeInBlur 0.8s ease-out'
      },
      transitionDuration: {
        '0': '0ms',
        '2000': '2000ms',
        '3000': '3000ms',
        '4000': '4000ms',
        '5000': '5000ms'
      },
      transitionDelay: {
        '0': '0ms',
        '2000': '2000ms',
        '3000': '3000ms',
        '4000': '4000ms',
        '5000': '5000ms'
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'glass-dark': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'glow': '0 0 20px oklch(0.4 0.25 280 / 0.3)',
        'glow-lg': '0 0 30px oklch(0.4 0.25 280 / 0.4)',
        'glow-xl': '0 0 40px oklch(0.4 0.25 280 / 0.5)',
        'inner-glow': 'inset 0 0 20px oklch(0.4 0.25 280 / 0.2)',
        '3xl': '0 35px 60px -12px rgba(0, 0, 0, 0.25)',
        '4xl': '0 45px 80px -15px rgba(0, 0, 0, 0.3)'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-mesh': `
          radial-gradient(at 40% 20%, oklch(0.4 0.25 280 / 0.3) 0px, transparent 50%),
          radial-gradient(at 80% 0%, oklch(0.6 0.15 160 / 0.3) 0px, transparent 50%),
          radial-gradient(at 0% 50%, oklch(0.55 0.2 260 / 0.3) 0px, transparent 50%),
          radial-gradient(at 80% 50%, oklch(0.75 0.15 85 / 0.3) 0px, transparent 50%),
          radial-gradient(at 0% 100%, oklch(0.55 0.25 25 / 0.3) 0px, transparent 50%),
          radial-gradient(at 80% 100%, oklch(0.4 0.25 280 / 0.3) 0px, transparent 50%),
          radial-gradient(at 0% 0%, oklch(0.6 0.15 160 / 0.3) 0px, transparent 50%)
        `
      },
    }
  },
  plugins: [
    require("tailwindcss-animate")
  ],
};

export default config;
