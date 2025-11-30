import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Minimalist Light Blue Theme
        primary: {
          50: '#f0f9ff',   // Very light blue background
          100: '#e0f2fe',  // Light blue background
          200: '#bae6fd',  // Lighter blue fills
          300: '#7dd3fc',  // Light blue accents
          400: '#38bdf8',  // Medium blue
          500: '#0ea5e9',  // Main blue
          600: '#0284c7',  // Darker blue
          700: '#0369a1',  // Dark blue text
          800: '#075985',  // Darker blue text
          900: '#0c4a6e',  // Darkest blue text
        },
        accent: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
        },
      },
    },
  },
  plugins: [],
};
export default config;
