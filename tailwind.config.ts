// import type { Config } from "tailwindcss";

// const config: Config = {
//   darkMode: ["class"],
//   content: [
//     "./pages/**/*.{js,ts,jsx,tsx,mdx}",
//     "./components/**/*.{js,ts,jsx,tsx,mdx}",
//     "./app/**/*.{js,ts,jsx,tsx,mdx}",
//   ],
//   theme: {
//     container: {
//       center: true,
//       padding: "2rem",
//       screens: {
//         "2xl": "1400px",
//       },
//     },
//     extend: {
//       colors: {
//         border: "hsl(var(--border))",
//         input: "hsl(var(--input))",
//         ring: "hsl(var(--ring))",
//         background: "hsl(var(--background))",
//         foreground: "hsl(var(--foreground))",
//         primary: {
//           DEFAULT: "hsl(var(--primary))",
//           foreground: "hsl(var(--primary-foreground))",
//         },
//         secondary: {
//           DEFAULT: "hsl(var(--secondary))",
//           foreground: "hsl(var(--secondary-foreground))",
//         },
//         destructive: {
//           DEFAULT: "hsl(var(--destructive))",
//           foreground: "hsl(var(--destructive-foreground))",
//         },
//         muted: {
//           DEFAULT: "hsl(var(--muted))",
//           foreground: "hsl(var(--muted-foreground))",
//         },
//         accent: {
//           DEFAULT: "hsl(var(--accent))",
//           foreground: "hsl(var(--accent-foreground))",
//         },
//         popover: {
//           DEFAULT: "hsl(var(--popover))",
//           foreground: "hsl(var(--popover-foreground))",
//         },
//         card: {
//           DEFAULT: "hsl(var(--card))",
//           foreground: "hsl(var(--card-foreground))",
//         },
//         // Removation.ai Brand Colors
//         brand: {
//           50: "#fdf4ff",
//           100: "#fae8ff",
//           200: "#f5d0fe",
//           300: "#f0abfc",
//           400: "#e879f9",
//           500: "#d946ef",
//           600: "#c026d3",
//           700: "#a21caf",
//           800: "#86198f",
//           900: "#701a75",
//           950: "#4a044e",
//         },
//         vastu: {
//           good: "#22c55e",
//           warning: "#eab308",
//           bad: "#ef4444",
//           neutral: "#6b7280",
//         },
//         gradient: {
//           start: "#7c3aed",
//           middle: "#c026d3",
//           end: "#f97316",
//         },
//       },
//       borderRadius: {
//         lg: "var(--radius)",
//         md: "calc(var(--radius) - 2px)",
//         sm: "calc(var(--radius) - 4px)",
//       },
//       fontFamily: {
//         sans: ["var(--font-inter)", "system-ui", "sans-serif"],
//         display: ["var(--font-cabinet)", "system-ui", "sans-serif"],
//         hindi: ["var(--font-noto-sans-devanagari)", "system-ui", "sans-serif"],
//       },
//       keyframes: {
//         "accordion-down": {
//           from: { height: "0" },
//           to: { height: "var(--radix-accordion-content-height)" },
//         },
//         "accordion-up": {
//           from: { height: "var(--radix-accordion-content-height)" },
//           to: { height: "0" },
//         },
//         shimmer: {
//           "0%": { backgroundPosition: "-200% 0" },
//           "100%": { backgroundPosition: "200% 0" },
//         },
//         "slide-in-right": {
//           "0%": { transform: "translateX(100%)", opacity: "0" },
//           "100%": { transform: "translateX(0)", opacity: "1" },
//         },
//         "slide-in-left": {
//           "0%": { transform: "translateX(-100%)", opacity: "0" },
//           "100%": { transform: "translateX(0)", opacity: "1" },
//         },
//         "slide-in-bottom": {
//           "0%": { transform: "translateY(100%)", opacity: "0" },
//           "100%": { transform: "translateY(0)", opacity: "1" },
//         },
//         "fade-in": {
//           "0%": { opacity: "0" },
//           "100%": { opacity: "1" },
//         },
//         "scale-in": {
//           "0%": { transform: "scale(0.95)", opacity: "0" },
//           "100%": { transform: "scale(1)", opacity: "1" },
//         },
//         float: {
//           "0%, 100%": { transform: "translateY(0)" },
//           "50%": { transform: "translateY(-10px)" },
//         },
//         pulse: {
//           "0%, 100%": { opacity: "1" },
//           "50%": { opacity: "0.5" },
//         },
//         "spin-slow": {
//           "0%": { transform: "rotate(0deg)" },
//           "100%": { transform: "rotate(360deg)" },
//         },
//         glow: {
//           "0%, 100%": { boxShadow: "0 0 5px rgba(192, 38, 211, 0.5)" },
//           "50%": { boxShadow: "0 0 20px rgba(192, 38, 211, 0.8)" },
//         },
//       },
//       animation: {
//         "accordion-down": "accordion-down 0.2s ease-out",
//         "accordion-up": "accordion-up 0.2s ease-out",
//         shimmer: "shimmer 2s infinite linear",
//         "slide-in-right": "slide-in-right 0.3s ease-out",
//         "slide-in-left": "slide-in-left 0.3s ease-out",
//         "slide-in-bottom": "slide-in-bottom 0.3s ease-out",
//         "fade-in": "fade-in 0.2s ease-out",
//         "scale-in": "scale-in 0.2s ease-out",
//         float: "float 3s ease-in-out infinite",
//         "pulse-slow": "pulse 3s ease-in-out infinite",
//         "spin-slow": "spin-slow 20s linear infinite",
//         glow: "glow 2s ease-in-out infinite",
//       },
//       backgroundImage: {
//         "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
//         "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
//         "gradient-brand": "linear-gradient(135deg, #7c3aed 0%, #c026d3 50%, #f97316 100%)",
//         "gradient-shimmer": "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
//       },
//       boxShadow: {
//         glow: "0 0 20px rgba(192, 38, 211, 0.3)",
//         "glow-lg": "0 0 40px rgba(192, 38, 211, 0.4)",
//         "inner-glow": "inset 0 0 20px rgba(192, 38, 211, 0.2)",
//       },
//     },
//   },
//   plugins: [require("tailwindcss-animate")],
// };

// export default config;
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
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
        // Removation.ai Brand Colors
        brand: {
          50: "#fdf4ff",
          100: "#fae8ff",
          200: "#f5d0fe",
          300: "#f0abfc",
          400: "#e879f9",
          500: "#d946ef",
          600: "#c026d3",
          700: "#a21caf",
          800: "#86198f",
          900: "#701a75",
          950: "#4a044e",
        },
        vastu: {
          good: "#22c55e",
          warning: "#eab308",
          bad: "#ef4444",
          neutral: "#6b7280",
        },
        gradient: {
          start: "#7c3aed",
          middle: "#c026d3",
          end: "#f97316",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-cabinet)", "system-ui", "sans-serif"],
        hindi: ["var(--font-noto-sans-devanagari)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-in-bottom": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 5px rgba(192, 38, 211, 0.5)" },
          "50%": { boxShadow: "0 0 20px rgba(192, 38, 211, 0.8)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite linear",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "slide-in-bottom": "slide-in-bottom 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        float: "float 3s ease-in-out infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "spin-slow": "spin-slow 20s linear infinite",
        glow: "glow 2s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-brand": "linear-gradient(135deg, #7c3aed 0%, #c026d3 50%, #f97316 100%)",
        "gradient-shimmer": "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
      },
      boxShadow: {
        glow: "0 0 20px rgba(192, 38, 211, 0.3)",
        "glow-lg": "0 0 40px rgba(192, 38, 211, 0.4)",
        "inner-glow": "inset 0 0 20px rgba(192, 38, 211, 0.2)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/nesting"), // Add this FIRST
    require("tailwindcss-animate"),
  ],
};

export default config;