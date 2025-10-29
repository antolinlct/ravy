/** @type {import('tailwindcss').Config} */

export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}', // adapte selon ton stack
    './index.html',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#108FFF',
        primaryLight: 'rgba(16, 143, 255, 0.15)',
        secondary: '#ACD3FD',

        background: '#FFFFFF',
        surface: '#FAFAFA',
        'surface-blue': '#F6F8FF',

        border: '#EAEAEA',

        warning: '#FF0000',
        'warning-light': 'rgba(255, 0, 0, 0.10)',

        success: '#46C954',
        'success-light': 'rgba(70, 201, 84, 0.15)',

        dark: '#202633',
        gray: '#8492A5',

        'gradient-start': '#233DFF',
        'gradient-middle': '#108FFF',
        'gradient-end': '#00D1FF',
      },
      fontFamily: {
        poppins: 'Poppins',
        funnel: '"Funnel Display"',
      },
      fontSize: {
        header1: ['1.625rem', {
          lineHeight: '2rem',
          fontFamily: '"Funnel Display"',
          fontWeight: '500',
        }],
        header2: ['1.125rem', {
          lineHeight: '1.5rem',
          fontFamily: '"Funnel Display"',
          fontWeight: '500',
        }],
        header3: ['1rem', {
          lineHeight: '1.5rem',
          fontFamily: 'Poppins',
          fontWeight: '500',
        }],
        header4: ['1rem', {
          lineHeight: '1.5rem',
          fontFamily: 'Poppins',
          fontWeight: '500',
        }],
        textXs: ['0.6875rem', {
          lineHeight: '0.875rem',
          fontFamily: 'Poppins',
          fontWeight: '400',
        }],
        textS: ['0.75rem', {
          lineHeight: '1rem',
          fontFamily: 'Poppins',
          fontWeight: '400',
        }],
        textM: ['0.875rem', {
          lineHeight: '1.25rem',
          fontFamily: 'Poppins',
          fontWeight: '400',
        }],
      },
      borderRadius: {
        sm: '5px',
        md: '10px',
        lg: '15px',
      },
      spacing: {
        xs: '4px',
        xsm: '5px',
        sm: '10px',
        md: '15px',
        lg: '20px',
      },
      keyframes: {
        fadeInRight: {
          '0%': { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeOutLeft: {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(-40px)' },
        },
      },
      animation: {
        fadeInRight: 'fadeInRight 0.4s ease-out forwards',
        fadeOutLeft: 'fadeOutLeft 0.4s ease-in forwards',
      },
    },
  },
}