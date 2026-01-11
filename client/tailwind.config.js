/** @type {import('tailwindcss').Config} */

/**
 * GOLDEN RATIO DESIGN SYSTEM
 * φ (phi) = 1.618033988749895
 * 
 * Golden Ratio Multipliers:
 * φ⁻³ = 0.236    φ⁰ = 1.000    φ³ = 4.236
 * φ⁻² = 0.382    φ¹ = 1.618    φ⁴ = 6.854
 * φ⁻¹ = 0.618    φ² = 2.618    φ⁵ = 11.09
 */

const phi = 1.618033988749895;

// Generate Golden Ratio scale
const goldenScale = (base, power) => base * Math.pow(phi, power);

export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            // Premium Typography with Golden Ratio
            fontFamily: {
                'display': ['Outfit', 'system-ui', 'sans-serif'],
                'body': ['Inter', 'system-ui', 'sans-serif'],
            },

            // Golden Ratio Typography Scale (base: 16px)
            fontSize: {
                // φ⁻² scale (smaller)
                'phi-xs': [`${(16 * 0.382).toFixed(2)}px`, { lineHeight: '1.618' }],     // ~6px
                'phi-sm': [`${(16 * 0.618).toFixed(2)}px`, { lineHeight: '1.618' }],     // ~10px
                // Base scale
                'phi-base': ['16px', { lineHeight: '1.618' }],                            // 16px
                // φ¹ scale (larger)
                'phi-md': [`${(16 * 1.272).toFixed(2)}px`, { lineHeight: '1.5' }],       // ~20px (√φ)
                'phi-lg': [`${(16 * 1.618).toFixed(2)}px`, { lineHeight: '1.5' }],       // ~26px (φ)
                'phi-xl': [`${(16 * 2.058).toFixed(2)}px`, { lineHeight: '1.4' }],       // ~33px (φ^1.5)
                'phi-2xl': [`${(16 * 2.618).toFixed(2)}px`, { lineHeight: '1.3' }],      // ~42px (φ²)
                'phi-3xl': [`${(16 * 3.236).toFixed(2)}px`, { lineHeight: '1.2' }],      // ~52px
                'phi-4xl': [`${(16 * 4.236).toFixed(2)}px`, { lineHeight: '1.2' }],      // ~68px (φ³)
                'phi-5xl': [`${(16 * 5.236).toFixed(2)}px`, { lineHeight: '1.1' }],      // ~84px
                'phi-6xl': [`${(16 * 6.854).toFixed(2)}px`, { lineHeight: '1.1' }],      // ~110px (φ⁴)
                'phi-7xl': [`${(16 * 8.472).toFixed(2)}px`, { lineHeight: '1.0' }],      // ~136px
                'phi-8xl': [`${(16 * 11.09).toFixed(2)}px`, { lineHeight: '1.0' }],      // ~177px (φ⁵)
            },

            // Golden Ratio Spacing System (base: 1rem = 16px)
            spacing: {
                // Micro spacing (φ⁻ⁿ)
                'phi-0': '0px',
                'phi-px': '1px',
                'phi-0.5': `${(1 * 0.146).toFixed(3)}rem`,   // ~2.3px (φ⁻⁴)
                'phi-1': `${(1 * 0.236).toFixed(3)}rem`,     // ~3.8px (φ⁻³)
                'phi-2': `${(1 * 0.382).toFixed(3)}rem`,     // ~6.1px (φ⁻²)
                'phi-3': `${(1 * 0.618).toFixed(3)}rem`,     // ~9.9px (φ⁻¹)

                // Base spacing
                'phi-4': '1rem',                              // 16px (φ⁰)

                // Larger spacing (φⁿ)
                'phi-5': `${(1 * 1.618).toFixed(3)}rem`,     // ~25.9px (φ¹)
                'phi-6': `${(1 * 2.618).toFixed(3)}rem`,     // ~41.9px (φ²)
                'phi-7': `${(1 * 4.236).toFixed(3)}rem`,     // ~67.8px (φ³)
                'phi-8': `${(1 * 6.854).toFixed(3)}rem`,     // ~109.7px (φ⁴)
                'phi-9': `${(1 * 11.09).toFixed(3)}rem`,     // ~177.4px (φ⁵)
                'phi-10': `${(1 * 17.944).toFixed(3)}rem`,   // ~287.1px (φ⁶)

                // Golden Ratio percentages
                'phi-major': '61.8%',   // φ / (1 + φ) = 0.618
                'phi-minor': '38.2%',   // 1 / (1 + φ) = 0.382

                // Common Golden Ratio values in rem
                '0.382': '0.382rem',
                '0.618': '0.618rem',
                '1.618': '1.618rem',
                '2.618': '2.618rem',
                '4.236': '4.236rem',
                '6.854': '6.854rem',
            },

            // Golden Ratio Max Widths
            maxWidth: {
                'phi-xs': `${(16 * 20 * 0.618).toFixed(0)}px`,   // ~198px
                'phi-sm': `${(16 * 20).toFixed(0)}px`,            // 320px
                'phi-md': `${(16 * 20 * 1.618).toFixed(0)}px`,   // ~518px
                'phi-lg': `${(16 * 20 * 2.618).toFixed(0)}px`,   // ~838px
                'phi-xl': `${(16 * 20 * 4.236).toFixed(0)}px`,   // ~1355px
                'phi-2xl': `${(16 * 20 * 6.854).toFixed(0)}px`,  // ~2193px
                'phi-content': '61.8%',
                'phi-sidebar': '38.2%',
            },

            // Golden Ratio Heights
            height: {
                'phi-screen': '61.8vh',
                'phi-screen-minor': '38.2vh',
                'phi-full': '100%',
            },

            minHeight: {
                'phi-screen': '61.8vh',
                'phi-screen-minor': '38.2vh',
            },

            // Golden Ratio Widths
            width: {
                'phi-major': '61.8%',
                'phi-minor': '38.2%',
                'phi-half': '50%',
            },

            // Golden Ratio Aspect Ratios
            aspectRatio: {
                'phi': '1.618 / 1',
                'phi-portrait': '1 / 1.618',
                'phi-wide': '2.618 / 1',
            },

            // Golden Ratio Border Radius
            borderRadius: {
                'phi-sm': `${(16 * 0.236).toFixed(2)}px`,    // ~3.8px
                'phi': `${(16 * 0.382).toFixed(2)}px`,       // ~6.1px
                'phi-md': `${(16 * 0.618).toFixed(2)}px`,    // ~9.9px
                'phi-lg': `${(16 * 1).toFixed(2)}px`,        // 16px
                'phi-xl': `${(16 * 1.618).toFixed(2)}px`,    // ~25.9px
                'phi-2xl': `${(16 * 2.618).toFixed(2)}px`,   // ~41.9px
                'phi-3xl': `${(16 * 4.236).toFixed(2)}px`,   // ~67.8px
            },

            // Enhanced Box Shadows with Golden Ratio blur/spread
            boxShadow: {
                'phi-sm': `0 ${1 * 0.618}px ${1 * 1.618}px rgba(0, 0, 0, 0.1)`,
                'phi': `0 ${1 * 1.618}px ${1 * 4.236}px rgba(0, 0, 0, 0.15)`,
                'phi-md': `0 ${1 * 2.618}px ${1 * 6.854}px rgba(0, 0, 0, 0.2)`,
                'phi-lg': `0 ${1 * 4.236}px ${1 * 11.09}px rgba(0, 0, 0, 0.25)`,
                'phi-xl': `0 ${1 * 6.854}px ${1 * 17.944}px rgba(0, 0, 0, 0.3)`,
                // Sustainable color glows
                'glow-primary': '0 0 40px rgba(5, 150, 105, 0.35)',      // Forest Green
                'glow-secondary': '0 0 40px rgba(217, 119, 6, 0.35)',   // Harvest Gold
                'glow-accent': '0 0 40px rgba(20, 184, 166, 0.35)',     // Natural Teal
                'glow-earth': '0 0 40px rgba(120, 53, 15, 0.35)',       // Earth Brown
                'card': '0 25px 60px -15px rgba(0, 0, 0, 0.6)',
            },

            // Sustainable Farming Color Palette
            colors: {
                // Deep Earth Background
                'brand-background': '#0c0f0a',
                'brand-surface': {
                    'DEFAULT': '#131a12',
                    'light': '#1a231a',
                    'lighter': '#232d22',
                    'lightest': '#2d3a2c',
                },
                // Forest Green (Growth & Sustainability)
                'brand-primary': {
                    'DEFAULT': '#059669',
                    'lightest': '#d1fae5',
                    'lighter': '#a7f3d0',
                    'light': '#10b981',
                    'dark': '#047857',
                    'darker': '#065f46',
                    'darkest': '#064e3b',
                    'deep': '#022c22',
                },
                // Harvest Gold (Prosperity & Abundance)
                'brand-secondary': {
                    'DEFAULT': '#d97706',
                    'lightest': '#fef3c7',
                    'lighter': '#fde68a',
                    'light': '#f59e0b',
                    'dark': '#b45309',
                    'darker': '#92400e',
                    'darkest': '#78350f',
                },
                // Natural Teal (Water & Freshness)
                'brand-accent': {
                    'DEFAULT': '#14b8a6',
                    'lightest': '#ccfbf1',
                    'lighter': '#99f6e4',
                    'light': '#2dd4bf',
                    'dark': '#0d9488',
                    'darker': '#0f766e',
                    'darkest': '#115e59',
                },
                // Earth Brown (Soil)
                'brand-earth': {
                    'DEFAULT': '#78350f',
                    'light': '#92400e',
                    'dark': '#451a03',
                },
                // Natural Text Colors
                'brand-text': {
                    'lightest': '#ffffff',
                    'light': '#ecfdf5',
                    'DEFAULT': '#a7f3d0',
                    'muted': '#6ee7b7',
                    'dark': '#34d399',
                    'darker': '#10b981',
                },
                'brand-success': '#22c55e',
                'brand-warning': '#f59e0b',
                'brand-error': '#dc2626',
                'brand-info': '#06b6d4',
            },

            // Golden Ratio Transitions (timing based on φ)
            transitionDuration: {
                'phi-fast': `${(100 * 1.618).toFixed(0)}ms`,     // ~162ms
                'phi': `${(100 * 2.618).toFixed(0)}ms`,          // ~262ms
                'phi-slow': `${(100 * 4.236).toFixed(0)}ms`,     // ~424ms
                'phi-slower': `${(100 * 6.854).toFixed(0)}ms`,   // ~685ms
            },

            transitionTimingFunction: {
                'phi': 'cubic-bezier(0.618, 0, 0.382, 1)',
                'phi-in': 'cubic-bezier(0.618, 0, 1, 1)',
                'phi-out': 'cubic-bezier(0, 0, 0.382, 1)',
                'phi-bounce': 'cubic-bezier(0.382, 1.618, 0.618, 1)',
            },

            // Golden Ratio Animations
            animation: {
                'float-phi': 'float-phi 6.18s ease-in-out infinite',
                'pulse-phi': 'pulse-phi 2.618s ease-in-out infinite',
                'glow-phi': 'glow-phi 1.618s ease-in-out infinite alternate',
                'gradient-phi': 'gradient-phi 16.18s ease infinite',
                'spin-phi': 'spin 16.18s linear infinite',
            },

            keyframes: {
                'float-phi': {
                    '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
                    '38.2%': { transform: 'translateY(-10px) rotate(1deg)' },
                    '61.8%': { transform: 'translateY(-20px) rotate(2deg)' },
                },
                'pulse-phi': {
                    '0%, 100%': { opacity: '1', transform: 'scale(1)' },
                    '38.2%': { opacity: '0.85', transform: 'scale(0.98)' },
                    '61.8%': { opacity: '0.7', transform: 'scale(0.96)' },
                },
                'glow-phi': {
                    'from': { boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)' },
                    'to': { boxShadow: '0 0 50px rgba(34, 197, 94, 0.5), 0 0 80px rgba(34, 197, 94, 0.2)' },
                },
                'gradient-phi': {
                    '0%': { backgroundPosition: '0% 50%' },
                    '38.2%': { backgroundPosition: '61.8% 50%' },
                    '61.8%': { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%' },
                },
            },

            // Grid with Golden Ratio
            gridTemplateColumns: {
                'phi': '61.8fr 38.2fr',
                'phi-reverse': '38.2fr 61.8fr',
                'phi-sidebar': '38.2% 1fr',
                'phi-content': '1fr 38.2%',
            },

            // Golden Ratio Gap
            gap: {
                'phi-1': '0.236rem',
                'phi-2': '0.382rem',
                'phi-3': '0.618rem',
                'phi-4': '1rem',
                'phi-5': '1.618rem',
                'phi-6': '2.618rem',
                'phi-7': '4.236rem',
            },

            // Background Gradients
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                // Nature-inspired hero gradient
                'hero-phi': 'linear-gradient(135deg, #047857 0%, #14b8a6 38.2%, #059669 61.8%, #065f46 100%)',
                // Sustainable mesh background
                'mesh-phi': `
                    radial-gradient(at 38.2% 38.2%, rgba(5, 150, 105, 0.15) 0px, transparent 50%),
                    radial-gradient(at 61.8% 0%, rgba(217, 119, 6, 0.1) 0px, transparent 50%),
                    radial-gradient(at 0% 61.8%, rgba(20, 184, 166, 0.1) 0px, transparent 50%),
                    radial-gradient(at 61.8% 61.8%, rgba(16, 185, 129, 0.08) 0px, transparent 50%)
                `,
                // Additional nature gradients
                'gradient-nature': 'linear-gradient(135deg, #059669 0%, #14b8a6 50%, #10b981 100%)',
                'gradient-earth': 'linear-gradient(135deg, #1a231a 0%, #0c0f0a 100%)',
                'gradient-harvest': 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
            },
        },
    },
    plugins: [],
}
