'use client';

import { PageTransition } from '@/shared/components/PageTransition';

export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
