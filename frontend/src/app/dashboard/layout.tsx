'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Loader2, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7fa]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#7367f0] to-[#9e95f5] rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg shadow-[#7367f0]/30">
            <span className="text-white text-2xl font-black">B</span>
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-[#7367f0] mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8f7fa]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar - Sneat style white sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-[260px] z-50
        bg-white shadow-sneat-lg
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>
      
      {/* Main content - pushed right on desktop only */}
      <div className="lg:pl-[260px]">
        {/* Mobile header with menu button */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-[#e4e6e8] px-4 py-3 flex items-center justify-between shadow-sneat">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="text-[#5d596c] h-10 w-10 hover:bg-[#f8f7fa]"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#7367f0] to-[#9e95f5] rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-bold">B</span>
              </div>
              <span className="font-semibold text-[#5d596c]">BLESSCENT</span>
            </div>
          </div>
        </div>
        
        {/* Desktop header */}
        <div className="hidden lg:block">
          <Header />
        </div>
        
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
