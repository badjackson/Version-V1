import { ReactNode } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';

interface Props {
  children: ReactNode;
}

export default function ToolsLayout({ children }: Props) {
  return (
    <AuthGuard requiredRole="admin">
      {children}
    </AuthGuard>
  );
}