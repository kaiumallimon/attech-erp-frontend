/**
 * Centralized Environment Configuration
 * Provides typed, validated access to environment variables across client and server.
 */

export const env = {
  /**
   * Public Client-side API URL for browser requests.
   */
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',

  /**
   * Internal Server-to-Server API URL for Next.js SSR / Route Handlers.
   */
  internalApiUrl:
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8000/api/v1',

  /**
   * Frontend Application Public URL.
   */
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  /**
   * Environment flags.
   */
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
} as const;

export default env;
