'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '@/lib/api';
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
import { Search, Plus, MoreHorizontal, Users, Star, Edit, Trash, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function MembersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [showPointsDialog, setShowPointsDialog] = useState(false);
  const [editMember, setEditMember] = useState<any>(null);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [pointsAdjustment, setPointsAdjustment] = useState(0);
  const [pointsReason, setPointsReason] = useState('');
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['members', page, search],
    queryFn: async () => {
      const response = await membersApi.getAll({ page, limit: 20, search });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      editMember ? membersApi.update(editMember.id, data) : membersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setShowDialog(false);
      resetForm();
      toast.success(editMember ? 'Member updated' : 'Member created');
    },
    onError: () => {
      toast.error('Operation failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => membersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Member deleted');
    },
    onError: () => {
      toast.error('Failed to delete member');
    },
  });

  const pointsMutation = useMutation({
    mutationFn: ({ id, points, reason }: { id: string; points: number; reason: string }) =>
      membersApi.adjustPoints(id, { points, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setShowPointsDialog(false);
      setPointsAdjustment(0);
      setPointsReason('');
      toast.success('Points adjusted');
    },
    onError: () => {
      toast.error('Failed to adjust points');
    },
  });

  const resetForm = () => {
    setForm({ firstName: '', lastName: '', phone: '', email: '' });
    setEditMember(null);
  };

  const handleEdit = (member: any) => {
    setEditMember(member);
    setForm({
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      phone: member.phone || '',
      email: member.email || '',
    });
    setShowDialog(true);
  };

  const handlePointsAdjust = (member: any) => {
    setSelectedMember(member);
    setShowPointsDialog(true);
  };

  const getTierBadge = (points: number) => {
    if (points >= 10000) return { label: 'Platinum', color: 'bg-purple-100 text-purple-800' };
    if (points >= 5000) return { label: 'Gold', color: 'bg-yellow-100 text-yellow-800' };
    if (points >= 1000) return { label: 'Silver', color: 'bg-gray-100 text-gray-800' };
    return { label: 'Bronze', color: 'bg-orange-100 text-orange-800' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Members</h1>
          <p className="text-muted-foreground">Manage loyalty members and points</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowDialog(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active This Month</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.activeThisMonth || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data?.totalPoints || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
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
                <TableHead>Member</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
                <TableHead>Last Purchase</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No members found</p>
                  </TableCell>
                </TableRow>
              ) : (
                data?.items?.map((member: any) => {
                  const tier = getTierBadge(member.points || 0);
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="font-medium">{member.firstName} {member.lastName}</div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {member.memberCode}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{member.phone || '-'}</div>
                        <div className="text-sm text-muted-foreground">{member.email || ''}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={tier.color}>{tier.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {(member.points || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ₱{(member.totalSpent || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {member.lastPurchaseDate
                          ? format(new Date(member.lastPurchaseDate), 'MMM d, yyyy')
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
                            <DropdownMenuItem onClick={() => handleEdit(member)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePointsAdjust(member)}>
                              <Gift className="mr-2 h-4 w-4" />
                              Adjust Points
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                if (confirm('Delete this member?')) {
                                  deleteMutation.mutate(member.id);
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

      {/* Member Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMember ? 'Edit Member' : 'Add Member'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(form);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                />
              </div>
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
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {editMember ? 'Save Changes' : 'Add Member'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Points Dialog */}
      <Dialog open={showPointsDialog} onOpenChange={setShowPointsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Points</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="font-medium">{selectedMember.firstName} {selectedMember.lastName}</p>
                <p className="text-sm text-muted-foreground">
                  Current points: {(selectedMember.points || 0).toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="points">Points Adjustment</Label>
                <Input
                  id="points"
                  type="number"
                  value={pointsAdjustment}
                  onChange={(e) => setPointsAdjustment(parseInt(e.target.value) || 0)}
                  placeholder="Enter positive or negative amount"
                />
                <p className="text-sm text-muted-foreground">
                  New balance: {((selectedMember.points || 0) + pointsAdjustment).toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Input
                  id="reason"
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  placeholder="e.g., Manual adjustment, Promo bonus"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPointsDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    pointsMutation.mutate({
                      id: selectedMember.id,
                      points: pointsAdjustment,
                      reason: pointsReason,
                    });
                  }}
                  disabled={pointsAdjustment === 0 || pointsMutation.isPending}
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
