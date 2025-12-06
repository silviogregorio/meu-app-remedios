/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            },
            colors: {
                primary: {
                    DEFAULT: '#0f766e', // Teal 700
                    light: '#ccfbf1',   // Teal 100
                    dark: '#0d9488',    // Teal 600
                },
                secondary: {
                    DEFAULT: '#64748b', // Slate 500
                    light: '#f8fafc',   // Slate 50
                },
                danger: '#f43f5e',    // Rose 500
                surface: '#ffffff',
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
                '3xl': '2rem',
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                'glow': '0 0 15px rgba(15, 118, 110, 0.3)',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                'fade-in-up': {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' },
                },
                heartbeat: {
                    '0%, 100%': { transform: 'scale(1)' },
                    '10%': { transform: 'scale(1.1)' },
                    '20%': { transform: 'scale(1)' },
                },
                marquee: {
                    '0%': { transform: 'translateX(0%)' },
                    '100%': { transform: 'translateX(-100%)' },
                },
                'float-complex': {
                    '0%, 100%': { transform: 'translateY(0) translateX(0)' },
                    '25%': { transform: 'translateY(-5px) translateX(5px)' },
                    '50%': { transform: 'translateY(-10px) translateX(0)' },
                    '75%': { transform: 'translateY(-5px) translateX(-5px)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-1000px 0' },
                    '100%': { backgroundPosition: '1000px 0' },
                },
            },
            animation: {
                float: 'float 6s ease-in-out infinite',
                'float-complex': 'float-complex 8s ease-in-out infinite',
                'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
                blob: 'blob 7s infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'heartbeat': 'heartbeat 3s ease-in-out infinite',
                marquee: 'marquee 25s linear infinite',
                shimmer: 'shimmer 2.5s infinite linear',
            }
        },
    },
    plugins: [],
}
