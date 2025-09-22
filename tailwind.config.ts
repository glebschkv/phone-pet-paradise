import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			backgroundImage: {
				'gradient-hero': 'var(--gradient-hero)',
				'gradient-sky': 'var(--gradient-sky)',
				'gradient-platform': 'var(--gradient-platform)',
				'gradient-glass': 'var(--gradient-glass)',
				'gradient-accent': 'var(--gradient-accent)'
			},
			boxShadow: {
				'xs': 'var(--shadow-xs)',
				'sm': 'var(--shadow-sm)', 
				'md': 'var(--shadow-md)',
				'lg': 'var(--shadow-lg)',
				'xl': 'var(--shadow-xl)',
				'floating-soft': 'var(--shadow-floating-soft)',
				'tab-bar': 'var(--shadow-tab-bar)',
				'inner': 'var(--shadow-inner)'
			},
			transitionTimingFunction: {
				'smooth': 'var(--transition-smooth)',
				'spring': 'var(--transition-spring)',
				'bounce': 'var(--transition-bounce)',
				'ios': 'var(--transition-ios)'
			},
			spacing: {
				'safe': 'var(--safe-area-inset-top)',
				'safe-bottom': 'var(--safe-area-inset-bottom)'
			},
			padding: {
				'safe': 'var(--safe-area-inset-top)',
				'safe-bottom': 'var(--safe-area-inset-bottom)'
			},
			margin: {
				'safe': 'var(--safe-area-inset-top)',
				'safe-bottom': 'var(--safe-area-inset-bottom)'
			},
			backdropBlur: {
				'3xl': '64px'
			},
			fontFamily: {
				'sans': ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Inter', 'system-ui', 'sans-serif'],
				'sf-pro': ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'island-glow': {
					'0%, 100%': { boxShadow: 'var(--shadow-island)' },
					'50%': { boxShadow: 'var(--shadow-glow)' }
				},
				'pulse-slow': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.8' }
				},
				'bounce-subtle': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-2px)' }
				},
				'pixel-walk': {
					'0%': { transform: 'translateX(0px)' },
					'25%': { transform: 'translateX(0px) translateY(-1px)' },
					'50%': { transform: 'translateX(0px)' },
					'75%': { transform: 'translateX(0px) translateY(-1px)' },
					'100%': { transform: 'translateX(0px)' }
				},
				'drift-clouds': {
					'0%': { transform: 'translateX(-100px)' },
					'100%': { transform: 'translateX(100vw)' }
				},
				'parallax-slow': {
					'0%': { transform: 'translateX(-50px)' },
					'100%': { transform: 'translateX(calc(100vw + 50px))' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'float': 'float 3s ease-in-out infinite',
				'island-glow': 'island-glow 4s ease-in-out infinite',
				'pulse-slow': 'pulse-slow 2s ease-in-out infinite',
				'bounce-subtle': 'bounce-subtle 0.3s ease-in-out',
				'pixel-walk': 'pixel-walk 0.6s ease-in-out infinite',
				'drift-clouds': 'drift-clouds 20s linear infinite',
				'parallax-slow': 'parallax-slow 30s linear infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
