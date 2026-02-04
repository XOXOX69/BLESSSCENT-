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
  ChevronRight,
  ShoppingCart,
} from 'lucide-react';
import { useState } from 'react';
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
  const [collapsed, setCollapsed] = useState(false);

  const handleNavClick = () => {
    // Close sidebar on mobile when a nav item is clicked
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside
      className={cn(
        'h-screen bg-black text-white transition-all duration-300 w-64 flex-shrink-0',
        collapsed ? 'lg:w-16' : 'lg:w-64'
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-yellow-900/30">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-sm">B</span>
            </div>
            <span className="font-semibold text-lg text-yellow-400">BLESSCENT</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="text-yellow-400/70 hover:text-yellow-400 hover:bg-yellow-400/10"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className={cn(
                'flex items-center px-3 py-2.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-medium'
                  : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="ml-3">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
