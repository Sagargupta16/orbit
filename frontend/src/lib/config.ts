// API base URL. Empty string in dev so requests hit the Vite /api proxy.
// In production (GitHub Pages), set VITE_API_BASE_URL to the Vercel backend URL.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
