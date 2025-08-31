import { ReactNode } from 'react';
import JudgeSidebar from '@/components/judge/JudgeSidebar';
import JudgeHeader from '@/components/judge/JudgeHeader';
import { AuthGuard } from '@/components/auth/AuthGuard';

interface Props {
  children: ReactNode;
}

export default function JudgeLayout({ children }: Props) {
  return (
    <AuthGuard requiredRole="judge">
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <JudgeSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <JudgeHeader />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-800 p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}