/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'selector',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-bright': 'rgb(var(--surface-bright) / <alpha-value>)',
        'surface-container-lowest': 'rgb(var(--surface-container-lowest) / <alpha-value>)',
        'surface-container-low': 'rgb(var(--surface-container-low) / <alpha-value>)',
        'surface-container': 'rgb(var(--surface-container) / <alpha-value>)',
        'surface-container-high': 'rgb(var(--surface-container-high) / <alpha-value>)',
        'surface-container-highest': 'rgb(var(--surface-container-highest) / <alpha-value>)',
        'surface-variant': 'rgb(var(--surface-variant) / <alpha-value>)',
        outline: 'rgb(var(--outline) / <alpha-value>)',
        'outline-variant': 'rgb(var(--outline-variant) / <alpha-value>)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        'primary-container': 'rgb(var(--primary-container) / <alpha-value>)',
        'primary-fixed': 'rgb(var(--primary-fixed) / <alpha-value>)',
        secondary: 'rgb(var(--secondary) / <alpha-value>)',
        'secondary-container': 'rgb(var(--secondary-container) / <alpha-value>)',
        tertiary: 'rgb(var(--tertiary) / <alpha-value>)',
        'tertiary-container': 'rgb(var(--tertiary-container) / <alpha-value>)',
        'tertiary-fixed': 'rgb(var(--tertiary-fixed) / <alpha-value>)',
        'on-surface': 'rgb(var(--on-surface) / <alpha-value>)',
        'on-surface-variant': 'rgb(var(--on-surface-variant) / <alpha-value>)',
        'on-primary': 'rgb(var(--on-primary) / <alpha-value>)',
        error: 'rgb(var(--error) / <alpha-value>)',
        'error-container': 'rgb(var(--error-container) / <alpha-value>)',
      },
      borderRadius: {
        xxl: '1rem',
      },
      boxShadow: {
        soft: '0 8px 24px rgb(15 23 42 / 0.05)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      maxWidth: {
        shell: '1440px',
      },
      spacing: {
        sidebar: '240px',
      },
    },
  },
  plugins: [],
}
