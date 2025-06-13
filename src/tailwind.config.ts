
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Custom barber shop colors
        barber: {
          "50": "hsl(var(--barber-50))",
          "100": "hsl(var(--barber-100))",
          "200": "hsl(var(--barber-200))",
          "300": "hsl(var(--barber-300))",
          "400": "hsl(var(--barber-400))",
          "500": "hsl(var(--barber-500))",
          "600": "hsl(var(--barber-600))",
          "700": "hsl(var(--barber-700))",
          "800": "hsl(var(--barber-800))",
          "900": "hsl(var(--barber-900))",
          "950": "hsl(var(--barber-950))",
        },
        // Soft UI colors
        "soft-green": "hsl(var(--soft-green))",
        "soft-blue": "hsl(var(--soft-blue))",
        "soft-purple": "hsl(var(--soft-purple))",
        "soft-yellow": "hsl(var(--soft-yellow))",
        "soft-orange": "hsl(var(--soft-orange))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          }
        },
        "scale-in": {
          "0%": {
            opacity: "0",
            transform: "scale(0.9)"
          },
          "100%": {
            opacity: "1",
            transform: "scale(1)"
          }
        },
        "float": {
          "0%, 100%": {
            transform: "translateY(0px)"
          },
          "50%": {
            transform: "translateY(-10px)"
          }
        },
        "spin-slow": {
          "0%": {
            transform: "rotate(0deg)"
          },
          "100%": {
            transform: "rotate(360deg)"
          }
        },
        "glow": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)"
          },
          "50%": {
            boxShadow: "0 0 40px rgba(59, 130, 246, 0.8)"
          }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out",
        "scale-in": "scale-in 0.4s ease-out",
        "float": "float 3s ease-in-out infinite",
        "spin-slow": "spin-slow 3s linear infinite",
        "glow": "glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
