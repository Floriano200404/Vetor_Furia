'use client';

/**
 * Providers — Client-side provider wrapper for the app.
 * Keeps the root layout as a server component while wrapping children with client providers.
 */

import { AuthProvider } from '@/shared/providers/AuthProvider';
import { ToastProvider } from '@/shared/components/Toast';
import { ConfirmProvider } from '@/shared/components/ConfirmDialog';
import { FloatingReward } from '@/shared/components/FloatingReward';
import { SystemProvider } from '@/features/system';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <SystemProvider>
            {children}
            <FloatingReward />
          </SystemProvider>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
