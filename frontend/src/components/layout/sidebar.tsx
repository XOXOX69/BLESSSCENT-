'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Boxes,
  Tags,
  Users,
  UserCheck,
  CreditCard,
  FileText,
  Settings,
  ChevronLeft,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/inventory', label: 'Inventory', icon: Boxes },
  { href: '/dashboard/pricing', label: 'Pricing', icon: Tags },
  { href: '/dashboard/sales', label: 'Sales', icon: ShoppingCart },
  { href: '/dashboard/members', label: 'Members', icon: Users },
  { href: '/dashboard/resellers', label: 'Resellers', icon: UserCheck },
  { href: '/dashboard/ledger', label: 'Ledger', icon: CreditCard },
  { href: '/dashboard/reports', label: 'Reports', icon: FileText },
  { href: '/dashboard/users', label: 'Users', icon: Settings },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  const handleNavClick = () => {
    // Close sidebar on mobile when a nav item is clicked
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside className="h-full bg-white w-full flex flex-col">
      {/* Logo Section */}
      <div className="flex h-16 items-center justify-between px-5 border-b border-[#fde68a]">
        <Link href="/dashboard" onClick={handleNavClick} className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-base">B</span>
          </div>
          <span className="font-semibold text-xl text-[#78716c]">BLESSCENT</span>
        </Link>
        {/* Close button for mobile */}
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden text-[#a8a29e] hover:text-[#f59e0b] hover:bg-[#f59e0b]/10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className={cn(
                'flex items-center px-4 py-2.5 rounded-lg transition-all duration-200 text-[15px]',
                isActive
                  ? 'bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-white font-medium shadow-lg shadow-[#f59e0b]/30'
                  : 'text-[#78716c] hover:text-[#f59e0b] hover:bg-[#f59e0b]/8'
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-[#a8a29e]")} />
              <span className="ml-3">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#fde68a]">
        <div className="text-xs text-[#a8a29e] text-center">
          © 2025 Blesscent
        </div>
      </div>
    </aside>
  );
}
