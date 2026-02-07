'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resellersApi } from '@/lib/api';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Plus,
  MoreHorizontal,
  Building2,
  CreditCard,
  Edit,
  Trash,
  DollarSign,
  AlertTriangle,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ResellersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [editReseller, setEditReseller] = useState<any>(null);
  const [selectedReseller, setSelectedReseller] = useState<any>(null);
  const [creditAmount, setCreditAmount] = useState(0);
  const [creditNote, setCreditNote] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: 0,
    priceProfileId: '',
    imageUrl: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['resellers', page, search],
    queryFn: async () => {
      const response = await resellersApi.getAll({ page, limit: 20, search });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      editReseller ? resellersApi.update(editReseller.id, data) : resellersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resellers'] });
      setShowDialog(false);
      resetForm();
      toast.success(editReseller ? 'Reseller updated' : 'Reseller created');
    },
    onError: () => {
      toast.error('Operation failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => resellersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resellers'] });
      toast.success('Reseller deleted');
    },
    onError: () => {
      toast.error('Failed to delete reseller');
    },
  });

  const creditMutation = useMutation({
    mutationFn: ({ id, amount, note }: { id: string; amount: number; note: string }) =>
      resellersApi.adjustCredit(id, { amount, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resellers'] });
      setShowCreditDialog(false);
      setCreditAmount(0);
      setCreditNote('');
      toast.success('Credit adjusted');
    },
    onError: () => {
      toast.error('Failed to adjust credit');
    },
  });

  const resetForm = () => {
    setForm({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      creditLimit: 0,
      priceProfileId: '',
      imageUrl: '',
    });
    setEditReseller(null);
    setImagePreview(null);
  };

  const handleEdit = (reseller: any) => {
    setEditReseller(reseller);
    setForm({
      name: reseller.name,
      contactPerson: reseller.contactPerson || '',
      phone: reseller.phone || '',
      email: reseller.email || '',
      address: reseller.address || '',
      creditLimit: reseller.creditLimit || 0,
      priceProfileId: reseller.priceProfileId || '',
      imageUrl: reseller.imageUrl || '',
    });
    setImagePreview(reseller.imageUrl || null);
    setShowDialog(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setForm({ ...form, imageUrl: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setForm({ ...form, imageUrl: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreditAdjust = (reseller: any) => {
    setSelectedReseller(reseller);
    setShowCreditDialog(true);
  };

  const getCreditStatus = (reseller: any) => {
    const used = reseller.creditUsed || 0;
    const limit = reseller.creditLimit || 0;
    const ratio = limit > 0 ? used / limit : 0;

    if (ratio >= 1) return { label: 'Over Limit', variant: 'destructive' as const };
    if (ratio >= 0.8) return { label: 'Near Limit', variant: 'secondary' as const };
    return { label: 'Good', variant: 'default' as const };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Resellers</h1>
          <p className="text-muted-foreground">Manage reseller accounts and credit</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowDialog(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Reseller
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resellers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.activeCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credit Used</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₱{(data?.totalCreditUsed || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Over Limit</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800">{data?.overLimitCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resellers..."
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
                <TableHead>Reseller</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Credit Limit</TableHead>
                <TableHead className="text-right">Credit Used</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : data?.items?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No resellers found</p>
                  </TableCell>
                </TableRow>
              ) : (
                data?.items?.map((reseller: any) => {
                  const status = getCreditStatus(reseller);
                  const available =
                    (reseller.creditLimit || 0) - (reseller.creditUsed || 0);
                  return (
                    <TableRow key={reseller.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={reseller.imageUrl} alt={reseller.name} />
                            <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                              {reseller.name?.[0] || 'R'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{reseller.name}</div>
                            <div className="text-sm text-muted-foreground font-mono">
                              {reseller.resellerCode}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{reseller.contactPerson || '-'}</div>
                        <div className="text-sm text-muted-foreground">
                          {reseller.phone || reseller.email || ''}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        ₱{(reseller.creditLimit || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₱{(reseller.creditUsed || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={available < 0 ? 'text-red-600' : ''}>
                          ₱{available.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {reseller.lastOrderDate
                          ? format(new Date(reseller.lastOrderDate), 'MMM d, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(reseller)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCreditAdjust(reseller)}>
                              <DollarSign className="mr-2 h-4 w-4" />
                              Adjust Credit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                if (confirm('Delete this reseller?')) {
                                  deleteMutation.mutate(reseller.id);
                                }
                              }}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

      {/* Reseller Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editReseller ? 'Edit Reseller' : 'Add Reseller'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(form);
            }}
            className="space-y-4"
          >
            {/* Image Upload */}
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                <Avatar className="h-24 w-24 border-2 border-dashed border-gray-300">
                  <AvatarImage src={imagePreview || undefined} alt="Reseller photo" />
                  <AvatarFallback className="bg-gray-50 text-gray-400">
                    <Building2 className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="reseller-image"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Photo
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Business Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creditLimit">Credit Limit (₱)</Label>
              <Input
                id="creditLimit"
                type="number"
                min="0"
                step="0.01"
                value={form.creditLimit}
                onChange={(e) =>
                  setForm({ ...form, creditLimit: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {editReseller ? 'Save Changes' : 'Add Reseller'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Credit Dialog */}
      <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Credit</DialogTitle>
          </DialogHeader>
          {selectedReseller && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="font-medium">{selectedReseller.name}</p>
                <p className="text-sm text-muted-foreground">
                  Credit Limit: ₱{(selectedReseller.creditLimit || 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Current Used: ₱{(selectedReseller.creditUsed || 0).toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="credit">Payment/Credit Amount (₱)</Label>
                <Input
                  id="credit"
                  type="number"
                  step="0.01"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(parseFloat(e.target.value) || 0)}
                  placeholder="Positive = payment received, Negative = add credit used"
                />
                <p className="text-sm text-muted-foreground">
                  New credit used: ₱
                  {((selectedReseller.creditUsed || 0) - creditAmount).toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Note</Label>
                <Input
                  id="note"
                  value={creditNote}
                  onChange={(e) => setCreditNote(e.target.value)}
                  placeholder="e.g., Payment received via GCash"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreditDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    creditMutation.mutate({
                      id: selectedReseller.id,
                      amount: creditAmount,
                      note: creditNote,
                    });
                  }}
                  disabled={creditAmount === 0 || creditMutation.isPending}
                >
                  Apply
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
