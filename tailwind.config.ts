
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
			fontFamily: {
				sans: ['Inter', 'sans-serif'],
			},
			colors: {
				border: {
					DEFAULT: 'var(--border)',
					dark: 'var(--border-dark)',
				},
				input: {
					DEFAULT: 'var(--input)',
					dark: 'var(--input-dark)',
				},
				ring: {
					DEFAULT: 'var(--ring)',
					dark: 'var(--ring-dark)',
				},
				background: {
					DEFAULT: 'var(--background)',
					dark: 'var(--background-dark)',
				},
				foreground: {
					DEFAULT: 'var(--foreground)',
					dark: 'var(--foreground-dark)',
				},
				primary: {
					DEFAULT: 'var(--primary)',
					foreground: 'var(--primary-foreground)',
					dark: 'var(--primary-dark)',
					'dark-foreground': 'var(--primary-dark-foreground)'
				},
				secondary: {
					DEFAULT: 'var(--secondary)',
					foreground: 'var(--secondary-foreground)',
					dark: 'var(--secondary-dark)',
					'dark-foreground': 'var(--secondary-dark-foreground)'
				},
				destructive: {
					DEFAULT: 'var(--destructive)',
					foreground: 'var(--destructive-foreground)',
				},
				muted: {
					DEFAULT: 'var(--muted)',
					foreground: 'var(--muted-foreground)',
					dark: 'var(--muted-dark)',
					'dark-foreground': 'var(--muted-dark-foreground)',
				},
				accent: {
					DEFAULT: 'var(--accent)',
					foreground: 'var(--accent-foreground)',
					dark: 'var(--accent-dark)',
					'dark-foreground': 'var(--accent-dark-foreground)',
				},
				popover: {
					DEFAULT: 'var(--popover)',
					foreground: 'var(--popover-foreground)',
					dark: 'var(--popover-dark)',
					'dark-foreground': 'var(--popover-dark-foreground)',
				},
				card: {
					DEFAULT: 'var(--card)',
					foreground: 'var(--card-foreground)',
					dark: 'var(--card-dark)',
					'dark-foreground': 'var(--card-dark-foreground)',
				},
				sidebar: {
					DEFAULT: 'var(--sidebar-background)',
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
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
				'fade-in': {
					from: { opacity: '0' },
					to: { opacity: '1' },
				},
				'fade-up': {
					from: { 
						opacity: '0',
						transform: 'translateY(10px)'
					},
					to: { 
						opacity: '1',
						transform: 'translateY(0)'
					},
				},
				'slide-in-left': {
					from: { 
						transform: 'translateX(-100%)',
						opacity: '0'
					},
					to: { 
						transform: 'translateX(0)',
						opacity: '1'
					},
				},
				'fade-right': {
					from: { 
						transform: 'translateX(20px)',
						opacity: '0'
					},
					to: { 
						transform: 'translateX(0)',
						opacity: '1'
					},
				},
				'scale-in': {
					from: {
						transform: 'scale(0.95)',
						opacity: '0'
					},
					to: {
						transform: 'scale(1)',
						opacity: '1'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'fade-up': 'fade-up 0.4s ease-out',
				'slide-in-left': 'slide-in-left 0.3s ease-out',
				'fade-right': 'fade-right 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
			},
			boxShadow: {
				'subtle': '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
				'elevation': '0 4px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1)',
				'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
				'premium': '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
				'premium-dark': '0 10px 25px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
			},
			backdropBlur: {
				'xs': '2px',
			},
			spacing: {
				'premium-spacing': '2rem',
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
