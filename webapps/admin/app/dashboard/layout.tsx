'use client';

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex-1 overflow-auto w-full">
          <div className="p-4">
            <SidebarTrigger />
          </div>
          <main className="py-6 px-4 w-full">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
