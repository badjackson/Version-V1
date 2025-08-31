import { ReactNode } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { AuthGuard } from '@/components/auth/AuthGuard';

interface Props {
  children: ReactNode;
}

export default function AdminLayout({ children }: Props) {
  return (
    <AuthGuard requiredRole="admin">
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-800 p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}