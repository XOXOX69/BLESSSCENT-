'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/api';
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
import { Search, Boxes, AlertTriangle, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [adjustItem, setAdjustItem] = useState<any>(null);
  const [adjustment, setAdjustment] = useState(0);
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', search, showLowStock],
    queryFn: async () => {
      const response = await inventoryApi.getAll({ lowStock: showLowStock });
      return response.data;
    },
  });

  const { data: lowStockData } = useQuery({
    queryKey: ['inventory-low-stock'],
    queryFn: async () => {
      const response = await inventoryApi.getLowStock();
      return response.data;
    },
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, adjustment, reason }: { id: string; adjustment: number; reason: string }) =>
      inventoryApi.adjust(id, { adjustment, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setAdjustItem(null);
      setAdjustment(0);
      setReason('');
      toast.success('Inventory adjusted successfully');
    },
    onError: () => {
      toast.error('Failed to adjust inventory');
    },
  });

  const handleAdjust = () => {
    if (!adjustItem || adjustment === 0) return;
    adjustMutation.mutate({
      id: adjustItem.id,
      adjustment,
      reason,
    });
  };

  const getStockStatus = (item: any) => {
    if (item.quantityOnHand <= 0) {
      return { label: 'Out of Stock', variant: 'destructive' as const };
    }
    if (item.quantityOnHand <= item.reorderLevel) {
      return { label: 'Low Stock', variant: 'secondary' as const };
    }
    return { label: 'In Stock', variant: 'default' as const };
  };

  const filteredData = data?.items?.filter((item: any) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      item.variant?.name?.toLowerCase().includes(searchLower) ||
      item.variant?.sku?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">Manage stock levels and adjustments</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800">
              {lowStockData?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">
              {data?.items?.filter((i: any) => i.quantityOnHand <= 0).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={showLowStock ? 'default' : 'outline'}
              onClick={() => setShowLowStock(!showLowStock)}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Low Stock Only
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead className="text-right">On Hand</TableHead>
                <TableHead className="text-right">Reserved</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Reorder Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredData?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <Boxes className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No inventory records found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData?.map((item: any) => {
                  const status = getStockStatus(item);
                  const available = item.quantityOnHand - item.quantityReserved;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.variant?.name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.variant?.product?.name}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.variant?.sku}
                      </TableCell>
                      <TableCell>{item.branch?.name || 'Main'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {item.quantityOnHand}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.quantityReserved}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {available}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.reorderLevel}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAdjustItem(item)}
                        >
                          Adjust
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

      {/* Adjust Dialog */}
      <Dialog open={!!adjustItem} onOpenChange={() => setAdjustItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Inventory</DialogTitle>
          </DialogHeader>
          {adjustItem && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="font-medium">{adjustItem.variant?.name}</p>
                <p className="text-sm text-muted-foreground">
                  Current: {adjustItem.quantityOnHand} units
                </p>
              </div>

              <div className="space-y-2">
                <Label>Adjustment</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setAdjustment(adjustment - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={adjustment}
                    onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)}
                    className="text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setAdjustment(adjustment + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  New quantity: {adjustItem.quantityOnHand + adjustment}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Stock count adjustment, Damaged goods"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAdjustItem(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAdjust}
                  disabled={adjustment === 0 || adjustMutation.isPending}
                >
                  Apply Adjustment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
