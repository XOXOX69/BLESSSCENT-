'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi, resellersApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Trophy,
  Medal,
  Award,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: number;
  color?: string;
}

function StatCard({ title, value, description, icon, trend, color = 'primary' }: StatCardProps) {
  const colorClasses = {
    primary: 'bg-[#f59e0b]/10 text-[#f59e0b]',
    green: 'bg-[#22c55e]/10 text-[#22c55e]',
    blue: 'bg-[#0ea5e9]/10 text-[#0ea5e9]',
    purple: 'bg-[#a855f7]/10 text-[#a855f7]',
    orange: 'bg-[#f97316]/10 text-[#f97316]',
    yellow: 'bg-[#f59e0b]/10 text-[#f59e0b]',
  };

  const glowColors = {
    primary: 'bg-[#f59e0b]',
    green: 'bg-[#22c55e]',
    blue: 'bg-[#0ea5e9]',
    purple: 'bg-[#a855f7]',
    orange: 'bg-[#f97316]',
    yellow: 'bg-[#f59e0b]',
  };

  return (
    <Card className="relative overflow-hidden border-0 shadow-sneat hover:shadow-sneat-lg hover:scale-[1.02] transition-all duration-300 bg-white group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-[#a8a29e]">
          {title}
        </CardTitle>
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl sm:text-3xl font-bold text-[#78716c]">{value}</div>
        {(description || trend !== undefined) && (
          <div className="flex items-center mt-2 flex-wrap gap-2">
            {trend !== undefined && (
              <div className={`flex items-center text-sm font-medium ${trend >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                {trend >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {Math.abs(trend)}%
              </div>
            )}
            {description && (
              <p className="text-xs text-[#a8a29e]">{description}</p>
            )}
          </div>
        )}
      </CardContent>
      {/* Decorative glow */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 opacity-10 rounded-full blur-2xl ${glowColors[color as keyof typeof glowColors]} group-hover:opacity-20 transition-opacity`} />
    </Card>
  );
}

function AlertCard({ title, value, description, icon, variant }: { 
  title: string; 
  value: number; 
  description: string; 
  icon: React.ReactNode;
  variant: 'warning' | 'danger' | 'info';
}) {
  const variants = {
    warning: 'bg-[#f97316]/5 border-[#f97316]/20',
    danger: 'bg-[#ef4444]/5 border-[#ef4444]/20',
    info: 'bg-[#0ea5e9]/5 border-[#0ea5e9]/20',
  };
  
  const textVariants = {
    warning: 'text-[#f97316]',
    danger: 'text-[#ef4444]',
    info: 'text-[#0ea5e9]',
  };

  const glowVariants = {
    warning: 'bg-[#f97316]',
    danger: 'bg-[#ef4444]',
    info: 'bg-[#0ea5e9]',
  };

  return (
    <Card className={`${variants[variant]} border shadow-sneat hover:shadow-sneat-lg hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group bg-white`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${textVariants[variant]}`}>{title}</p>
            <p className={`text-3xl font-bold mt-1 ${textVariants[variant]}`}>{value}</p>
            <p className={`text-xs mt-1 ${textVariants[variant]} opacity-80`}>{description}</p>
          </div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${textVariants[variant]} bg-white/70 backdrop-blur-sm shadow-inner`}>
            {icon}
          </div>
        </div>
      </CardContent>
      <div className={`absolute -bottom-8 -right-8 w-24 h-24 opacity-20 rounded-full blur-2xl ${glowVariants[variant]} group-hover:opacity-30 transition-opacity`} />
    </Card>
  );
}

export default function DashboardPage() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await dashboardApi.getSummary();
      return response.data;
    },
  });

  const { data: topResellers, isLoading: loadingResellers } = useQuery({
    queryKey: ['topResellers'],
    queryFn: async () => {
      const response = await resellersApi.getTopResellers(3);
      return response.data;
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Mock hourly data for chart
  const hourlyData = Array.from({ length: 12 }, (_, i) => ({
    hour: `${(i + 8).toString().padStart(2, '0')}:00`,
    sales: Math.floor(Math.random() * 10000) + 1000,
  }));

  const weeklyData = [
    { day: 'Mon', sales: 12000, orders: 45 },
    { day: 'Tue', sales: 15000, orders: 52 },
    { day: 'Wed', sales: 18000, orders: 61 },
    { day: 'Thu', sales: 14000, orders: 48 },
    { day: 'Fri', sales: 22000, orders: 75 },
    { day: 'Sat', sales: 28000, orders: 92 },
    { day: 'Sun', sales: 20000, orders: 68 },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#78716c]">Dashboard</h1>
          <p className="text-[#a8a29e] text-sm mt-1">Welcome back! Here&apos;s your business overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#f59e0b]" />
          <Badge variant="outline" className="text-xs bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20">
            Last updated: {new Date().toLocaleTimeString()}
          </Badge>
        </div>
      </div>

      {/* Stats Grid - 2 cols on mobile, 4 on desktop */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(dashboard?.today?.sales || 0)}
          description={`${dashboard?.today?.transactions || 0} transactions`}
          icon={<DollarSign className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          title="This Month"
          value={formatCurrency(dashboard?.thisMonth?.sales || 0)}
          trend={dashboard?.thisMonth?.growth || 12}
          icon={<TrendingUp className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title="New Members"
          value={dashboard?.today?.newMembers || 0}
          description="Registered today"
          icon={<Users className="h-5 w-5" />}
          color="purple"
        />
        <StatCard
          title="Low Stock"
          value={dashboard?.lowStockAlerts || 0}
          description="Need restocking"
          icon={<AlertTriangle className="h-5 w-5" />}
          color="orange"
        />
      </div>

      {/* Charts - Stack on mobile, side by side on desktop */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-sneat bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#78716c]">
                <Clock className="h-5 w-5 text-[#f59e0b]" />
                Today&apos;s Sales
              </CardTitle>
              <Badge variant="secondary" className="text-xs bg-[#f59e0b]/10 text-[#f59e0b] border-0">Hourly</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="#a8a29e" />
                <YAxis tick={{ fontSize: 11 }} stroke="#a8a29e" />
                <Tooltip
                  formatter={(value) => [formatCurrency(value as number), 'Sales']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #fde68a', boxShadow: '0 2px 6px rgba(67, 89, 113, 0.12)', background: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#salesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sneat bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#78716c]">
                <ShoppingCart className="h-5 w-5 text-[#f59e0b]" />
                Weekly Performance
              </CardTitle>
              <Badge variant="secondary" className="text-xs bg-[#f59e0b]/10 text-[#f59e0b] border-0">This Week</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#a8a29e" />
                <YAxis tick={{ fontSize: 11 }} stroke="#a8a29e" />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'sales' ? formatCurrency(value as number) : value,
                    name === 'sales' ? 'Sales' : 'Orders'
                  ]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #fde68a', boxShadow: '0 2px 6px rgba(67, 89, 113, 0.12)', background: '#fff' }}
                />
                <Bar dataKey="sales" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alert Cards - Stack on mobile, 3 cols on desktop */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AlertCard
          title="Low Stock Items"
          value={dashboard?.lowStockAlerts || 0}
          description="Items below reorder level"
          icon={<Package className="h-6 w-6" />}
          variant="warning"
        />
        <AlertCard
          title="Overdue Payments"
          value={dashboard?.overduePayments || 0}
          description="Reseller accounts overdue"
          icon={<AlertTriangle className="h-6 w-6" />}
          variant="danger"
        />
        <AlertCard
          title="New Members"
          value={dashboard?.thisMonth?.newMembers || 0}
          description="This month's registrations"
          icon={<Users className="h-6 w-6" />}
          variant="info"
        />
      </div>

      {/* Top 3 Resellers Section */}
      <Card className="border-0 shadow-sneat bg-white relative overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#78716c]">
              <Trophy className="h-5 w-5 text-[#f59e0b]" />
              Top Resellers
            </CardTitle>
            <Badge variant="secondary" className="text-xs bg-[#f59e0b]/10 text-[#f59e0b] border-0">By Total Purchases</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loadingResellers ? (
            <div className="flex justify-center gap-8 py-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center animate-pulse">
                  <div className="w-20 h-20 rounded-full bg-gray-200 mb-3" />
                  <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-16 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : topResellers && topResellers.length > 0 ? (
            <div className="flex flex-col sm:flex-row justify-center items-center sm:items-end gap-8 py-4">
              {/* Second Place */}
              {topResellers[1] && (
                <div className="flex flex-col items-center order-1 sm:order-1">
                  <div className="relative mb-3">
                    <Avatar className="w-16 h-16 border-4 border-[#a8a29e] shadow-lg">
                      <AvatarImage src={topResellers[1].imageUrl} alt={topResellers[1].company} />
                      <AvatarFallback className="bg-[#a8a29e]/10 text-[#78716c] text-lg font-bold">
                        {topResellers[1].company?.[0] || 'R'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-[#a8a29e] rounded-full p-1">
                      <Medal className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-[#78716c] text-sm truncate max-w-[120px]">{topResellers[1].company}</p>
                    <p className="text-xs text-[#a8a29e]">{topResellers[1].contactPerson}</p>
                    <p className="text-sm font-bold text-[#78716c] mt-1">
                      {formatCurrency(topResellers[1].totalPurchases || 0)}
                    </p>
                  </div>
                </div>
              )}

              {/* First Place */}
              {topResellers[0] && (
                <div className="flex flex-col items-center order-0 sm:order-2">
                  <div className="relative mb-3">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Trophy className="h-6 w-6 text-[#f59e0b]" />
                    </div>
                    <Avatar className="w-24 h-24 border-4 border-[#f59e0b] shadow-xl ring-4 ring-[#f59e0b]/20">
                      <AvatarImage src={topResellers[0].imageUrl} alt={topResellers[0].company} />
                      <AvatarFallback className="bg-[#f59e0b]/10 text-[#f59e0b] text-2xl font-bold">
                        {topResellers[0].company?.[0] || 'R'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-[#f59e0b] rounded-full p-1.5">
                      <Award className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <Badge className="mb-1 bg-[#f59e0b]/10 text-[#f59e0b] hover:bg-[#f59e0b]/20">#1 Top Seller</Badge>
                    <p className="font-bold text-[#78716c] truncate max-w-[140px]">{topResellers[0].company}</p>
                    <p className="text-sm text-[#a8a29e]">{topResellers[0].contactPerson}</p>
                    <p className="text-lg font-bold text-[#f59e0b] mt-1">
                      {formatCurrency(topResellers[0].totalPurchases || 0)}
                    </p>
                  </div>
                </div>
              )}

              {/* Third Place */}
              {topResellers[2] && (
                <div className="flex flex-col items-center order-2 sm:order-3">
                  <div className="relative mb-3">
                    <Avatar className="w-14 h-14 border-4 border-[#f97316] shadow-lg">
                      <AvatarImage src={topResellers[2].imageUrl} alt={topResellers[2].company} />
                      <AvatarFallback className="bg-[#f97316]/10 text-[#f97316] text-lg font-bold">
                        {topResellers[2].company?.[0] || 'R'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-[#f97316] rounded-full p-1">
                      <Medal className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-[#78716c] text-sm truncate max-w-[100px]">{topResellers[2].company}</p>
                    <p className="text-xs text-[#a8a29e]">{topResellers[2].contactPerson}</p>
                    <p className="text-sm font-bold text-[#f97316] mt-1">
                      {formatCurrency(topResellers[2].totalPurchases || 0)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-gray-500">
              <Trophy className="h-12 w-12 mb-2 opacity-30" />
              <p className="text-sm">No reseller data available yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
