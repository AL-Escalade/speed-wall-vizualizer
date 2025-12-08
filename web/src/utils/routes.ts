/**
 * Centralized route definitions
 */

export const ROUTES = {
  HOME: '/',
  PRINT: '/print',
  SHARE: (encoded: string) => `/s/${encoded}`,
  SHARE_PATTERN: '/s/:encoded',
} as const;
