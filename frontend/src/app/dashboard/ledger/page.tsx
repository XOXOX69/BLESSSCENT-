'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ledgerApi, resellersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Plus,
  BookOpen,
  DollarSign,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';

export default function LedgerPage() {
  const [activeTab, setActiveTab] = useState('entries');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedReseller, setSelectedReseller] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['ledger', page, search],
    queryFn: async () => {
      const response = await ledgerApi.getAll({ page, limit: 20, search });
      return response.data;
    },
  });

  const { data: aging } = useQuery({
    queryKey: ['ledger-aging'],
    queryFn: async () => {
      const response = await ledgerApi.getAging();
      return response.data;
    },
  });

  const { data: overdue } = useQuery({
    queryKey: ['ledger-overdue'],
    queryFn: async () => {
      const response = await ledgerApi.getOverdue();
      return response.data;
    },
  });

  const { data: resellers } = useQuery({
    queryKey: ['resellers-list'],
    queryFn: async () => {
      const response = await resellersApi.getAll({ limit: 100 });
      return response.data;
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (data: any) => ledgerApi.recordPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      queryClient.invalidateQueries({ queryKey: ['ledger-aging'] });
      queryClient.invalidateQueries({ queryKey: ['ledger-overdue'] });
      setShowPaymentDialog(false);
      setPaymentAmount(0);
      setPaymentNote('');
      setSelectedReseller('');
      toast.success('Payment recorded');
    },
    onError: () => {
      toast.error('Failed to record payment');
    },
  });

  const getEntryType = (entry: any) => {
    if (entry.type === 'credit' || entry.amount > 0) {
      return { label: 'Credit', icon: ArrowUpRight, color: 'text-red-600' };
    }
    return { label: 'Payment', icon: ArrowDownLeft, color: 'text-green-600' };
  };

  const getAgingStatus = (daysOverdue: number) => {
    if (daysOverdue > 60) return { label: '60+ days', variant: 'destructive' as const };
    if (daysOverdue > 30) return { label: '31-60 days', variant: 'secondary' as const };
    if (daysOverdue > 0) return { label: '1-30 days', variant: 'outline' as const };
    return { label: 'Current', variant: 'default' as const };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ledger</h1>
          <p className="text-muted-foreground">Track credit and payments</p>
        </div>
        <Button onClick={() => setShowPaymentDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Record Payment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receivables</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₱{(aging?.totalReceivables || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₱{(aging?.current || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">1-30 Days</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ₱{(aging?.days1to30 || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">31+ Days</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">
              ₱{((aging?.days31to60 || 0) + (aging?.days60plus || 0)).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="entries" className="gap-2">
            <BookOpen className="h-4 w-4" />
            All Entries
          </TabsTrigger>
          <TabsTrigger value="overdue" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Overdue ({overdue?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entries">
          <Card>
            <CardHeader>
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search entries..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reseller</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : data?.items?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No ledger entries found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.items?.map((entry: any) => {
                      const type = getEntryType(entry);
                      const Icon = type.icon;
                      return (
                        <TableRow key={entry.id}>
                          <TableCell>
                            {format(new Date(entry.createdAt), 'MMM d, yyyy')}
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(entry.createdAt), 'h:mm a')}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {entry.reseller?.name || '-'}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {entry.referenceNo || '-'}
                          </TableCell>
                          <TableCell>
                            <div className={`flex items-center gap-1 ${type.color}`}>
                              <Icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </TableCell>
                          <TableCell className={`text-right font-medium ${type.color}`}>
                            {entry.type === 'payment' ? '-' : '+'}₱
                            {Math.abs(entry.amount).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₱{(entry.runningBalance || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {entry.notes || '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data?.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {data.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= data.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reseller</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdue?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No overdue entries</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    overdue?.map((entry: any) => {
                      const daysOverdue = differenceInDays(new Date(), new Date(entry.dueDate));
                      const status = getAgingStatus(daysOverdue);
                      return (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">
                            {entry.reseller?.name}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {entry.referenceNo}
                          </TableCell>
                          <TableCell>
                            {format(new Date(entry.dueDate), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-right font-medium text-red-600">
                            ₱{entry.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>
                              {daysOverdue} days overdue
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedReseller(entry.resellerId);
                                setPaymentAmount(entry.amount);
                                setShowPaymentDialog(true);
                              }}
                            >
                              Record Payment
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              paymentMutation.mutate({
                resellerId: selectedReseller,
                amount: paymentAmount,
                paymentMethod,
                notes: paymentNote,
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="reseller">Reseller *</Label>
              <Select value={selectedReseller} onValueChange={setSelectedReseller}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reseller" />
                </SelectTrigger>
                <SelectContent>
                  {resellers?.items?.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} (₱{(r.creditUsed || 0).toLocaleString()} owed)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₱) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="gcash">GCash</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Input
                id="note"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="e.g., Partial payment for INV-001"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedReseller || paymentAmount <= 0 || paymentMutation.isPending}
              >
                Record Payment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
