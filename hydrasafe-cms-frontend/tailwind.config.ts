import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        // Mercedes inspired colors
        mercedes: {
          black: "#000000",
          silver: "#E4E5E7",
          carbon: "#2C2C2C",
          chrome: "#BBBCBE",
          obsidian: "#1A1E22",
          amg: "#FF0000", // AMG red
          eq: "#00D2FF", // EQ blue
        },
        brand: {
          DEFAULT: "#00D2FF", // Mercedes EQ Blue
          dark: "#00B8E5",
          light: "#E7FDFF",
        },
        risk: {
          low: "#10B981",
          medium: "#F59E0B",
          high: "#F97316",
          critical: "#EF4444",
        },
        // CMS theme colors
        cms: {
          primary: "#00D2FF",
          secondary: "#1F2937",
          error: "#DC2626",
          success: "#10B981",
          warning: "#F59E0B",
          info: "#3B82F6",
          background: "#0F1117",
          "background-hover": "rgba(255, 255, 255, 0.05)",
          sidebar: "#1A1E22",
          card: "#1A1E22",
          border: "#2C2C2C",
          text: "#FFFFFF",
          "text-muted": "#9CA3AF",
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mercedes: ['Inter', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'mercedes': '0 10px 30px rgba(0, 0, 0, 0.15)',
        'mercedes-inner': 'inset 0 1px 3px rgba(255, 255, 255, 0.1)',
        'mercedes-glow': '0 0 15px rgba(0, 210, 255, 0.5)',
      },
      backgroundImage: {
        'mercedes-gradient': 'linear-gradient(135deg, #1A1E22 0%, #2C2C2C 100%)',
        'mercedes-glow': 'radial-gradient(circle at center, rgba(0, 210, 255, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
        'mercedes-carbon': 'linear-gradient(45deg, #1A1E22 25%, #2C2C2C 25%, #2C2C2C 50%, #1A1E22 50%, #1A1E22 75%, #2C2C2C 75%, #2C2C2C 100%)',
      },
    },
  },
  plugins: [],
};

export default config;