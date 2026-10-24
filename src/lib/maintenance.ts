/**
 * The page everyone is sent to while MAINTENANCE_MODE is on (src/server.ts).
 * Rendered by the app like any page (src/routes/unavailable.tsx), so it looks
 * like the rest of it, but it reads no data: it works with the database
 * half-moved.
 */
export const MAINTENANCE_PATH = '/unavailable'
