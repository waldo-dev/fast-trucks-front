/**
 * Configuration file for environment variables
 * All environment variables should be accessed through this file
 */

export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10),
  },
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Fast Trucks Admin',
  },
  auth: {
    enabled: process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true',
  },
} as const;





