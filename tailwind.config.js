/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'video-bg': '#0a0a0a',
                'call-green': '#10b981',
                'call-red': '#8B0000', // Dark red for call-related actions
                'dark-red': {
                    100: '#FFE6E6',
                    200: '#FFCCCC',
                    300: '#FF9999',
                    400: '#FF6666',
                    500: '#FF3333',
                    600: '#CC0000',
                    700: '#8B0000', // Dark red
                    800: '#660000',
                    900: '#330000'
                },
                'theme': {
                    'primary': '#8B0000', // Dark red
                    'secondary': '#121212', // Off black
                    'accent': '#F8F8F8', // Off white
                    'contrast': '#FFFFFF'  // White
                }
            },
            ringColor: {
                'blue': {
                    500: '#3b82f6',
                },
                'dark-red': {
                    700: '#8B0000'
                }
            },
            boxShadow: {
                'custom': '0 4px 6px -1px rgba(139, 0, 0, 0.1), 0 2px 4px -1px rgba(139, 0, 0, 0.06)',
                'custom-lg': '0 10px 15px -3px rgba(139, 0, 0, 0.1), 0 4px 6px -2px rgba(139, 0, 0, 0.05)'
            },
            fontFamily: {
                'sans': ['Inter', 'system-ui', 'sans-serif'],
                'heading': ['Poppins', 'sans-serif']
            }
        },
    },
    plugins: [],
}