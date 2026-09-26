/**
 * Design Tokens (DB Best Worlds Design System)
 * Shared JavaScript exports matching tailwind.config.js tokens.
 */
export const tokens = {
  colors: {
    brand: {
      50: '#f0f7ff',
      100: '#e0effe',
      200: '#bae0fd',
      300: '#7cc5fb',
      400: '#38a5f8',
      500: '#2563eb', // primary action
      600: '#1d4ed8',
      700: '#1d40b0',
      800: '#1e3a8a',
      900: '#1e3a5f',
    },
    success: {
      50: '#f0fdf4',
      500: '#16a34a',
      600: '#15803d',
    },
    warning: {
      50: '#fffbeb',
      500: '#d97706', // for WAITLISTED / RAC badges
      600: '#b45309',
    },
    danger: {
      50: '#fef2f2',
      500: '#dc2626',
      600: '#b91c1c',
    },
    accent: {
      DEFAULT: '#06b6d4',
      hover: '#0891b2',
    },
    surface: {
      light: '#ffffff',
      dark: '#0f172a',
    },
  },
  transitions: {
    fast: '150ms cubic-bezier(0.16, 1, 0.3, 1)',
    normal: '200ms cubic-bezier(0.16, 1, 0.3, 1)',
    slow: '300ms cubic-bezier(0.16, 1, 0.3, 1)',
  },
  borderRadius: {
    card: '1rem',
    pill: '9999px',
  },
} as const;

export default tokens;
