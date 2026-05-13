'use client';

/**
 * Providers — Client-side provider wrapper for the app.
 * Keeps the root layout as a server component while wrapping children with client providers.
 */

import { AuthProvider } from '@/shared/providers/AuthProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
