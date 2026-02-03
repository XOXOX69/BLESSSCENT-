'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pricingApi } from '@/lib/api';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, Edit, Trash, Tag, Percent, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState('profiles');
  const [search, setSearch] = useState('');
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPromoDialog, setShowPromoDialog] = useState(false);
  const [editProfile, setEditProfile] = useState<any>(null);
  const [editPromo, setEditPromo] = useState<any>(null);
  const queryClient = useQueryClient();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    description: '',
    multiplier: 1,
  });

  // Promo form state
  const [promoForm, setPromoForm] = useState({
    name: '',
    discountType: 'percentage',
    discountValue: 0,
    minimumQuantity: 1,
    startDate: '',
    endDate: '',
  });

  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['price-profiles'],
    queryFn: async () => {
      const response = await pricingApi.getProfiles();
      return response.data;
    },
  });

  const { data: promos, isLoading: promosLoading } = useQuery({
    queryKey: ['promos'],
    queryFn: async () => {
      const response = await pricingApi.getPromos();
      return response.data;
    },
  });

  const profileMutation = useMutation({
    mutationFn: (data: any) =>
      editProfile ? pricingApi.updateProfile(editProfile.id, data) : pricingApi.createProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-profiles'] });
      setShowProfileDialog(false);
      resetProfileForm();
      toast.success(editProfile ? 'Profile updated' : 'Profile created');
    },
    onError: () => {
      toast.error('Operation failed');
    },
  });

  const promoMutation = useMutation({
    mutationFn: (data: any) =>
      editPromo ? pricingApi.updatePromo(editPromo.id, data) : pricingApi.createPromo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promos'] });
      setShowPromoDialog(false);
      resetPromoForm();
      toast.success(editPromo ? 'Promo updated' : 'Promo created');
    },
    onError: () => {
      toast.error('Operation failed');
    },
  });

  const deleteProfileMutation = useMutation({
    mutationFn: (id: string) => pricingApi.deleteProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-profiles'] });
      toast.success('Profile deleted');
    },
    onError: () => {
      toast.error('Failed to delete profile');
    },
  });

  const deletePromoMutation = useMutation({
    mutationFn: (id: string) => pricingApi.deletePromo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promos'] });
      toast.success('Promo deleted');
    },
    onError: () => {
      toast.error('Failed to delete promo');
    },
  });

  const resetProfileForm = () => {
    setProfileForm({ name: '', description: '', multiplier: 1 });
    setEditProfile(null);
  };

  const resetPromoForm = () => {
    setPromoForm({
      name: '',
      discountType: 'percentage',
      discountValue: 0,
      minimumQuantity: 1,
      startDate: '',
      endDate: '',
    });
    setEditPromo(null);
  };

  const handleEditProfile = (profile: any) => {
    setEditProfile(profile);
    setProfileForm({
      name: profile.name,
      description: profile.description || '',
      multiplier: profile.multiplier,
    });
    setShowProfileDialog(true);
  };

  const handleEditPromo = (promo: any) => {
    setEditPromo(promo);
    setPromoForm({
      name: promo.name,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minimumQuantity: promo.minimumQuantity || 1,
      startDate: promo.startDate ? promo.startDate.split('T')[0] : '',
      endDate: promo.endDate ? promo.endDate.split('T')[0] : '',
    });
    setShowPromoDialog(true);
  };

  const getPromoStatus = (promo: any) => {
    const now = new Date();
    const start = promo.startDate ? new Date(promo.startDate) : null;
    const end = promo.endDate ? new Date(promo.endDate) : null;

    if (start && now < start) {
      return { label: 'Scheduled', variant: 'secondary' as const };
    }
    if (end && now > end) {
      return { label: 'Expired', variant: 'destructive' as const };
    }
    return { label: 'Active', variant: 'default' as const };
  };

  const filteredProfiles = profiles?.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPromos = promos?.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pricing</h1>
          <p className="text-muted-foreground">Manage price profiles and promotions</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="profiles" className="gap-2">
              <Tag className="h-4 w-4" />
              Price Profiles
            </TabsTrigger>
            <TabsTrigger value="promos" className="gap-2">
              <Percent className="h-4 w-4" />
              Promotions
            </TabsTrigger>
          </TabsList>
          <Button
            onClick={() => {
              if (activeTab === 'profiles') {
                resetProfileForm();
                setShowProfileDialog(true);
              } else {
                resetPromoForm();
                setShowPromoDialog(true);
              }
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {activeTab === 'profiles' ? 'Add Profile' : 'Add Promo'}
          </Button>
        </div>

        <div className="mt-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <TabsContent value="profiles">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Multiplier</TableHead>
                    <TableHead>Effect</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profilesLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredProfiles?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No price profiles found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProfiles?.map((profile: any) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {profile.description || '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {profile.multiplier.toFixed(2)}x
                        </TableCell>
                        <TableCell>
                          {profile.multiplier < 1 ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {((1 - profile.multiplier) * 100).toFixed(0)}% discount
                            </Badge>
                          ) : profile.multiplier > 1 ? (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {((profile.multiplier - 1) * 100).toFixed(0)}% markup
                            </Badge>
                          ) : (
                            <Badge variant="outline">Standard</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditProfile(profile)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm('Delete this profile?')) {
                                  deleteProfileMutation.mutate(profile.id);
                                }
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promos">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Min Qty</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promosLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredPromos?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Percent className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No promotions found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPromos?.map((promo: any) => {
                      const status = getPromoStatus(promo);
                      return (
                        <TableRow key={promo.id}>
                          <TableCell className="font-medium">{promo.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {promo.discountType === 'percentage' ? (
                                <>
                                  <Percent className="h-4 w-4 text-muted-foreground" />
                                  {promo.discountValue}%
                                </>
                              ) : (
                                <>
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  ₱{promo.discountValue.toFixed(2)}
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{promo.minimumQuantity || 1}</TableCell>
                          <TableCell className="text-sm">
                            {promo.startDate && (
                              <div>{format(new Date(promo.startDate), 'MMM d, yyyy')}</div>
                            )}
                            {promo.endDate && (
                              <div className="text-muted-foreground">
                                to {format(new Date(promo.endDate), 'MMM d, yyyy')}
                              </div>
                            )}
                            {!promo.startDate && !promo.endDate && '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditPromo(promo)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm('Delete this promo?')) {
                                    deletePromoMutation.mutate(promo.id);
                                  }
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
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

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editProfile ? 'Edit Profile' : 'Create Price Profile'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              profileMutation.mutate(profileForm);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="e.g., Reseller, VIP, Wholesale"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={profileForm.description}
                onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="multiplier">Price Multiplier</Label>
              <Input
                id="multiplier"
                type="number"
                step="0.01"
                min="0.01"
                value={profileForm.multiplier}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, multiplier: parseFloat(e.target.value) || 1 })
                }
                required
              />
              <p className="text-sm text-muted-foreground">
                {profileForm.multiplier < 1
                  ? `${((1 - profileForm.multiplier) * 100).toFixed(0)}% discount from base price`
                  : profileForm.multiplier > 1
                  ? `${((profileForm.multiplier - 1) * 100).toFixed(0)}% markup from base price`
                  : 'Same as base price'}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowProfileDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={profileMutation.isPending}>
                {editProfile ? 'Save Changes' : 'Create Profile'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Promo Dialog */}
      <Dialog open={showPromoDialog} onOpenChange={setShowPromoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editPromo ? 'Edit Promotion' : 'Create Promotion'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              promoMutation.mutate(promoForm);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="promo-name">Name</Label>
              <Input
                id="promo-name"
                value={promoForm.name}
                onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })}
                placeholder="e.g., Summer Sale, Buy 2 Get 10% Off"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountType">Discount Type</Label>
                <Select
                  value={promoForm.discountType}
                  onValueChange={(value) => setPromoForm({ ...promoForm, discountType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₱)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountValue">Discount Value</Label>
                <Input
                  id="discountValue"
                  type="number"
                  step="0.01"
                  min="0"
                  value={promoForm.discountValue}
                  onChange={(e) =>
                    setPromoForm({ ...promoForm, discountValue: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimumQuantity">Minimum Quantity</Label>
              <Input
                id="minimumQuantity"
                type="number"
                min="1"
                value={promoForm.minimumQuantity}
                onChange={(e) =>
                  setPromoForm({ ...promoForm, minimumQuantity: parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={promoForm.startDate}
                  onChange={(e) => setPromoForm({ ...promoForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={promoForm.endDate}
                  onChange={(e) => setPromoForm({ ...promoForm, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowPromoDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={promoMutation.isPending}>
                {editPromo ? 'Save Changes' : 'Create Promo'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
