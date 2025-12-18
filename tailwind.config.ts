import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				'50': '#E8EDF3',
  				'100': '#D1DBE7',
  				'200': '#A3B7CF',
  				'300': '#7593B7',
  				'400': '#476F9F',
  				'500': '#1E3A5F',
  				'600': '#182E4C',
  				'700': '#122339',
  				'800': '#0C1726',
  				'900': '#060C13',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				'50': '#EBF0F6',
  				'100': '#D7E1ED',
  				'200': '#AFC3DB',
  				'300': '#87A5C9',
  				'400': '#5F87B7',
  				'500': '#2E5A8F',
  				'600': '#254872',
  				'700': '#1C3656',
  				'800': '#132439',
  				'900': '#0A121D',
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			accent: {
  				'50': '#ECFDF5',
  				'100': '#D1FAE5',
  				'200': '#A7F3D0',
  				'300': '#6EE7B7',
  				'400': '#34D399',
  				'500': '#10B981',
  				'600': '#059669',
  				'700': '#047857',
  				'800': '#065F46',
  				'900': '#064E3B',
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			warning: {
  				'50': '#FFFBEB',
  				'100': '#FEF3C7',
  				'200': '#FDE68A',
  				'300': '#FCD34D',
  				'400': '#FBBF24',
  				'500': '#F59E0B',
  				'600': '#D97706',
  				'700': '#B45309',
  				'800': '#92400E',
  				'900': '#78350F',
  				DEFAULT: '#F59E0B'
  			},
  			danger: {
  				'50': '#FEF2F2',
  				'100': '#FEE2E2',
  				'200': '#FECACA',
  				'300': '#FCA5A5',
  				'400': '#F87171',
  				'500': '#EF4444',
  				'600': '#DC2626',
  				'700': '#B91C1C',
  				'800': '#991B1B',
  				'900': '#7F1D1D',
  				DEFAULT: '#EF4444'
  			},
  			neutral: {
  				'50': '#F9FAFB',
  				'100': '#F3F4F6',
  				'200': '#E5E7EB',
  				'300': '#D1D5DB',
  				'400': '#9CA3AF',
  				'500': '#6B7280',
  				'600': '#4B5563',
  				'700': '#374151',
  				'800': '#1F2937',
  				'900': '#111827',
  				DEFAULT: '#6B7280'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			]
  		},
  		fontSize: {
  			'2xs': [
  				'0.625rem',
  				{
  					lineHeight: '0.875rem'
  				}
  			]
  		},
  		boxShadow: {
  			card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  			'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  			sidebar: '2px 0 8px 0 rgb(0 0 0 / 0.1)'
  		},
  		borderRadius: {
  			xl: '0.75rem',
  			'2xl': '1rem',
  			'3xl': '1.5rem',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		spacing: {
  			'18': '4.5rem',
  			'88': '22rem',
  			'112': '28rem',
  			'128': '32rem'
  		},
  		animation: {
  			'fade-in': 'fadeIn 0.2s ease-in-out',
  			'slide-in': 'slideIn 0.2s ease-out',
  			'spin-slow': 'spin 2s linear infinite',
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			slideIn: {
  				'0%': {
  					transform: 'translateY(-10px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
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
  			}
  		},
  		transitionDuration: {
  			'250': '250ms'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
